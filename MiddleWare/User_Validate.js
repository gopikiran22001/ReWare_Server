const validateUserFields = (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
  } = req.body;

  const errors = [];

  // Required fields
  if (!firstName || typeof firstName !== 'string') errors.push('First name is required and must be a string');
  if (!lastName || typeof lastName !== 'string') errors.push('Last name is required and must be a string');
  if (!email || typeof email !== 'string') errors.push('Email is required and must be a string');
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  // Respond if any errors found
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next(); // all validations passed
};

module.exports = validateUserFields;
