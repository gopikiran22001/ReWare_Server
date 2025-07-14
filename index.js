// app.js or index.js
const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require('./DataBase/Connection');
connectDB();

app.use(express.json());

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
