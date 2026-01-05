const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getPendingRequests = async (req, res) => {
    try {
        const { classId } = req.user;
        if (!classId) return res.status(400).json({ message: 'No Class ID found for this user' });

        // Find users with same classId but NOT approved, excluding self
        const pendingUsers = await User.find({
            classId: classId,
            isApproved: false,
            _id: { $ne: req.user.userId }
        }).select('email createdAt');

        res.json(pendingUsers);
    } catch (err) {
        console.error('Fetch Requests Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;

        await User.findByIdAndUpdate(targetUserId, { isApproved: true });

        res.json({ message: 'User approved successfully' });
    } catch (err) {
        console.error('Approve Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { targetUserId } = req.body;

        // Option 1: Delete User
        // await User.findByIdAndDelete(targetUserId);

        // Option 2: Just unlink from class (better for safety)
        await User.findByIdAndUpdate(targetUserId, {
            classId: null,
            isSetupComplete: false,
            isApproved: false
        });

        res.json({ message: 'User rejected and unlinked from class' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createGuest = async (req, res) => {
    try {
        const { email, password, expiresInHours } = req.body;
        const { classId } = req.user;

        if (!classId) return res.status(400).json({ message: 'No Class ID found' });

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours));

        const newUser = new User({
            email,
            password: hashedPassword,
            role: 'CR',
            classId: classId,
            isSetupComplete: true,
            isApproved: true,
            expiresAt: expiresAt
        });

        await newUser.save();

        res.status(201).json({ message: 'Guest credentials created successfully' });
    } catch (err) {
        console.error('Create Guest Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
