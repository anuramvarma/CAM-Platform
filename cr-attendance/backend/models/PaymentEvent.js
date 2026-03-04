const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    eventName: { type: String, required: true },
    amountPerHead: { type: Number, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
