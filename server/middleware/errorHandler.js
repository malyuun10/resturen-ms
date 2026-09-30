const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation error occurred.'
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    let customMsg = `A record with this ${field} "${val}" already exists.`;
    if (field === 'username') customMsg = `Username "${val}" is already taken. Please choose another.`;
    if (field === 'name') customMsg = `A menu item or category with the name "${val}" already exists.`;
    if (field === 'tableNumber') customMsg = `Table "${val}" already exists.`;
    return res.status(400).json({
      success: false,
      message: customMsg
    });
  }

  // Cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for resource identifier (${err.path}).`
    });
  }

  // Default server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected server error occurred. Please try again.'
  });
};

module.exports = errorHandler;
