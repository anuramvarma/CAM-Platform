const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'superadmin@av.com';
        const password = 'av123';
        const role = 'ADMIN';

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Super Admin already exists.');
            // Optional: Update password if needed
            const salt = await bcrypt.genSalt(10);
            existingAdmin.password = await bcrypt.hash(password, salt);
            existingAdmin.role = role;
            await existingAdmin.save();
            console.log('Super Admin credentials updated.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newAdmin = new User({
                email,
                password: hashedPassword,
                role
            });

            await newAdmin.save();
            console.log('Super Admin created successfully.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding super admin:', err);
        process.exit(1);
    }
};

seedSuperAdmin();
