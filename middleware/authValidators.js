const { body } = require('express-validator');

const registerValidators = [
  body('name')
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidators = [
  body('email')
    .notEmpty()
    .withMessage('Email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const updateProfileValidators = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email'),
];

module.exports = { registerValidators, loginValidators, updateProfileValidators};