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
    console.log('🛠️ Setup Request Body:', req.body);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { yearOfStudy, admissionYear, startRoll, endRoll, collegeCode, lateralDetails, degree, dept, section } = req.body;
        const userId = req.user.userId;

        // --- STRICT Normalization (Uppercase Everything) ---
        // This ensures both Search and Save use the EXACT same format.
        const cCode = collegeCode ? collegeCode.trim().toUpperCase() : '';
        const cDegree = degree ? degree.trim().toUpperCase() : 'B.TECH';
        const cDept = dept ? dept.trim().toUpperCase() : '';
        const cSection = section ? section.trim().toUpperCase() : '';
        const cAdmissionYear = admissionYear ? admissionYear.trim() : '';
        const cYearOfStudy = parseInt(yearOfStudy, 10);

        // Debug Log
        const query = {
            collegeCode: cCode,
            degree: cDegree,
            dept: cDept,
            section: cSection,
            yearOfStudy: cYearOfStudy,
            admissionYear: cAdmissionYear
        };
        console.log('🔍 Lookup Query:', JSON.stringify(query));

        // 1. Check if a CLASS with these details ALREADY EXISTS
        // We look for an EXACT match on the normalized fields.
        const existingClass = await Class.findOne(query).session(session);

        let targetClassId;

        if (existingClass) {
            console.log('🔗 Found existing class. Linking user to class:', existingClass._id);
            // DO NOT Create new class.
            // DO NOT Generate students.
            // Just Link.
            targetClassId = existingClass._id;
        } else {
            console.log('✨ No existing class found. Creating new class...');

            // 2. Create Class
            // We save standardized UPPERCASE values to keep DB clean
            const newClass = new Class({
                userId, // Creator of this record
                yearOfStudy: cYearOfStudy,
                admissionYear: cAdmissionYear,
                collegeCode: cCode,
                degree: cDegree,
                dept: cDept,
                section: cSection,
                startRoll: startRoll ? startRoll.trim().toUpperCase() : '',
                endRoll: endRoll ? endRoll.trim().toUpperCase() : '',
                lateralDetails
            });

            // Normalize Lateral if exists
            if (newClass.lateralDetails) {
                if (newClass.lateralDetails.startRoll) newClass.lateralDetails.startRoll = newClass.lateralDetails.startRoll.toUpperCase();
                if (newClass.lateralDetails.endRoll) newClass.lateralDetails.endRoll = newClass.lateralDetails.endRoll.toUpperCase();
            }

            const savedClass = await newClass.save({ session });
            targetClassId = savedClass._id;
            console.log('✅ Class Created:', targetClassId);

            // 3. Generate Students
            const regularRolls = generateRolls(startRoll, endRoll);
            console.log(`📊 Generated ${regularRolls.length} Regular Rolls`);

            const studentsToInsert = regularRolls.map(roll => ({
                classId: targetClassId,
                rollNumber: roll,
                type: 'REGULAR'
            }));

            if (lateralDetails && lateralDetails.enabled) {
                const lateralRolls = generateRolls(lateralDetails.startRoll, lateralDetails.endRoll);
                console.log(`📊 Generated ${lateralRolls.length} Lateral Rolls`);
                lateralRolls.forEach(roll => {
                    studentsToInsert.push({
                        classId: targetClassId,
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
        }

        // 4. Update User (Link to Class)
        // Note: We do not check for previous class here. User simply switches focus to this class.
        await User.findByIdAndUpdate(userId, {
            isSetupComplete: true,
            classId: targetClassId
        }, { session });

        await session.commitTransaction();
        session.endSession();

        // 5. Generate NEW Token with ClassID
        const newToken = jwt.sign(
            { userId: userId, role: req.user.role, classId: targetClassId },
            process.env.JWT_SECRET
        );

        console.log('🔑 New Token Issued with ClassID');

        res.status(201).json({
            message: existingClass ? 'Joined existing class successfully' : 'Class setup successfully',
            classId: targetClassId,
            token: newToken // Return the new token
        });

    } catch (err) {
        console.error('❌ Setup Error:', err);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: err.message });
    }
};
