const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerValidators, loginValidators, updateProfileValidators} = require('../middleware/authValidators');


router.post('/register',registerValidators, validate, registerUser);
router.post('/login',loginValidators, validate, loginUser);

// Protected route — only logged in users can access
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'You accessed a protected route!',
    user: req.user,
  });
});

router.put('/profile', protect, updateProfileValidators, validate, updateProfile);

module.exports = router;