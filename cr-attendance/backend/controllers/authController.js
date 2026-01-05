const User = require('../models/User');
const Class = require('../models/Class');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register (One time or for testing)
exports.register = async (req, res) => {
    console.log('📝 Register Request:', req.body);
    try {
        const { email, password } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword
        });

        await newUser.save();
        console.log('✅ User Created:', email);
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('❌ Register Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Login
exports.login = async (req, res) => {
    console.log('🔑 Login Request:', req.body);
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            console.warn('⚠️ Login Failed: User not found', email);
            return res.status(400).json({ message: 'Email not found' });
        }


        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            console.warn('⚠️ Login Failed: Invalid password', email);
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Feature: Expiring Credentials
        if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
            console.warn('⚠️ Login Failed: Credential Expired', email);
            await User.deleteOne({ _id: user._id }); // Cleanup expired user
            return res.status(403).json({ message: 'These credentials have expired.' });
        }

        console.log('✅ Login Success:', email);

        // Get classId if setup is done
        let classId = user.classId || null;
        if (!classId && user.isSetupComplete) {
            // Fallback check
            const userClass = await Class.findOne({ userId: user._id });
            if (userClass) classId = userClass._id;
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, classId: classId, isApproved: user.isApproved },
            process.env.JWT_SECRET
        );

        res.json({
            token,
            userId: user._id,
            classConfigured: user.isSetupComplete,
            classId: classId,
            isApproved: user.isApproved
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const validPass = await bcrypt.compare(currentPassword, user.password);
        if (!validPass) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({ exists: true });
        } else {
            return res.status(404).json({ exists: false, message: 'Email not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.resetPasswordNew = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
