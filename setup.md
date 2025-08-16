# ReWare Setup Guide 🚀

Complete setup instructions for the ReWare sustainable fashion exchange platform.

## Prerequisites

- Node.js v14+
- Python 3.7+
- MongoDB (local or Atlas)
- Cloudinary account

## Backend Setup

1. **Install Dependencies**
```bash
cd ReWare_Server
npm install
pip install -r requirements.txt
```

2. **Environment Configuration**
Create `.env` file:
```env
CLOUDINARY_API_KEY=your_cloudinary_api_key
MONGODB_URI=mongodb://localhost:27017/reware
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=3d
ORIGIN=http://localhost:5173
NODE_ENV=development
```

3. **Start Services**
```bash
# Terminal 1: Main server
npm start

# Terminal 2: ML server
npm run ml
```

## Frontend Setup

1. **Navigate to Frontend**
```bash
cd FrontEnd
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:3000/reware
REACT_APP_WS_URL=ws://localhost:3000/ws
```

4. **Start Development Server**
```bash
npm start
```

## Verification

- Backend: http://localhost:3000/reware/product
- ML Server: http://localhost:5000/predict
- Frontend: http://localhost:3000

## Production Deployment

1. **Build Frontend**
```bash
cd FrontEnd
npm run build
```

2. **Environment Variables**
Update production URLs in environment files

3. **Start Production Servers**
```bash
NODE_ENV=production node index.js
python ml_server.py
```

## Troubleshooting

- **MongoDB Connection**: Ensure MongoDB is running
- **Cloudinary**: Verify API credentials
- **CORS Issues**: Check ORIGIN environment variable
- **WebSocket**: Ensure ports 3000 and 5000 are available