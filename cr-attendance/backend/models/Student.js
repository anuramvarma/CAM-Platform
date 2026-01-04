const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    rollNumber: { type: String, required: true },
    name: { type: String }, // Optional
    type: { type: String, enum: ['REGULAR', 'LATERAL'], default: 'REGULAR' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure roll number is unique per class
studentSchema.index({ classId: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
