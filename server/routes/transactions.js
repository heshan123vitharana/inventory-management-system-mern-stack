import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // If a date query param is provided (YYYY-MM-DD), return transactions for that day
    const { date } = req.query;
    let query = {};
    if (date) {
      const day = new Date(String(date));
      if (!isNaN(day.getTime())) {
        const start = new Date(day.setHours(0,0,0,0));
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query.date = { $gte: start, $lt: end };
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/transactions/purchase
// @desc    Create a new purchase transaction
// @access  Private
router.post('/purchase', auth, async (req, res) => {
  const { productId, supplierId, quantity, price, notes } = req.body;
  
  if (!productId || !supplierId || !quantity || !price) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Verify supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Calculate total
    const total = quantity * price;
    
    // Create transaction
    const transaction = new Transaction({
      type: 'purchase',
      productId,
      productName: product.name,
      quantity,
      price,
      total,
      userId: req.user.id,
      supplierId,
      supplierName: supplier.name,
      notes
    });
    
    // Update product stock
    product.stock += quantity;
    
    await Promise.all([
      transaction.save(),
      product.save()
    ]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/transactions/sell
// @desc    Create a new sale transaction
// @access  Private
router.post('/sell', auth, async (req, res) => {
  const { productId, quantity, notes } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ message: 'Product and quantity are required' });
  }
  
  try {
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if enough stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    // Calculate total
    const total = quantity * product.price;
    
    // Create transaction
    const transaction = new Transaction({
      type: 'sale',
      productId,
      productName: product.name,
      quantity,
      price: product.price,
      total,
      userId: req.user.id,
      notes
    });
    
    // Update product stock
    product.stock -= quantity;
    
    await Promise.all([
      transaction.save(),
      product.save()
    ]);
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;