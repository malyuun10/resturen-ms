const User = require('../models/User');

// @desc Get all users (Admin only)
// @route GET /api/users
// @access Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ username: searchRegex }, { fullName: searchRegex }, { phone: searchRegex }];
    }

    if (role && ['admin', 'cashier'].includes(role)) {
      query.role = role;
    }

    if (status !== undefined && status !== '') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get user by ID (Admin only)
// @route GET /api/users/:id
// @access Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create user (Admin only)
// @route POST /api/users
// @access Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, fullName, role, phone, isActive } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and full name.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Username "${cleanUsername}" is already taken.`
      });
    }

    const newUser = await User.create({
      username: cleanUsername,
      password,
      fullName: fullName.trim(),
      role: role === 'admin' ? 'admin' : 'cashier',
      phone: phone ? phone.trim() : '',
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user details (Admin only)
// @route PUT /api/users/:id
// @access Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { fullName, role, phone, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (fullName) user.fullName = fullName.trim();
    if (role && ['admin', 'cashier'].includes(role)) {
      // Don't allow demoting the only admin
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot change the role of the only active Administrator.'
          });
        }
      }
      user.role = role;
    }
    if (phone !== undefined) user.phone = phone.trim();
    if (isActive !== undefined) {
      // Don't allow deactivating oneself
      if (user._id.toString() === req.user._id.toString() && !isActive) {
        return res.status(400).json({
          success: false,
          message: 'You cannot deactivate your own account.'
        });
      }
      user.isActive = isActive;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Toggle user active status (Admin only)
// @route PATCH /api/users/:id/toggle-status
// @access Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc Admin reset password for a user
// @route PUT /api/users/:id/reset-password
// @access Private/Admin
exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Password for ${user.username} has been reset successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete user (Admin only)
// @route DELETE /api/users/:id
// @access Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own active account.'
      });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only Administrator.'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
