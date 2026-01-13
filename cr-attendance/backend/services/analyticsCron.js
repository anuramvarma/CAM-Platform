const cron = require('node-cron');
const mongoose = require('mongoose');
const DailyAnalytics = require('../models/DailyAnalytics');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Permission = require('../models/Permission');

const calculateAndSaveAnalytics = async () => {
    console.log('[Cron] Starting Daily Analytics Snapshot...');
    // Use current date in India/local time implied by server, usually UTC or local. 
    // Ideally we want the "date" string to match what users see.
    // Ensure 5 PM is captured as Today's date.
    // Since this runs at 5 PM, new Date() is correct for "Today".

    // Adjust to IST date string if necessary, but simple ISO split is usually fine if server time is reasonable.
    // If server is UTC, 5PM IST is 11:30 AM UTC. 
    // new Date().toISOString() will show today's date.
    const now = new Date();
    // To ensure we get the correct "YYYY-MM-DD" for IST:
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const today = istDate.toISOString().split('T')[0];

    try {
        // 1. Get all unique departments from Classes
        const departments = await Class.find().distinct('dept');
        console.log(`[Cron] Found departments: ${departments.join(', ')}`);

        for (const dept of departments) {
            console.log(`[Cron] Processing department: ${dept}`);

            // 0. Get Scope (Classes for this dept)
            const classes = await Class.find({ dept });
            const classIds = classes.map(c => c._id);

            // 1. Total Students
            const totalStudents = await Student.countDocuments({ classId: { $in: classIds } });
            const regularTotal = await Student.countDocuments({ classId: { $in: classIds }, type: 'REGULAR' });
            const lateralTotal = await Student.countDocuments({ classId: { $in: classIds }, type: 'LATERAL' });

            // 2. Active Permissions
            const activePermissions = await Permission.countDocuments({
                classId: { $in: classIds },
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            // 3. Attendance Stats
            const todaysAttendance = await Attendance.find({ date: today, classId: { $in: classIds } });
            const classAttendanceMap = {};
            todaysAttendance.forEach(record => {
                if (!classAttendanceMap[record.classId.toString()]) {
                    classAttendanceMap[record.classId.toString()] = record;
                }
            });

            let totalAbsent = 0;
            let totalPresent = 0;
            const classSummary = [];

            for (const cls of classes) {
                const studentCount = await Student.countDocuments({ classId: cls._id });
                const regularCount = await Student.countDocuments({ classId: cls._id, type: 'REGULAR' });
                const lateralCount = await Student.countDocuments({ classId: cls._id, type: 'LATERAL' });

                // Permission count for this class
                const permissionsCount = await Permission.countDocuments({
                    classId: cls._id,
                    startDate: { $lte: today },
                    endDate: { $gte: today }
                });

                const record = classAttendanceMap[cls._id.toString()];
                let absent = 0;
                let present = 0;
                let status = 'Pending'; // Default logic from hodController

                if (record) {
                    absent = record.absentees.length;
                    present = studentCount - absent;
                    status = 'Marked';
                    totalAbsent += absent;
                    totalPresent += present;
                }

                classSummary.push({
                    id: cls._id.toString(),
                    className: `${cls.yearOfStudy}-${cls.dept}-${cls.section}`,
                    year: cls.yearOfStudy,
                    dept: cls.dept,
                    totalStudents: studentCount,
                    regularCount,
                    lateralCount,
                    present,
                    absent,
                    permissionsCount,
                    status
                });
            }

            // Save to DB
            const newData = {
                date: today,
                department: dept,
                totals: {
                    totalStrength: totalStudents,
                    presentees: totalPresent,
                    absentees: totalAbsent,
                    activePermissions,
                    totalClasses: classes.length,
                    regularTotal,
                    lateralTotal
                },
                classWise: classSummary
            };

            await DailyAnalytics.findOneAndUpdate(
                { date: today, department: dept },
                newData,
                { upsert: true, new: true }
            );

            console.log(`[Cron] Saved analytics for ${dept}`);
        }
        console.log('[Cron] Daily Snapshot Complete.');

    } catch (err) {
        console.error('[Cron] Error running daily snapshot:', err);
    }
};

const startCron = () => {
    // Schedule task to run at 5:00 PM every day
    // Cron format: Minute Hour Day Month DayOfWeek
    // 17:00 = 5:00 PM
    cron.schedule('0 17 * * *', () => {
        calculateAndSaveAnalytics();
    }, {
        timezone: "Asia/Kolkata"
    });
    console.log('[Cron] Analytics Job Scheduled for 5:00 PM IST');
};

module.exports = { startCron, calculateAndSaveAnalytics };
