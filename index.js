// app.js or index.js
const express = require('express');
const cors=require('cors');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const http = require('http');

const initializeChatServer = require('./Routes/Chat_Socket');
const productRoutes=require('./Routes/Product_Route');
const userRoutes=require('./Routes/User_Route');
const requestRoutes=require('./Routes/Request_Route');
const transactionRoutes=require('./Routes/Transaction_Route');

const connectDB = require('./DataBase/Connection');
connectDB();

app.use(express.json());
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true 
}));
console.log(process.env.ORIGIN);
app.use('/reware/product',productRoutes);
app.use('/reware/user', userRoutes);
app.use('/reware/request', requestRoutes);
app.use('/reware/transaction',transactionRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const server = http.createServer(app);
initializeChatServer(server);

server.listen(8080, () => {
  console.log('Server running with WebSocket on port 8080');
}); 