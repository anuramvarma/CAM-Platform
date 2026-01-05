
const mongoose = require('mongoose');
const { setupClass } = require('./controllers/setupController');
const User = require('./models/User');
const Class = require('./models/Class');
const Student = require('./models/Student');
require('dotenv').config();

const RUN_ID = Math.floor(Math.random() * 10000); // Unique ID for this run to avoid collisions

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runTest() {
    console.log(`\n🚀 STARTING DUPLICATION TEST (Run ID: ${RUN_ID})`);

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create Two Dummy Users
        const user1Email = `test_user1_${RUN_ID}@example.com`;
        const user2Email = `test_user2_${RUN_ID}@example.com`;

        const user1 = await User.create({
            email: user1Email,
            password: 'password123',
            role: 'CR',
            isSetupComplete: false
        });

        const user2 = await User.create({
            email: user2Email,
            password: 'password123',
            role: 'CR',
            isSetupComplete: false
        });

        console.log(`👤 Created Users: ${user1._id} (CR1), ${user2._id} (CR2)`);

        // 2. Setup Class for CR1 (Degree deliberately OMITTED to test default behavior)
        const req1 = {
            user: { userId: user1._id, role: 'CR' },
            body: {
                collegeCode: `TEST_COL_${RUN_ID}`,
                // degree: 'B.Tech', <--- OMITTED
                dept: 'CSE',
                section: 'A',
                yearOfStudy: '1',
                admissionYear: '2024',
                startRoll: `1_${RUN_ID}_01`,
                endRoll: `1_${RUN_ID}_05`
            }
        };

        console.log('\n--- 1️⃣ Executing Setup for CR1 ---');
        const res1 = mockRes();
        await setupClass(req1, res1);

        const classId1 = res1.data.classId;
        console.log(`👉 CR1 Result: Status ${res1.statusCode}, ClassID: ${classId1}, Msg: "${res1.data.message}"`);

        // 3. Setup Class for CR2 (Same details, maybe explicit degree 'B.TECH' or omitted again)
        // Let's omit it again to simulate the exact scenario of two users doing the same thing.
        const req2 = {
            user: { userId: user2._id, role: 'CR' },
            body: {
                collegeCode: `TEST_COL_${RUN_ID}`, // Same college
                // degree: 'B.TECH', // <--- OMITTED or Explicit, should resolve to same
                dept: 'CSE',  // Same dept
                section: 'A', // Same section
                yearOfStudy: '1',
                admissionYear: '2024',
                startRoll: `1_${RUN_ID}_01`,
                endRoll: `1_${RUN_ID}_05`
            }
        };

        console.log('\n--- 2️⃣ Executing Setup for CR2 (Expected to JOIN existing) ---');
        const res2 = mockRes();
        await setupClass(req2, res2);

        const classId2 = res2.data.classId;
        console.log(`👉 CR2 Result: Status ${res2.statusCode}, ClassID: ${classId2}, Msg: "${res2.data.message}"`);

        // 4. Verification
        console.log('\n--- 🕵️ VERIFICATION ---');

        if (classId1.toString() === classId2.toString()) {
            console.log('✅ SUCCESS: Both users linked to the SAME Class ID.');
        } else {
            console.error('❌ FAILURE: Users have DIFFERENT Class IDs!');
            console.error(`   CR1: ${classId1}`);
            console.error(`   CR2: ${classId2}`);
        }

        // Count classes in DB for this college code
        const classCount = await Class.countDocuments({ collegeCode: `TEST_COL_${RUN_ID}` });
        if (classCount === 1) {
            console.log(`✅ SUCCESS: Only 1 Class document exists for this criteria.`);
        } else {
            console.error(`❌ FAILURE: Found ${classCount} class documents (Expected 1).`);
        }

        // 5. Cleanup
        console.log('\n--- 🧹 CLEANUP ---');
        await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
        await Class.deleteMany({ collegeCode: `TEST_COL_${RUN_ID}` });
        await Student.deleteMany({ classId: classId1 }); // Should clean up for both logically
        console.log('✅ Test data deleted.');

    } catch (err) {
        console.error('❌ TEST SCRIPT ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
