const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile, deleteAccount, forgotPassword, resetPassword, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerValidators, loginValidators, updateProfileValidators, forgotPasswordValidators, resetPasswordValidators} = require('../middleware/authValidators');
const { loginLimiter, registerLimiter} = require('../middleware/rateLimiter')


router.post('/register',registerLimiter, registerValidators, validate, registerUser);
router.post('/login',loginLimiter, loginValidators, validate, loginUser);

// Protected route — only logged in users can access
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'You accessed a protected route!',
    user: req.user,
  });
});

router.put('/profile', protect, updateProfileValidators, validate, updateProfile);
router.delete('/profile', protect, deleteAccount);

router.post('/forgotpassword', forgotPasswordValidators, validate, forgotPassword);
router.put('/resetpassword/:resetToken', resetPasswordValidators, validate, resetPassword);

router.post('/refreshtoken', refreshToken);
router.post('/logout', logout);

module.exports = router;