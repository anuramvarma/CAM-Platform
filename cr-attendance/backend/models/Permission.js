const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentRoll: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, enum: ['FULL_DAY', 'MORNING', 'AFTERNOON', 'CUSTOM'], default: 'FULL_DAY' },
    customPeriods: { type: [Number], default: [] }, // Array of period numbers e.g. [1, 2]
    reason: { type: String },
    approvedBy: { type: String } // Optional
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
