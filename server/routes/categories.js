import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name } = req.body;
  
  try {
    // Check if category already exists
    let category = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    
    if (category) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    category = new Category({
      name
    });
    
    await category.save();
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name } = req.body;
  
  try {
    // Check if category exists
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if new name already exists
    if (name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }
    
    category.name = name;
    await category.save();
    
    res.json(category);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if any products use this category
    const productsWithCategory = await Product.countDocuments({ category: req.params.id });
    
    if (productsWithCategory > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It is used by ${productsWithCategory} product(s).` 
      });
    }
    
    await category.deleteOne();
    
    res.json({ message: 'Category removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(500).send('Server error');
  }
});

export default router;