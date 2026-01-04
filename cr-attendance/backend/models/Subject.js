const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true },
    code: { type: String } // Optional
}, { timestamps: true });

// Ensure subject name is unique per class
subjectSchema.index({ classId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
