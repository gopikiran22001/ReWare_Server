const validateProductFields = (req, res, next) => {
  const {
    name,
    brand,
    size,
    condition,
    colors,
    description,
    tags,
    owner,
    customer,
    category
  } = req.body;

  const errors = [];

  // Required fields
  if (!name) errors.push('Product name is required');
  if (!req.imageUrls || req.imageUrls.length === 0)
    errors.push('At least one image is required');

  // if (!owner || !owner.name || !owner._id)
  //   errors.push('Owner name and ID are required');

  // Optional type validations
  // if (colors && !Array.isArray(colors)) {
  //   errors.push('Colors must be an array');
  // }

  // if (tags && !Array.isArray(tags)) {
  //   errors.push('Tags must be an array');
  // }

  if (brand && typeof brand !== 'string' && brand !== '') {
    errors.push('Brand must be a string');
  }

  if (category && typeof category !== 'string' && category !== '') {
    errors.push('Category must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }


  next();
};

module.exports = validateProductFields;
