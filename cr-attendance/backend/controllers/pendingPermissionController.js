const PendingPermission = require('../models/PendingPermission');
const Permission = require('../models/Permission');
const Class = require('../models/Class');

// ---------------------------------------------------------
// PUBLIC: Look up classId by dept + section + admissionYear + collegeCode
// GET /api/pending-permissions/lookup-class?dept=CSE&section=A&admissionYear=23&collegeCode=PA
// ---------------------------------------------------------
exports.lookupClass = async (req, res) => {
    try {
        const { dept, section, admissionYear, collegeCode } = req.query;
        if (!dept || !section) {
            return res.status(400).json({ error: 'dept and section are required' });
        }

        // Case-insensitive regex matching for flexibility
        const query = {
            dept: new RegExp(`^${dept.trim()}$`, 'i'),
            section: new RegExp(`^${section.trim()}$`, 'i')
        };
        if (admissionYear && admissionYear.trim()) {
            query.admissionYear = new RegExp(`^${admissionYear.trim()}$`, 'i');
        }
        if (collegeCode && collegeCode.trim()) {
            query.collegeCode = new RegExp(`^${collegeCode.trim()}$`, 'i');
        }

        console.log('🔍 lookupClass query:', JSON.stringify({ dept, section, admissionYear, collegeCode }));

        // Debug: show all classes in DB
        const allClasses = await Class.find({}, 'dept section admissionYear collegeCode _id');
        console.log('📚 All classes in DB:', JSON.stringify(allClasses));

        const cls = await Class.findOne(query);
        console.log('✅ Matched class:', cls ? `${cls.dept}-${cls.section} (${cls._id})` : 'NONE');

        if (!cls) {
            const available = allClasses.map(c => `${c.dept}-${c.section} (batch:${c.admissionYear}, college:${c.collegeCode})`);
            return res.status(404).json({
                error: `No class found for Branch: ${dept.toUpperCase()}, Section: ${section.toUpperCase()}${admissionYear ? ', Batch: ' + admissionYear : ''}. Please check your details with your CR.`,
                searched: { dept, section, admissionYear, collegeCode },
                availableClasses: available
            });
        }

        res.json({
            classId: cls._id,
            dept: cls.dept,
            section: cls.section,
            admissionYear: cls.admissionYear,
            collegeCode: cls.collegeCode
        });
    } catch (err) {
        console.error('❌ lookupClass error:', err);
        res.status(500).json({ error: err.message });
    }
};


// ---------------------------------------------------------
// PUBLIC: Student submits a permission request
// No auth required – student submits via classId query param
// POST /api/pending-permissions?classId=<classId>
// ---------------------------------------------------------
exports.submitRequest = async (req, res) => {
    try {
        const { classId } = req.query;

        if (!classId) {
            return res.status(400).json({ error: 'classId query parameter is required' });
        }

        // Verify class exists
        const cls = await Class.findById(classId);
        if (!cls) {
            return res.status(404).json({ error: 'Class not found. Please check the class ID.' });
        }

        // Multer puts files in req.file, other fields in req.body
        const {
            studentRoll,
            startDate,
            endDate,
            type,
            customPeriods,
            reason,
            hasPermissionLetter
        } = req.body;

        // letterFileUrl can come from req.file (new way) or req.body (old base64 way)
        let finalFileUrl = req.body.letterFileUrl || null;

        if (req.file) {
            // Generate a full URL that acts as a "Drive URL"
            // In production, this would be a Cloudinary or S3 link
            const protocol = req.protocol;
            const host = req.get('host');
            finalFileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

        if (!studentRoll || !startDate || !endDate || !reason) {
            return res.status(400).json({ error: 'studentRoll, startDate, endDate, and reason are required' });
        }

        const newRequest = new PendingPermission({
            classId,
            studentRoll: studentRoll.trim().toUpperCase(),
            startDate,
            endDate,
            type: type || 'FULL_DAY',
            customPeriods: type === 'CUSTOM' ? (typeof customPeriods === 'string' ? JSON.parse(customPeriods) : customPeriods) : [],
            reason: reason.trim(),
            hasPermissionLetter: hasPermissionLetter === 'true' || hasPermissionLetter === true,
            letterFileUrl: finalFileUrl,
            status: 'PENDING'
        });

        await newRequest.save();
        res.status(201).json({
            message: 'Permission request submitted successfully!',
            id: newRequest._id,
            driveUrl: finalFileUrl
        });
    } catch (err) {
        console.error('❌ submitRequest error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// CR: Get all pending requests for their class
// GET /api/pending-permissions
// ---------------------------------------------------------
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await PendingPermission.find({
            classId: req.user.classId,
            status: 'PENDING'
        }).sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// CR: Approve a pending request → creates an active Permission
// POST /api/pending-permissions/:id/approve
// ---------------------------------------------------------
exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const pending = await PendingPermission.findOne({
            _id: id,
            classId: req.user.classId,
            status: 'PENDING'
        });

        if (!pending) {
            return res.status(404).json({ error: 'Pending request not found or already reviewed' });
        }

        // Create active permission
        const newPerm = new Permission({
            classId: req.user.classId,
            studentRoll: pending.studentRoll,
            startDate: pending.startDate,
            endDate: pending.endDate,
            type: pending.type,
            customPeriods: pending.customPeriods,
            reason: pending.reason,
            approvedBy: 'CR',
            letterFileUrl: pending.letterFileUrl
        });
        await newPerm.save();

        // Mark as approved
        pending.status = 'APPROVED';
        pending.reviewedBy = req.user.username || 'CR';
        pending.reviewedAt = new Date();
        await pending.save();

        res.json({ message: 'Approved and moved to active permissions', permission: newPerm });
    } catch (err) {
        console.error('❌ approveRequest error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// CR: Reject a pending request
// POST /api/pending-permissions/:id/reject
// ---------------------------------------------------------
exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const pending = await PendingPermission.findOne({
            _id: id,
            classId: req.user.classId,
            status: 'PENDING'
        });

        if (!pending) {
            return res.status(404).json({ error: 'Pending request not found or already reviewed' });
        }

        pending.status = 'REJECTED';
        pending.reviewedBy = req.user.username || 'CR';
        pending.reviewedAt = new Date();
        await pending.save();

        res.json({ message: 'Request rejected' });
    } catch (err) {
        console.error('❌ rejectRequest error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// CR: Delete a pending request
// DELETE /api/pending-permissions/:id
// ---------------------------------------------------------
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PendingPermission.findOneAndDelete({
            _id: id,
            classId: req.user.classId
        });

        if (!deleted) return res.status(404).json({ error: 'Request not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
