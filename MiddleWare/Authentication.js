const jwt = require('jsonwebtoken');
const User = require('../Models/User_Model');

const requireLogin = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    // console.log(token)
    return res.status(401).json({ error: 'Access denied. Please login first.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'User not found. Invalid token.' });
    }
    next(); // Proceed to the protected route
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = requireLogin;
