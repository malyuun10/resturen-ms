const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

// @desc Get all categories
// @route GET /api/categories
// @access Public / Authenticated
exports.getCategories = async (req, res, next) => {
  try {
    const { activeOnly, search } = req.query;
    let query = {};

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (search) {
      query.name = new RegExp(search.trim(), 'i');
    }

    const categories = await Category.find(query).sort({ name: 1 });

    // Count items in each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await MenuItem.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          itemCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create category (Admin only)
// @route POST /api/categories
// @access Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    const cleanName = name.trim();
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category "${cleanName}" already exists.`
      });
    }

    const category = await Category.create({
      name: cleanName,
      description: description ? description.trim() : '',
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update category (Admin only)
// @route PUT /api/categories/:id
// @access Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    if (name) {
      const cleanName = name.trim();
      const existing = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Another category named "${cleanName}" already exists.`
        });
      }
      category.name = cleanName;
    }

    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete category (Admin only)
// @route DELETE /api/categories/:id
// @access Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const linkedItemsCount = await MenuItem.countDocuments({ category: category._id });
    if (linkedItemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it contains ${linkedItemsCount} menu item(s). Reassign or delete those items first.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
