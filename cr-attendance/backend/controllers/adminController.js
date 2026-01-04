const User = require('../models/User');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Permission = require('../models/Permission');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalClasses = await Class.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalCRs = await User.countDocuments({ role: 'CR' });

        // Attendance Today
        const today = new Date().toISOString().split('T')[0];
        const activeClassesToday = await Attendance.distinct('classId', { date: today });
        const attendanceCount = activeClassesToday.length;

        // Pending Attendance (Classes that exist but haven't marked attendance today)
        // This is a naive check; "marked attendance" could mean at least one period.
        // For accurate "pending", we'd need to know if the college is open, etc. 
        // For now, simple logic: Total Classes - Active Classes Today
        const pendingCount = totalClasses - attendanceCount;

        res.json({
            totalClasses,
            totalStudents,
            totalCRs,
            attendanceToday: attendanceCount,
            pendingAttendance: pendingCount
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { yearOfStudy, dept, section } = req.body;
        // Check if exists
        const existingup = await Class.findOne({ yearOfStudy, dept, section });
        if (existingup) return res.status(400).json({ message: 'Class already exists' });

        const newClass = new Class({ yearOfStudy, dept, section });
        await newClass.save();
        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find().populate('userId', 'email');
        const formattedClasses = classes.map(c => ({
            id: c._id,
            year: c.yearOfStudy,
            branch: c.dept, // Assuming dept is branch
            section: c.section,
            cr: c.userId ? c.userId.email : 'Unassigned',
            status: 'Active', // Default
            locked: false // We need to add this field to schema if we want to persist it
        }));
        res.json(formattedClasses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { yearOfStudy, dept, section, locked }

        // Note: 'locked' is not yet in Class schema. If we want to persist it, we need to add it to the model.
        // For now, we update basic fields.

        const updatedClass = await Class.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedClass) return res.status(404).json({ message: 'Class not found' });

        res.json(updatedClass);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllCRs = async (req, res) => {
    try {
        const crs = await User.find({ role: 'CR' }).populate('classId');
        const formattedCRs = crs.map(user => ({
            id: user._id,
            email: user.email,
            assignedClass: user.classId ? `${user.classId.yearOfStudy} - ${user.classId.dept} - ${user.classId.section}` : 'Unassigned',
            status: 'Active'
        }));
        res.json(formattedCRs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.searchStudents = async (req, res) => {
    try {
        const { query, year, dept, section } = req.query;
        let filter = {};

        // Filter by class properties if provided
        if (year || dept || section) {
            let classQuery = {};
            if (year) classQuery.yearOfStudy = year;
            if (dept) classQuery.dept = { $regex: dept, $options: 'i' };
            if (section) classQuery.section = { $regex: section, $options: 'i' };

            // Find classes matching criteria
            const matchingClasses = await Class.find(classQuery).select('_id');
            const classIds = matchingClasses.map(c => c._id);

            // If no classes found specifically for criteria, return empty or ensure subsequent query fails
            if (classIds.length > 0) {
                filter.classId = { $in: classIds };
            } else {
                return res.json([]); // No classes match, so no students match
            }
        }

        if (query) {
            filter.$or = [
                { rollNumber: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ];
        }

        // Limit to 50 results to prevents massive dumps
        const students = await Student.find(filter)
            .populate('classId', 'yearOfStudy dept section') // Populate class info
            .limit(50);

        const formatted = students.map(s => ({
            id: s._id,
            rollNumber: s.rollNumber,
            name: s.name || 'N/A',
            type: s.type,
            classInfo: s.classId ? `${s.classId.yearOfStudy} - ${s.classId.dept} - ${s.classId.section}` : 'Orphaned',
            isActive: s.isActive
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { rollNumber, name, isActive, type }

        const student = await Student.findByIdAndUpdate(id, updates, { new: true });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { rollNumber, name, type, year, dept, section } = req.body;

        // Find Class ID
        const classDoc = await Class.findOne({
            yearOfStudy: year,
            dept: { $regex: new RegExp(`^${dept}$`, 'i') },
            section: { $regex: new RegExp(`^${section}$`, 'i') }
        });

        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found. Please match an existing class exactly.' });
        }

        const newStudent = new Student({
            classId: classDoc._id,
            rollNumber,
            name,
            type: type || 'REGULAR',
            isActive: true
        });

        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Student with this roll number already exists in this class.' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findByIdAndDelete(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // { reason, type, startDate, endDate, etc. }
        const permission = await Permission.findByIdAndUpdate(id, updates, { new: true });

        if (!permission) return res.status(404).json({ message: 'Permission not found' });
        res.json(permission);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await Permission.findByIdAndDelete(id);

        if (!permission) return res.status(404).json({ message: 'Permission not found' });
        res.json({ message: 'Permission revoked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGlobalPermissions = async (req, res) => {
    try {
        const { classId, date, studentRoll, year, dept, section } = req.query;
        let filter = {};

        // Filter by class properties if provided
        if (year || dept || section) {
            let classQuery = {};
            if (year) classQuery.yearOfStudy = year;
            if (dept) classQuery.dept = { $regex: dept, $options: 'i' };
            if (section) classQuery.section = { $regex: section, $options: 'i' };

            const matchingClasses = await Class.find(classQuery).select('_id');
            const classIds = matchingClasses.map(c => c._id);

            if (classIds.length > 0) {
                filter.classId = { $in: classIds };
            } else {
                return res.json([]);
            }
        }

        if (classId) filter.classId = classId;
        if (studentRoll) filter.studentRoll = { $regex: studentRoll, $options: 'i' };
        if (date) {
            // Checking if range contains date
            filter.startDate = { $lte: date };
            filter.endDate = { $gte: date };
        }

        const permissions = await Permission.find(filter)
            .populate('classId', 'yearOfStudy dept section')
            .sort({ createdAt: -1 })
            .limit(100);

        const formatted = permissions.map(p => ({
            id: p._id,
            studentRoll: p.studentRoll,
            classInfo: p.classId ? `${p.classId.yearOfStudy} - ${p.classId.dept} - ${p.classId.section}` : 'Unknown',
            type: p.type,
            startDate: p.startDate, // Explicitly send raw dates for editing
            endDate: p.endDate,
            dateRange: `${p.startDate} to ${p.endDate}`,
            reason: p.reason,
            approvedBy: p.approvedBy || 'N/A'
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGlobalAttendance = async (req, res) => {
    try {
        const { classId, date, subjectId, period } = req.query;
        let filter = {};

        if (classId) filter.classId = classId;
        if (date) filter.date = date;
        if (subjectId) filter.subjectId = subjectId;
        if (period) filter.period = period;

        const records = await Attendance.find(filter)
            .populate('classId', 'yearOfStudy dept section')
            .populate('subjectId', 'name code')
            .sort({ date: -1, period: 1 })
            .limit(100);

        const formatted = records.map(r => ({
            id: r._id,
            classInfo: r.classId ? `${r.classId.yearOfStudy} - ${r.classId.dept} - ${r.classId.section}` : 'Unknown',
            date: r.date,
            period: r.period,
            subject: r.subjectId ? `${r.subjectId.name} (${r.subjectId.code})` : 'Unknown',
            absenteesCount: r.absentees.length,
            absentees: r.absentees
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
