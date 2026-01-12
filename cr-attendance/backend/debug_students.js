const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./models/Student');

const checkStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to DB');

        const count = await Student.countDocuments();
        console.log(`Total Students: ${count}`);

        const regularCount = await Student.countDocuments({ type: 'REGULAR' });
        console.log(`Explicit REGULAR count: ${regularCount}`);

        const lateralCount = await Student.countDocuments({ type: 'LATERAL' });
        console.log(`Explicit LATERAL count: ${lateralCount}`);

        const types = await Student.distinct('type');
        console.log('Distinct Types found:', types);

        const sample = await Student.findOne();
        console.log('Sample Student:', sample);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkStudents();
