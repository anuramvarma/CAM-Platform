const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hodController');
// const { verifyToken, verifyRole } = require('../middleware/authMiddleware'); 
// Assuming middleware exists. I need to check authMiddleware.js to import correctly.

const authMiddleware = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, hodController.getStats);
router.get('/classes', authMiddleware, hodController.getClasses);
router.post('/classes', authMiddleware, hodController.createClass);
router.delete('/classes/:classId', authMiddleware, hodController.deleteClass);
router.put('/classes/:classId', authMiddleware, hodController.updateClass);
router.get('/students/:classId', authMiddleware, hodController.getStudentsByClass);
router.post('/students', authMiddleware, hodController.addStudent);
router.delete('/students/:id', authMiddleware, hodController.deleteStudent);

router.get('/permissions/:classId', authMiddleware, hodController.getPermissionsByClass);
router.post('/permissions', authMiddleware, hodController.addPermission);
router.delete('/permissions/:id', authMiddleware, hodController.deletePermission);

router.get('/crs', authMiddleware, hodController.getCRs);
router.post('/crs/approve', authMiddleware, hodController.approveCR);
router.delete('/crs/:id', authMiddleware, hodController.deleteUser); // Existing

router.post('/classes/promote', authMiddleware, hodController.promoteClasses);
router.post('/classes/promote/undo', authMiddleware, hodController.undoPromoteClasses);

module.exports = router;
