const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

//Generate JWT ACCESS Token
const generateAccessToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET, {expiresIn:'7d'});
}
//Generate JWT REFRESH Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

//Register User

const registerUser = async(req, res) =>{
    const {name, email, password} = req.body;

    try {
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: 'User already exists'});
        }

         // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateAccessToken(user._id),
    });
    }

    catch (error) {
        res.status(500).json({message : error.message});
    }
};

//Login User

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// update profile

const updateProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only the fields that were sent
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete profile

const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Forget password

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' });
    }

    // Generate raw token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before saving to DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL with raw token
    const resetUrl = `http://localhost:5000/api/auth/resetpassword/${resetToken}`;

    // Send email
    await sendEmail(
      user.email,
      'Password Reset Request',
      `You requested a password reset. Click this link to reset your password:\n\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you did not request this, ignore this email.`
    );

    res.json({ message: 'If that email exists, a reset link has been sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    // Get raw token from URL and hash it
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
  // Refreshtoken

const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'No refresh token found' });
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Find user and check if refresh token matches DB
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}
//logout

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Find user and clear their refresh token in DB
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    // Clear the cookie
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
  // get all user 
// @access admin only
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
// delete User
// @access admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account here' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { registerUser, loginUser, updateProfile, deleteAccount, forgotPassword, resetPassword, refreshToken, logout, getAllUsers, deleteUser };
