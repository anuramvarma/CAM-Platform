const Class = require('../models/Class');
const User = require('../models/User');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); // Ensure this is imported

// Helper to generate roll numbers
// Logic duplicated from generator.ts but adapted for backend
// Hybrid Roll Generator (Supports JNTU Alphanumeric & Standard Numeric)
const generateRolls = (start, end) => {
    if (!start || !end) return [];
    start = start.trim();
    end = end.trim();

    // 1. Identify Common Prefix
    let i = 0;
    while (i < start.length && i < end.length && start[i] === end[i]) i++;
    const prefix = start.substring(0, i);
    const startSuffix = start.substring(i);
    const endSuffix = end.substring(i);

    // console.log(`Prefix: ${prefix}, Suffixes: ${startSuffix} -> ${endSuffix}`);
    console.log(`DEBUG GEN: Prefix='${prefix}' StartSuffix='${startSuffix}' EndSuffix='${endSuffix}'`);

    const rolls = [];

    // Strategy A: JNTU Alphanumeric Pattern (e.g., C8 -> I9)
    // Suffix is [Char][Digit] (1 letter, 1 digit)
    const alphaRegex = /^([A-Z])(\d)$/i; // Added 'i' flag for case insensitivity
    const sMatch = startSuffix.match(alphaRegex);
    const eMatch = endSuffix.match(alphaRegex);

    console.log(`DEBUG GEN: Alpha Match? S=${!!sMatch} E=${!!eMatch}`);

    if (sMatch && eMatch) {
        // Force uppercase for consistent ASCII math
        const startChar = sMatch[1].toUpperCase().charCodeAt(0);
        const endChar = eMatch[1].toUpperCase().charCodeAt(0);
        const startDigit = parseInt(sMatch[2], 10);
        const endDigit = parseInt(eMatch[2], 10);

        console.log(`DEBUG GEN: Alpha Logic ${String.fromCharCode(startChar)}${startDigit} -> ${String.fromCharCode(endChar)}${endDigit}`);

        if (startChar <= endChar) {
            for (let charCode = startChar; charCode <= endChar; charCode++) {
                const char = String.fromCharCode(charCode);
                const sD = (charCode === startChar) ? startDigit : 0;
                const eD = (charCode === endChar) ? endDigit : 9;

                for (let d = sD; d <= eD; d++) {
                    rolls.push(prefix + char + d);
                }
            }
            console.log(`DEBUG GEN: Alpha Generated ${rolls.length} rolls`);
            return rolls;
        }
    }

    // Strategy B: Standard Numeric Pattern (e.g., 01 -> 15)
    // Suffix is just digits
    const numRegex = /^(\d+)$/;
    const sNumMatch = startSuffix.match(numRegex);
    const eNumMatch = endSuffix.match(numRegex);

    console.log(`DEBUG GEN: Numeric Match? S=${!!sNumMatch} E=${!!eNumMatch}`);

    if (sNumMatch && eNumMatch) {
        const sNum = parseInt(sNumMatch[1], 10);
        const eNum = parseInt(eNumMatch[1], 10);
        const len = sNumMatch[1].length;

        if (sNum <= eNum && (eNum - sNum <= 200)) {
            for (let n = sNum; n <= eNum; n++) {
                rolls.push(prefix + n.toString().padStart(len, '0'));
            }
            console.log(`DEBUG GEN: Numeric Generated ${rolls.length} rolls`);
            return rolls;
        }
    }

    // Fallback: If no patterns match, just return the start and end (User might have partial range)
    console.log('DEBUG GEN: Fallback used');
    return [start, end];
};

exports.setupClass = async (req, res) => {
    console.log('🛠️ Setup Request:', req.body);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { yearOfStudy, admissionYear, startRoll, endRoll, collegeCode, lateralDetails, degree, dept, section } = req.body;
        const userId = req.user.userId;

        // 1. Check if already configured
        // REMOVED FOR DEBUGGING: Allow re-setup to fix empty classes
        const existingClass = await Class.findOne({ userId }).session(session);
        if (existingClass) {
            console.log('⚠️ Re-setup detected. Cleaning up old class:', existingClass._id);
            // Delete existing students if re-running setup to avoid duplicates
            await Student.deleteMany({ classId: existingClass._id }).session(session);
            await Class.findByIdAndDelete(existingClass._id).session(session);
        }

        // 2. Create Class
        const newClass = new Class({
            userId,
            yearOfStudy,
            admissionYear,
            collegeCode,
            degree,
            dept,
            section,
            startRoll,
            endRoll,
            lateralDetails
        });

        const savedClass = await newClass.save({ session });
        console.log('✅ Class Created:', savedClass._id);

        // 3. Generate Students
        const regularRolls = generateRolls(startRoll, endRoll);
        console.log(`📊 Generated ${regularRolls.length} Regular Rolls`);

        const studentsToInsert = regularRolls.map(roll => ({
            classId: savedClass._id,
            rollNumber: roll,
            type: 'REGULAR'
        }));

        if (lateralDetails && lateralDetails.enabled) {
            const lateralRolls = generateRolls(lateralDetails.startRoll, lateralDetails.endRoll);
            console.log(`📊 Generated ${lateralRolls.length} Lateral Rolls`);
            lateralRolls.forEach(roll => {
                studentsToInsert.push({
                    classId: savedClass._id,
                    rollNumber: roll,
                    type: 'LATERAL'
                });
            });
        }

        if (studentsToInsert.length === 0) {
            console.warn('⚠️ No students generated! Check Roll Inputs.');
        }

        await Student.insertMany(studentsToInsert, { session });
        console.log(`✅ Saved ${studentsToInsert.length} Students to DB`);

        // 4. Update User
        await User.findByIdAndUpdate(userId, {
            isSetupComplete: true,
            classId: savedClass._id
        }, { session });

        await session.commitTransaction();
        session.endSession();

        // 5. Generate NEW Token with ClassID
        const newToken = jwt.sign(
            { userId: userId, role: req.user.role, classId: savedClass._id },
            process.env.JWT_SECRET
        );

        console.log('🔑 New Token Issued with ClassID');

        res.status(201).json({
            message: 'Class setup successfully',
            classId: savedClass._id,
            token: newToken // Return the new token
        });

    } catch (err) {
        console.error('❌ Setup Error:', err);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: err.message });
    }
};
