// app.js or index.js
const express = require('express');
const cors=require('cors');
const app = express();
require('dotenv').config();

const productRoutes=require('./Routes/Product_Route');
const userRoutes=require('./Routes/User_Route');

const connectDB = require('./DataBase/Connection');
connectDB();

app.use(express.json());
app.use(cors({
  origin: process.env.ORIGIN, // your frontend URL
  credentials: true // 🔑 allow sending cookies
}));

app.use('/reware/products',productRoutes);
app.use('/reware/users', userRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
