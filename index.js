// app.js or index.js
const express = require('express');
const cors=require('cors');
const app = express();
require('dotenv').config();

const productRoutes=require('./Routes/Product_Route');

const connectDB = require('./DataBase/Connection');
connectDB();

app.use(express.json());
app.use(cors());

app.use('/reware/products',productRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
