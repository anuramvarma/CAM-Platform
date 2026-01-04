const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    date: { type: String, required: true }, // Store as YYYY-MM-DD string for simpler querying
    period: { type: String, required: true }, // "1", "2" ... "MORNING"
    session: { type: String }, // "MORNING", "AFTERNOON"
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    absentees: [{ type: String }], // Array of Roll Numbers
    // Optional: Permissions applied
    permissions: [{ type: String }]
}, { timestamps: true });

// Unique constraint: One record per Class + Date + Period
attendanceSchema.index({ classId: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
