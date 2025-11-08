import express from 'express';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
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

// @route   POST api/transactions
// @desc    Create a transaction (sale or receive)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { products, totalAmount, type } = req.body;

  try {
    // Input validation
    if (!products || !Array.isArray(products) || products.length === 0 || !totalAmount || !type) {
      return res.status(400).json({ msg: 'Invalid transaction data' });
    }

    // Process each product in the transaction
    for (const item of products) {
      const product = await Product.findById(item.product || item._id);
      if (product) {
        if (type === 'sale') {
          if (product.quantity < item.quantity) {
            return res.status(400).json({ msg: `Not enough stock for ${product.name}` });
          }
          product.quantity -= item.quantity;
        } else if (type === 'receive') {
          product.quantity += item.quantity;
        }
        await product.save();
      } else {
        return res.status(404).json({ msg: `Product with id ${item.product || item._id} not found` });
      }
    }

    // Create and save the transaction
    const newTransaction = new Transaction({
      products: products.map(p => ({ product: p.product || p._id, quantity: p.quantity, price: p.sellingPrice })),
      totalAmount,
      type,
      user: req.user.id,
    });

    const transaction = await newTransaction.save();
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


export default router;