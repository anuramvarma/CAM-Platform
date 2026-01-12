const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['CR', 'ADMIN', 'HOD'], default: 'CR' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Linked after setup
    isSetupComplete: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false }, // False for joiners, True for creators
    expiresAt: { type: Date, default: null } // for temporary guest CRs
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
