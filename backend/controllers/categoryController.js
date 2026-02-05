const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');

// Create category
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const category = await Category.create({
    name,
    description,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// Get all categories
exports.getAllCategories = asyncHandler(async (req, res) => {
  const { isActive } = req.query;
  let filter = {};

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const categories = await Category.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// Get category by ID
exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// Update category
exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    { name, description, isActive },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category
  });
});

// Delete category
exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});
