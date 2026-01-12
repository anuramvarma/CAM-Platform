const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedHoD = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'hod@av.com';
        const password = 'hod123';
        const role = 'HOD';

        const existingHoD = await User.findOne({ email });
        if (existingHoD) {
            console.log('HoD already exists.');
            const salt = await bcrypt.genSalt(10);
            existingHoD.password = await bcrypt.hash(password, salt);
            existingHoD.role = role;
            existingHoD.isSetupComplete = true; // HoD doesn't need setup like CR
            existingHoD.isApproved = true;
            await existingHoD.save();
            console.log('HoD credentials updated.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newHoD = new User({
                email,
                password: hashedPassword,
                role,
                isSetupComplete: true,
                isApproved: true
            });

            await newHoD.save();
            console.log('HoD created successfully.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding HoD:', err);
        process.exit(1);
    }
};

seedHoD();
