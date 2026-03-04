const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const setupController = require('../controllers/setupController');
const attendanceController = require('../controllers/attendanceController');
const subjectController = require('../controllers/subjectController');
const studentController = require('../controllers/studentController');
const permissionController = require('../controllers/permissionController');
const pendingPermissionController = require('../controllers/pendingPermissionController');
const paymentController = require('../controllers/paymentController');

const upload = require('../utils/upload');

// ─── PUBLIC: Student submits a permission request (no auth needed) ───────────
router.post('/pending-permissions/submit', upload.single('letter'), pendingPermissionController.submitRequest);
router.get('/pending-permissions/lookup-class', pendingPermissionController.lookupClass);

// All routes here require Authentication
router.use(authMiddleware);

// Setup
router.post('/class/setup', setupController.setupClass);
router.get('/class/me', setupController.getClassDetails);

// Attendance
router.post('/attendance', (req, res, next) => {
    console.log('📝 POST /attendance request received');
    attendanceController.markAttendance(req, res, next);
});

router.put('/attendance/:id', (req, res, next) => {
    console.log(`✏️ PUT /attendance/${req.params.id} request received`);
    attendanceController.updateAttendance(req, res, next);
});

router.get('/history', attendanceController.getHistory);

// Catch all for /attendance to help debug
router.all('/attendance*', (req, res) => {
    console.warn(`🚨 Unhandled /attendance request: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: 'Attendance API endpoint not found',
        received: { method: req.method, url: req.originalUrl }
    });
});

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

// Pending Permissions (CR review)
router.get('/pending-permissions', pendingPermissionController.getPendingRequests);
router.post('/pending-permissions/:id/approve', pendingPermissionController.approveRequest);
router.post('/pending-permissions/:id/reject', pendingPermissionController.rejectRequest);
router.delete('/pending-permissions/:id', pendingPermissionController.deleteRequest);

// Payments
router.get('/payments/events', paymentController.getEvents);
router.post('/payments/events', paymentController.createEvent);
router.get('/payments/events/:id/records', paymentController.getEventRecords);
router.patch('/payments/records/:recordId', paymentController.updateRecord);
router.delete('/payments/events/:id', paymentController.deleteEvent);

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
