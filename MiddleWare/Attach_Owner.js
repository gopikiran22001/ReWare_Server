// middleware/attachOwnerFromJWT.js
const jwt = require('jsonwebtoken');

const attachOwnerFromJWT = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach owner info to req.body (only _id and name)
    req.owner = {
      _id: decoded._id,
      name: decoded.name
    };

    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = attachOwnerFromJWT;
