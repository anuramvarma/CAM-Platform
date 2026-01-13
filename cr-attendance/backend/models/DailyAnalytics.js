const mongoose = require('mongoose');

const DailyAnalyticsSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        index: true
    },
    department: {
        type: String,
        required: true
    },
    totals: {
        totalStrength: { type: Number, default: 0 },
        presentees: { type: Number, default: 0 },
        absentees: { type: Number, default: 0 },
        activePermissions: { type: Number, default: 0 },
        totalClasses: { type: Number, default: 0 },
        regularTotal: { type: Number, default: 0 },
        lateralTotal: { type: Number, default: 0 }
    },
    classWise: [{
        id: String,
        className: String, // stored as "Year-Dept-Section" or similar
        year: Number,
        dept: String,
        totalStudents: Number,
        regularCount: Number,
        lateralCount: Number,
        present: Number,
        absent: Number,
        permissionsCount: Number,
        status: String // 'Marked' or 'Pending'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one entry per department per date
DailyAnalyticsSchema.index({ date: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('DailyAnalytics', DailyAnalyticsSchema);
