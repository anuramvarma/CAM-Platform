const Student = require('../models/Student');

exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({ classId: req.user.classId });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addStudent = async (req, res) => {
    try {
        const { rollNumber, name, type } = req.body;
        const newStudent = new Student({
            classId: req.user.classId,
            rollNumber,
            name,
            type
        });
        await newStudent.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        // Hard delete for now, or soft delete as per req
        await Student.findOneAndDelete({ _id: req.params.id, classId: req.user.classId });
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
