const Attendance = require('../models/Attendance');
const Permission = require('../models/Permission');

exports.markAttendance = async (req, res) => {
    try {
        const { date, period, subjectId, absentees, session: sessionType } = req.body; // sessionType legacy?
        const classId = req.user.classId;

        if (!classId) return res.status(400).json({ message: 'Class not configured' });

        // 1. Check duplicate
        const existing = await Attendance.findOne({ classId, date, period });
        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked for this period' });
        }

        // 2. Fetch Active Permissions for this date/period
        // Logic: permission overlaps with "date".
        // Also check "type" compatibility (Morning/Afternoon vs Period 1-8)
        // For simplicity reusing frontend logic approach:
        const permissions = await Permission.find({
            classId,
            startDate: { $lte: date },
            endDate: { $gte: date }
        });

        // Filter valid permissions for this specific period
        // Period 1-4 = Morning, 5-8 = Afternoon
        const pNum = parseInt(period);
        const isMorning = pNum <= 4;

        const validPerms = permissions.filter(p => {
            if (p.type === 'FULL_DAY') return true;
            if (p.type === 'MORNING' && isMorning) return true;
            if (p.type === 'AFTERNOON' && !isMorning) return true;
            return false;
        }).map(p => p.studentRoll);

        // 3. Save
        const newRecord = new Attendance({
            classId,
            date,
            period,
            session: sessionType, // Save the session type (MORNING/AFTERNOON)
            subjectId,
            absentees, // User provides list of roll numbers marked absent
            permissions: validPerms // Store who had permission
        });

        await newRecord.save();
        res.status(201).json({ message: 'Attendance saved' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { date } = req.query; // Optional date filter
        const classId = req.user.classId;

        let query = { classId };
        if (date) query.date = date;

        const records = await Attendance.find(query)
            .sort({ date: -1, period: -1 });

        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
