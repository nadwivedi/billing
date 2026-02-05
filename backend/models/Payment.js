const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party is required']
  },
  type: {
    type: String,
    enum: ['payment_in', 'payment_out'],
    required: [true, 'Payment type is required']
  },
  referenceType: {
    type: String,
    enum: ['purchase', 'sale', 'opening', 'adjustment'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank', 'cheque'],
    required: [true, 'Payment mode is required']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  chequeDate: {
    type: Date
  },
  bankName: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'bounced'],
    default: 'completed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
