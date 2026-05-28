const rateLimit = require('express-rate-limit');


// For login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 10,                   
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,  
  legacyHeaders: false,  
});

// For register route
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,                    
  message: {
    message: 'Too many accounts created from this IP, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, registerLimiter };