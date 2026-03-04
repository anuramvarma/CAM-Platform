const mongoose = require('mongoose');

const pendingPermissionSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentRoll: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, required: true },   // YYYY-MM-DD
    type: {
        type: String,
        enum: ['FULL_DAY', 'MORNING', 'AFTERNOON', 'CUSTOM'],
        default: 'FULL_DAY'
    },
    customPeriods: { type: [Number], default: [] },
    reason: { type: String, required: true },
    hasPermissionLetter: { type: Boolean, default: false },
    letterFileUrl: { type: String, default: null }, // file path or base64 ref
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PendingPermission', pendingPermissionSchema);
