import express from 'express';
import Supplier from '../models/Supplier.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;
  
  try {
    // Check if email already exists
    let supplier = await Supplier.findOne({ email });
    
    if (supplier) {
      return res.status(400).json({ message: 'Email already exists for another supplier' });
    }
    
    supplier = new Supplier({
      name,
      email,
      phoneNumber,
      address
    });
    
    await supplier.save();
    
    res.json(supplier);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update a supplier
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;
  
  try {
    let supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if email is changed and already exists
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingSupplier) {
        return res.status(400).json({ message: 'Email already exists for another supplier' });
      }
    }
    
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, phoneNumber, address } },
      { new: true }
    );
    
    res.json(updatedSupplier);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete a supplier
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if supplier has any transactions
    const transactionsWithSupplier = await Transaction.countDocuments({ 
      supplierId: req.params.id 
    });
    
    if (transactionsWithSupplier > 0) {
      return res.status(400).json({ 
        message: `Cannot delete supplier. They are associated with ${transactionsWithSupplier} transaction(s).` 
      });
    }
    
    await supplier.deleteOne();
    
    res.json({ message: 'Supplier removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(500).send('Server error');
  }
});

export default router;