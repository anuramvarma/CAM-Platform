const Permission = require('../models/Permission');

exports.getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find({ classId: req.user.classId });
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addPermission = async (req, res) => {
    try {
        const { studentRoll, startDate, endDate, type, reason, customPeriods } = req.body;
        // Basic validation overlapping logic could go here

        const newPerm = new Permission({
            classId: req.user.classId,
            studentRoll,
            startDate,
            endDate,
            type,
            reason,
            customPeriods
        });
        await newPerm.save();
        res.status(201).json(newPerm);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Ensure strictly scoped to class
        const perm = await Permission.findOneAndUpdate(
            { _id: id, classId: req.user.classId },
            updates,
            { new: true }
        );

        if (!perm) return res.status(404).json({ error: 'Permission not found' });
        res.json(perm);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const perm = await Permission.findOneAndDelete({ _id: id, classId: req.user.classId });

        if (!perm) return res.status(404).json({ error: 'Permission not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
