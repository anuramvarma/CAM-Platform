const mongoose = require('mongoose');

const paymentRecordSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentEvent', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentRoll: { type: String, required: true },
    isPaid: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 },
    paidAt: { type: Date }
}, { timestamps: true });

// Ensure one record per student per event
paymentRecordSchema.index({ eventId: 1, studentRoll: 1 }, { unique: true });

module.exports = mongoose.model('PaymentRecord', paymentRecordSchema);
