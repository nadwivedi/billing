const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

// Create purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      party,
      items,
      purchaseDate,
      dueDate,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      totalAmount,
      paidAmount,
      notes
    } = req.body;
    const userId = req.userId;

    if (!party || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Party and at least one item are required'
      });
    }

    const purchase = await Purchase.create({
      userId,
      party,
      items,
      purchaseDate,
      dueDate,
      subtotal,
      discountAmount: discountAmount || 0,
      taxAmount: taxAmount || 0,
      shippingCharges: shippingCharges || 0,
      otherCharges: otherCharges || 0,
      totalAmount,
      paidAmount: paidAmount || 0,
      notes
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating purchase'
    });
  }
};

// Get all purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const { party, paymentStatus, status, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (party) filter.party = party;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (status) filter.status = status;

    let query = Purchase.find(filter)
      .populate('party', 'PartName phone')
      .populate('items.product', 'name sku');

    if (search) {
      query = query.where('invoiceNumber').regex(new RegExp(search, 'i'));
    }

    const purchases = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    console.error('Get all purchases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchases'
    });
  }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOne({ _id: id, userId })
      .populate('party', 'PartName phone email')
      .populate('items.product', 'name sku unit');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchase'
    });
  }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    const purchase = await Purchase.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('party', 'PartName phone')
      .populate('items.product', 'name sku');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating purchase'
    });
  }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOneAndDelete({ _id: id, userId });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Revert stock updates
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -item.quantity } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting purchase'
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { paidAmount } = req.body;

    const purchase = await Purchase.findOne({ _id: id, userId });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    purchase.paidAmount = paidAmount;

    if (paidAmount >= purchase.totalAmount) {
      purchase.paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      purchase.paymentStatus = 'partial';
    } else {
      purchase.paymentStatus = 'unpaid';
    }

    await purchase.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status'
    });
  }
};
