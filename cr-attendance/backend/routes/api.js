const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const setupController = require('../controllers/setupController');
const attendanceController = require('../controllers/attendanceController');
const subjectController = require('../controllers/subjectController');
const studentController = require('../controllers/studentController');
const permissionController = require('../controllers/permissionController');

// All routes here require Authentication
router.use(authMiddleware);

// Setup
router.post('/class/setup', setupController.setupClass);
router.get('/class/me', setupController.getClassDetails);

// Attendance
router.post('/attendance', attendanceController.markAttendance);
router.get('/history', attendanceController.getHistory);

// Subjects
router.get('/subjects', subjectController.getSubjects);
router.post('/subjects', subjectController.addSubject);
router.delete('/subjects/:id', subjectController.deleteSubject);

// Students
router.get('/students', studentController.getStudents);
router.post('/students', studentController.addStudent);
router.delete('/students/:id', studentController.deleteStudent);

// Permissions
router.get('/permissions', permissionController.getPermissions);
router.post('/permissions', permissionController.addPermission);
router.put('/permissions/:id', permissionController.updatePermission);
router.delete('/permissions/:id', permissionController.deletePermission);

// Misc (User Approvals)
const miscController = require('../controllers/miscController');
console.log('✅ miscController exports:', Object.keys(miscController));

router.get('/misc/requests', miscController.getPendingRequests);
router.post('/misc/approve', miscController.approveUser);
router.post('/misc/reject', miscController.rejectUser);
router.post('/misc/guest', miscController.createGuest);
router.get('/misc/users', miscController.getClassUsers);
router.delete('/misc/users/:targetUserId', miscController.deleteUser);

module.exports = router;
