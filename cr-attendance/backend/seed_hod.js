const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedHoD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const hods = [
            { dept: 'CSE', email: 'hodcse@cam.in' },
            { dept: 'IT', email: 'hodit@cam.in' },
            { dept: 'CSBS', email: 'hodcsbs@cam.in' },
            { dept: 'AIML', email: 'hodaiml@cam.in' },
            { dept: 'AIDS', email: 'hodaids@cam.in' },
            { dept: 'EEE', email: 'hodeee@cam.in' },
            { dept: 'ECE', email: 'hodece@cam.in' },
            { dept: 'MECH', email: 'hodmech@cam.in' },
            { dept: 'CIVIL', email: 'hodcivil@cam.in' }
        ];

        const password = '123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        for (const h of hods) {
            const existingHoD = await User.findOne({ email: h.email });
            if (existingHoD) {
                existingHoD.password = hashedPassword;
                existingHoD.role = 'HOD';
                existingHoD.department = h.dept;
                existingHoD.isSetupComplete = true;
                existingHoD.isApproved = true;
                await existingHoD.save();
                console.log(`Updated HOD for ${h.dept}`);
            } else {
                const newHoD = new User({
                    email: h.email,
                    password: hashedPassword,
                    role: 'HOD',
                    department: h.dept,
                    isSetupComplete: true,
                    isApproved: true
                });
                await newHoD.save();
                console.log(`Created HOD for ${h.dept}`);
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding HoD:', err);
        process.exit(1);
    }
};

seedHoD();
