const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Permission = require('../models/Permission');
const Class = require('../models/Class');
const User = require('../models/User');

// Helper to generate roll numbers (Duplicated from setupController)
const generateRolls = (start, end) => {
    if (!start || !end) return [];
    start = start.trim();
    end = end.trim();

    let i = 0;
    while (i < start.length && i < end.length && start[i] === end[i]) i++;
    const prefix = start.substring(0, i);
    const startSuffix = start.substring(i);
    const endSuffix = end.substring(i);

    const rolls = [];
    const alphaRegex = /^([A-Z])(\d)$/i;
    const sMatch = startSuffix.match(alphaRegex);
    const eMatch = endSuffix.match(alphaRegex);

    if (sMatch && eMatch) {
        const startChar = sMatch[1].toUpperCase().charCodeAt(0);
        const endChar = eMatch[1].toUpperCase().charCodeAt(0);
        const startDigit = parseInt(sMatch[2], 10);
        const endDigit = parseInt(eMatch[2], 10);

        if (startChar <= endChar) {
            for (let charCode = startChar; charCode <= endChar; charCode++) {
                const char = String.fromCharCode(charCode);
                const sD = (charCode === startChar) ? startDigit : 0;
                const eD = (charCode === endChar) ? endDigit : 9;
                for (let d = sD; d <= eD; d++) rolls.push(prefix + char + d);
            }
            return rolls;
        }
    }

    const numRegex = /^(\d+)$/;
    const sNumMatch = startSuffix.match(numRegex);
    const eNumMatch = endSuffix.match(numRegex);

    if (sNumMatch && eNumMatch) {
        const sNum = parseInt(sNumMatch[1], 10);
        const eNum = parseInt(eNumMatch[1], 10);
        const len = sNumMatch[1].length;
        if (sNum <= eNum && (eNum - sNum <= 200)) {
            for (let n = sNum; n <= eNum; n++) {
                rolls.push(prefix + n.toString().padStart(len, '0'));
            }
            return rolls;
        }
    }
    return [start, end];
};

