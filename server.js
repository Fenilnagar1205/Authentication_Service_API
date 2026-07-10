const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();
connectDB();

app.use(express.json()); 
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Base route
app.get('/', (req, res) => {
  res.send('Auth API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));