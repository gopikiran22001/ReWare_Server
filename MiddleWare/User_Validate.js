const validateUserFields = (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    password,
    gender,
    dateOfBirth,
  } = req.body;

  const errors = [];

  // Required fields
  if (!firstName || typeof firstName !== 'string') errors.push('First name is required and must be a string');
  if (!lastName || typeof lastName !== 'string') errors.push('Last name is required and must be a string');
  if (!email || typeof email !== 'string') errors.push('Email is required and must be a string');
  if (!phone || typeof phone !== 'string') errors.push('Phone number is required and must be a string');
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  // Optional validations
  if (address && typeof address !== 'string') errors.push('Address must be a string');

  if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
    errors.push('Gender must be "male", "female", or "other"');
  }

  if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
    errors.push('Date of birth must be a valid date');
  }

  // Respond if any errors found
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next(); // all validations passed
};

module.exports = validateUserFields;
