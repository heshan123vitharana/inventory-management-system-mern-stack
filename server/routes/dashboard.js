import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      transactions,
      recentTransactions
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Supplier.countDocuments(),
      Transaction.find(),
      Transaction.find().sort({ date: -1 }).limit(5)
    ]);

    // Calculate monthly transactions for the chart
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type"
          },
          total: { $sum: "$total" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Process data for the chart
    const months = [];
    const salesData = [];
    const purchasesData = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      months.unshift(monthYear);

      const monthData = monthlyTransactions.filter(t => 
        t._id.year === date.getFullYear() && 
        t._id.month === date.getMonth() + 1
      );

      const sales = monthData.find(t => t._id.type === 'sale')?.total || 0;
      const purchases = monthData.find(t => t._id.type === 'purchase')?.total || 0;

      salesData.unshift(sales);
      purchasesData.unshift(purchases);
    }

    // Calculate purchase and sale statistics
    const totalPurchases = transactions.filter(t => t.type === 'purchase').length;
    const totalSales = transactions.filter(t => t.type === 'sale').length;
    
    res.json({
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalPurchases,
      totalSales,
      recentTransactions,
      chartData: {
        labels: months,
        datasets: {
          sales: salesData,
          purchases: purchasesData
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;