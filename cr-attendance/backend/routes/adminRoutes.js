const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to ensure user is ADMIN
const adminCheck = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

router.use(authMiddleware);
router.use(adminCheck);

router.get('/stats', adminController.getDashboardStats);
router.get('/classes', adminController.getAllClasses);
router.post('/classes', adminController.createClass);
router.put('/classes/:id', adminController.updateClass);

router.get('/crs', adminController.getAllCRs);
router.get('/students', adminController.searchStudents); // Supports ?year=3&dept=cse&section=a
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
// Permissions & Attendance
router.get('/permissions', adminController.getGlobalPermissions);
router.put('/permissions/:id', adminController.updatePermission);
router.delete('/permissions/:id', adminController.deletePermission);

router.get('/attendance', adminController.getGlobalAttendance);

module.exports = router;
