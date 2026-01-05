const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Creator of the class
    yearOfStudy: { type: Number, required: true }, // 1, 2, 3, 4
    admissionYear: { type: String, required: true }, // e.g., '23'
    collegeCode: { type: String, required: true }, // e.g. 'PA'
    degree: { type: String, default: 'B.Tech' }, // B.Tech, M.Tech
    dept: { type: String, required: true }, // CSE, ECE, etc.
    section: { type: String, required: true }, // A, B, C, D
    startRoll: { type: String, required: true },
    endRoll: { type: String, required: true },
    lateralDetails: {
        enabled: { type: Boolean, default: false },
        startRoll: String,
        endRoll: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
