require('dotenv').config();
const mongoose = require('mongoose');
const DailyAnalytics = require('./models/DailyAnalytics');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');
const Permission = require('./models/Permission');

const createTestData = async () => {
    console.log('🛠 Starting Test Data Creation...');

    // We want to calculate stats for TODAY (Real Data)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const todayQuery = istDate.toISOString().split('T')[0]; // "2026-01-13"

    // But save it as YESTERDAY (Test Data)
    const targetDate = '2026-01-12';

    console.log(`📅 Calculating stats for: ${todayQuery}`);
    console.log(`💾 Saving stats as: ${targetDate}`);

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // 1. Get all unique departments from Classes
        const departments = await Class.find().distinct('dept');
        console.log(`Found departments: ${departments.join(', ')}`);

        for (const dept of departments) {
            console.log(`Processing department: ${dept}`);

            // 0. Get Scope (Classes for this dept)
            const classes = await Class.find({ dept });
            const classIds = classes.map(c => c._id);

            // 1. Total Students
            const totalStudents = await Student.countDocuments({ classId: { $in: classIds } });
            const regularTotal = await Student.countDocuments({ classId: { $in: classIds }, type: 'REGULAR' });
            const lateralTotal = await Student.countDocuments({ classId: { $in: classIds }, type: 'LATERAL' });

            // 2. Active Permissions (using TODAY for query as requested)
            const activePermissions = await Permission.countDocuments({
                classId: { $in: classIds },
                startDate: { $lte: todayQuery },
                endDate: { $gte: todayQuery }
            });

            // 3. Attendance Stats (using TODAY for query as requested)
            const todaysAttendance = await Attendance.find({ date: todayQuery, classId: { $in: classIds } });

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
                    startDate: { $lte: todayQuery },
                    endDate: { $gte: todayQuery }
                });

                const record = classAttendanceMap[cls._id.toString()];
                let absent = 0;
                let present = 0;
                let status = 'Pending';

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

            // Save to DB with TARGET DATE
            const newData = {
                date: targetDate, // <--- THE FAKE DATE
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
                { date: targetDate, department: dept },
                newData,
                { upsert: true, new: true }
            );

            console.log(`✅ Saved test analytics for ${dept} on ${targetDate}`);
        }
        console.log('🚀 Test Data Creation Complete.');

    } catch (err) {
        console.error('❌ Error creating test data:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createTestData();
