const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['CR', 'ADMIN'], default: 'CR' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Linked after setup
    isSetupComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