exports.createClass = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            yearOfStudy, admissionYear, startRoll, endRoll,
            collegeCode, lateralDetails, degree, dept, section,
            crEmail, crPassword
        } = req.body;

        // 1. Create or Find CR User
        let userId;
        let existingUser = await User.findOne({ email: crEmail }).session(session);

        if (existingUser) {
            // Optional: You might want to prevent reusing existing users if they are already assigned
            if (existingUser.role !== 'CR') throw new Error('User exists but is not a CR');
            if (existingUser.classId) throw new Error('CR is already assigned to a class');
            userId = existingUser._id;
            // Update password if provided? Or keep existing?
            // For now, let's assume we update password if provided
            if (crPassword) {
                const hashedPassword = await bcrypt.hash(crPassword, 10);
                existingUser.password = hashedPassword;
                await existingUser.save({ session });
            }
        } else {
            const hashedPassword = await bcrypt.hash(crPassword, 10);
            const newUser = new User({
                email: crEmail,
                password: hashedPassword,
                role: 'CR',
                isApproved: true,
                isSetupComplete: true
            });
            const savedUser = await newUser.save({ session });
            userId = savedUser._id;
        }

        // 2. Create Class
        const newClass = new Class({
            userId,
            yearOfStudy: parseInt(yearOfStudy),
            admissionYear: admissionYear?.trim(),
            collegeCode: collegeCode?.trim().toUpperCase(),
            degree: degree?.trim().toUpperCase(),
            dept: dept?.trim().toUpperCase(),
            section: section?.trim().toUpperCase(),
            startRoll: startRoll?.trim().toUpperCase(),
            endRoll: endRoll?.trim().toUpperCase(),
            lateralDetails
        });

        // Normalize Lateral
        if (newClass.lateralDetails) {
            if (newClass.lateralDetails.startRoll) newClass.lateralDetails.startRoll = newClass.lateralDetails.startRoll.toUpperCase();
            if (newClass.lateralDetails.endRoll) newClass.lateralDetails.endRoll = newClass.lateralDetails.endRoll.toUpperCase();
        }

        const savedClass = await newClass.save({ session });
        const targetClassId = savedClass._id;

        // 3. Generate Students
        const regularRolls = generateRolls(newClass.startRoll, newClass.endRoll);
        const studentsToInsert = regularRolls.map(roll => ({
            classId: targetClassId,
            rollNumber: roll,
            type: 'REGULAR'
        }));

        if (lateralDetails && lateralDetails.enabled) {
            const lateralRolls = generateRolls(lateralDetails.startRoll, lateralDetails.endRoll);
            lateralRolls.forEach(roll => {
                studentsToInsert.push({
                    classId: targetClassId,
                    rollNumber: roll,
                    type: 'LATERAL'
                });
            });
        }

        if (studentsToInsert.length > 0) {
            await Student.insertMany(studentsToInsert, { session });
        }

        // 4. Update User with Class ID
        await User.findByIdAndUpdate(userId, {
            classId: targetClassId,
            isSetupComplete: true,
            isApproved: true
        }, { session });

        await session.commitTransaction();
        res.status(201).json({ message: 'Class created and CR assigned successfully', classId: targetClassId });

    } catch (err) {
        await session.abortTransaction();
        console.error('Create Class Error:', err);
        res.status(500).json({ error: err.message || 'Failed to create class' });
    } finally {
        session.endSession();
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const updates = req.body;

        // Sanitize inputs if necessary
        if (updates.collegeCode) updates.collegeCode = updates.collegeCode.toUpperCase();
        if (updates.degree) updates.degree = updates.degree.toUpperCase();
        if (updates.dept) updates.dept = updates.dept.toUpperCase();
        if (updates.section) updates.section = updates.section.toUpperCase();

        // Note: We are not allowing updating roll ranges or lateral details easily here as it involves complex student sync logic.
        // Assuming simple metadata updates for now.

        const updatedClass = await Class.findByIdAndUpdate(classId, updates, { new: true });
        res.json(updatedClass);
    } catch (err) {
        console.error('Update Class Error:', err);
        res.status(500).json({ error: 'Failed to update class' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Total Students
        const totalStudents = await Student.countDocuments();
        const regularTotal = await Student.countDocuments({ type: 'REGULAR' });
        const lateralTotal = await Student.countDocuments({ type: 'LATERAL' });

        // 2. Active Permissions
        const activePermissions = await Permission.countDocuments({
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        // 3. Attendance Stats (First attendance found per class)
        const todaysAttendance = await Attendance.find({ date: today })
            .sort({ createdAt: 1 });

        const classAttendanceMap = {};
        todaysAttendance.forEach(record => {
            if (!classAttendanceMap[record.classId.toString()]) {
                classAttendanceMap[record.classId.toString()] = record;
            }
        });

        let totalAbsent = 0;
        let totalPresent = 0; // Cumulative present of marked classes

        // For class-wise summary
        const classSummary = [];

        // Iterate over ALL classes to ensure we show even those who haven't marked
        const allClasses = await Class.find();

        for (const cls of allClasses) {
            const studentCount = await Student.countDocuments({ classId: cls._id });
            const regularCount = await Student.countDocuments({ classId: cls._id, type: 'REGULAR' });
            const lateralCount = await Student.countDocuments({ classId: cls._id, type: 'LATERAL' });

            const record = classAttendanceMap[cls._id.toString()];

            // Count Active Permissions for this class
            const permissionsCount = await Permission.countDocuments({
                classId: cls._id,
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            let absent = 0;
            let present = 0;
            let status = 'Pending';
            let strength = `${studentCount}`;

            if (record) {
                absent = record.absentees.length;
                present = studentCount - absent;
                status = 'Marked';

                totalAbsent += absent;
                totalPresent += present;
            }

            classSummary.push({
                id: cls._id,
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

        // Count total classes
        const totalClasses = allClasses.length;

        const responsePayload = {
            totalStudents,
            regularTotal,
            lateralTotal,
            totalClasses, // New
            presentToday: totalPresent,
            absentToday: totalAbsent,
            activePermissions,
            classSummary
        };
        console.log('Sending Hod Stats:', JSON.stringify(responsePayload, null, 2));
        res.json(responsePayload);

    } catch (err) {
        console.error('HoD Stats Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getClasses = async (req, res) => {
    console.log('GET /hod/classes request received');
    try {
        const classes = await Class.find().populate('userId', 'email name');
        const today = new Date().toISOString().split('T')[0];

        const enhancedClasses = await Promise.all(classes.map(async (cls) => {
            const studentCount = await Student.countDocuments({ classId: cls._id });
            const regularCount = await Student.countDocuments({ classId: cls._id, type: 'REGULAR' });
            const lateralCount = await Student.countDocuments({ classId: cls._id, type: 'LATERAL' });

            const todayPermissionsCount = await Permission.countDocuments({
                classId: cls._id,
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            return {
                ...cls.toObject(),
                studentCount,
                regularCount,
                lateralCount,
                todayPermissionsCount
            };
        }));

        res.json(enhancedClasses);
    } catch (err) {
        console.error('HoD Classes Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { classId } = req.params;
        console.log(`[HoD] Deleting Class ID: ${classId}`);

        // Debug: Check if class exists
        const cls = await Class.findById(classId);
        if (!cls) {
            console.log(`[HoD] Class not found: ${classId}`);
            return res.status(404).json({ message: 'Class not found' });
        }

        // 1. Delete all students in the class
        const studentDeleteResult = await Student.deleteMany({ classId: classId }); // Mongoose auto-casts
        console.log(`[HoD] Deleted ${studentDeleteResult.deletedCount} students.`);

        // 2. Delete Permissions
        const permDeleteResult = await Permission.deleteMany({ classId: classId });
        console.log(`[HoD] Deleted ${permDeleteResult.deletedCount} permissions.`);

        // 3. Delete Attendance Records
        const attDeleteResult = await Attendance.deleteMany({ classId: classId });
        console.log(`[HoD] Deleted ${attDeleteResult.deletedCount} attendance records.`);

        // 4. Delete the class itself
        await Class.findByIdAndDelete(classId);
        console.log(`[HoD] Class deleted.`);

        // 5. Unlink CR from class
        const crUpdateResult = await User.updateMany({ classId: classId }, {
            classId: null,
            isSetupComplete: false
        });
        console.log(`[HoD] Unlinked CR from class.`);

        res.json({
            message: 'Class and associated data deleted successfully',
            details: {
                studentsDeleted: studentDeleteResult.deletedCount,
                permissionsDeleted: permDeleteResult.deletedCount
            }
        });
    } catch (err) {
        console.error('HoD Delete Class Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getStudentsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const students = await Student.find({ classId });
        res.json(students);
    } catch (err) {
        console.error('HoD Get Students Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.addStudent = async (req, res) => {
    try {
        const { classId, rollNumber, name, type, startRoll, endRoll } = req.body;

        if (startRoll && endRoll) {
            // Bulk Add Logic
            console.log(`[HoD] Bulk Adding Students: ${startRoll} to ${endRoll} (${type})`);

            // Helper function local to this scope or reused if moved to shared utility
            const generateRolls = (start, end) => {
                if (!start || !end) return [];
                start = start.trim();
                end = end.trim();

                let i = 0;
                while (i < start.length && i < end.length && start[i] === end[i]) i++;
                const prefix = start.substring(0, i);
                const startSuffix = start.substring(i);
                const endSuffix = end.substring(i);

                const rolls = [];
                const alphaRegex = /^([A-Z])(\d)$/i;
                const sMatch = startSuffix.match(alphaRegex);
                const eMatch = endSuffix.match(alphaRegex);

                if (sMatch && eMatch) {
                    const startChar = sMatch[1].toUpperCase().charCodeAt(0);
                    const endChar = eMatch[1].toUpperCase().charCodeAt(0);
                    const startDigit = parseInt(sMatch[2], 10);
                    const endDigit = parseInt(eMatch[2], 10);

                    if (startChar <= endChar) {
                        for (let charCode = startChar; charCode <= endChar; charCode++) {
                            const char = String.fromCharCode(charCode);
                            const sD = (charCode === startChar) ? startDigit : 0;
                            const eD = (charCode === endChar) ? endDigit : 9;
                            for (let d = sD; d <= eD; d++) rolls.push(prefix + char + d);
                        }
                        return rolls;
                    }
                }

                const numRegex = /^(\d+)$/;
                const sNumMatch = startSuffix.match(numRegex);
                const eNumMatch = endSuffix.match(numRegex);

                if (sNumMatch && eNumMatch) {
                    const sNum = parseInt(sNumMatch[1], 10);
                    const eNum = parseInt(eNumMatch[1], 10);
                    const len = sNumMatch[1].length;
                    // Safety cap of 200 to prevent infinite loops or massive inserts
                    if (sNum <= eNum && (eNum - sNum <= 200)) {
                        for (let n = sNum; n <= eNum; n++) {
                            rolls.push(prefix + n.toString().padStart(len, '0'));
                        }
                        return rolls;
                    }
                }

                // Fallback: mixed formats or too large range, return just start/end or nothing? 
                // For safety, let's just return the boundary if regex fails, but here we want range.
                // If it fails to parse as range, maybe it's just two rolls.
                return [start, end];
            };

            const rolls = generateRolls(startRoll, endRoll);

            // Filter out rolls that might already exist in this class to prevent duplicates erroring out everything?
            // Or just try insertMany with ordered:false to skip duplicates.
            const studentsToInsert = rolls.map(roll => ({
                classId,
                rollNumber: roll,
                type: type || 'REGULAR',
                name: '' // Bulk add usually doesn't have names initially
            }));

            if (studentsToInsert.length === 0) {
                return res.status(400).json({ error: 'Invalid range or range too large (max 200)' });
            }

            try {
                // ordered: false continues insertion even if some fail (unlikely given new class, but possible if adding to existing)
                const result = await Student.insertMany(studentsToInsert, { ordered: false });
                res.status(201).json({ message: `Successfully added ${result.length} students`, addedCount: result.length });
            } catch (bulkErr) {
                console.error('Bulk Insert Error:', bulkErr);
                // If getting duplicates error (E11000) or MongoBulkWriteError
                if (bulkErr.code === 11000 || bulkErr.name === 'MongoBulkWriteError' || bulkErr.writeErrors) {
                    res.status(201).json({ message: 'Bulk add completed with some duplicates skipped.' });
                } else {
                    res.status(500).json({ error: 'Bulk Insert Failed: ' + bulkErr.message });
                }
            }

        } else {
            // Single Add Logic
            const newStudent = new Student({
                classId,
                rollNumber,
                name,
                type
            });
            await newStudent.save();
            res.status(201).json(newStudent);
        }
    } catch (err) {
        console.error('HoD Add Student Error:', err);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        await Student.findByIdAndDelete(req.params.id); // HoD can delete any student
        res.json({ message: 'Student deleted' });
    } catch (err) {
        console.error('HoD Delete Student Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getPermissionsByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const permissions = await Permission.find({ classId });
        res.json(permissions);
    } catch (err) {
        console.error('HoD Get Permissions Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.addPermission = async (req, res) => {
    try {
        const { classId, studentRoll, startDate, endDate, type, reason, customPeriods } = req.body;

        if (Array.isArray(studentRoll)) {
            const permissionsToCreate = studentRoll.map(roll => ({
                classId,
                studentRoll: roll,
                startDate,
                endDate,
                type,
                reason,
                customPeriods: type === 'CUSTOM' ? customPeriods : [],
                approvedBy: 'HOD'
            }));
            const newPermissions = await Permission.insertMany(permissionsToCreate);
            res.status(201).json(newPermissions);
        } else {
            const newPermission = new Permission({
                classId,
                studentRoll,
                startDate,
                endDate,
                type,
                reason,
                customPeriods: type === 'CUSTOM' ? customPeriods : [],
                approvedBy: 'HOD'
            });
            await newPermission.save();
            res.status(201).json(newPermission);
        }
    } catch (err) {
        console.error('HoD Add Permission Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        await Permission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Permission revoked' });
    } catch (err) {
        console.error('HoD Delete Permission Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getCRs = async (req, res) => {
    try {
        const crs = await User.find({ role: 'CR' }).populate('classId', 'yearOfStudy dept section');
        res.json(crs);
    } catch (err) {
        console.error('HoD Get CRs Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.approveCR = async (req, res) => {
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(userId, { isApproved: true });
        res.json({ message: 'CR Approved' });
    } catch (err) {
        console.error('HoD Approve CR Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error('HoD Delete User Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};
