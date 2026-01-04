const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ classId: req.user.classId });
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addSubject = async (req, res) => {
    try {
        const { name, code } = req.body;
        const newSubject = new Subject({
            classId: req.user.classId,
            name,
            code
        });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        await Subject.findOneAndDelete({ _id: req.params.id, classId: req.user.classId });
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
