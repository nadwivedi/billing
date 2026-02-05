const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Create sale
exports.createSale = async (req, res) => {
  try {
    const {
      party,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate,
      dueDate,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      roundOff,
      totalAmount,
      paidAmount,
      paymentMode,
      notes
    } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}`
        });
      }
    }

    const sale = await Sale.create({
      userId,
      party,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate,
      dueDate,
      subtotal,
      discountAmount: discountAmount || 0,
      taxAmount: taxAmount || 0,
      shippingCharges: shippingCharges || 0,
      otherCharges: otherCharges || 0,
      roundOff: roundOff || 0,
      totalAmount,
      paidAmount: paidAmount || 0,
      paymentMode: paymentMode || 'cash',
      notes
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating sale'
    });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const { party, paymentStatus, status, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (party) filter.party = party;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (status) filter.status = status;

    let query = Sale.find(filter)
      .populate('party', 'PartName phone')
      .populate('items.product', 'name sku');

    if (search) {
      query = query.where('invoiceNumber').regex(new RegExp(search, 'i'));
    }

    const sales = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sales'
    });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOne({ _id: id, userId })
      .populate('party', 'PartName phone email')
      .populate('items.product', 'name sku unit');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sale'
    });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    const sale = await Sale.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('party', 'PartName phone')
      .populate('items.product', 'name sku');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating sale'
    });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOneAndDelete({ _id: id, userId });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Revert stock updates
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: item.quantity } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting sale'
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { paidAmount } = req.body;

    const sale = await Sale.findOne({ _id: id, userId });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    sale.paidAmount = paidAmount;

    if (paidAmount >= sale.totalAmount) {
      sale.paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      sale.paymentStatus = 'partial';
    } else {
      sale.paymentStatus = 'unpaid';
    }

    await sale.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: sale
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status'
    });
  }
};
