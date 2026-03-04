const mongoose = require('mongoose');
const PaymentEvent = require('../models/PaymentEvent');
const PaymentRecord = require('../models/PaymentRecord');
const Student = require('../models/Student');

// ---------------------------------------------------------
// Get all Payment Events for the class
// GET /api/payments/events
// ---------------------------------------------------------
exports.getEvents = async (req, res) => {
    try {
        if (!req.user || !req.user.classId) {
            return res.status(403).json({ error: 'Unauthorized: No class associated' });
        }

        const classId = new mongoose.Types.ObjectId(req.user.classId);
        const events = await PaymentEvent.find({ classId: req.user.classId }).sort({ createdAt: -1 });

        // Calculate stats for each event
        const stats = await PaymentRecord.aggregate([
            { $match: { classId: classId } },
            {
                $group: {
                    _id: "$eventId",
                    totalPaidCount: { $sum: { $cond: ["$isPaid", 1, 0] } },
                    totalAmountCollected: { $sum: "$paidAmount" }
                }
            }
        ]);

        console.log(`📊 getEvents: Found ${events.length} events and stats for ${stats.length} events`);

        const eventsWithStats = events.map(event => {
            const stat = stats.find(s => s._id && s._id.toString() === event._id.toString());
            return {
                ...event.toObject(),
                id: event._id,
                paidCount: stat ? stat.totalPaidCount : 0,
                totalCollected: stat ? stat.totalAmountCollected : 0
            };
        });

        res.json(eventsWithStats);
    } catch (err) {
        console.error('❌ getEvents error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// Create a new Payment Event
// POST /api/payments/events
// ---------------------------------------------------------
exports.createEvent = async (req, res) => {
    console.log('💰 createEvent request:', req.body, 'user:', req.user);
    try {
        const { eventName, amountPerHead, description } = req.body;
        if (!eventName || !amountPerHead) {
            return res.status(400).json({ error: 'Event name and Amount per head are required' });
        }

        if (!req.user || !req.user.classId) {
            console.error('❌ createEvent: No classId found in user session');
            return res.status(403).json({ error: 'Unauthorized: No class associated with this user' });
        }

        const newEvent = new PaymentEvent({
            classId: req.user.classId,
            eventName,
            amountPerHead,
            description
        });

        await newEvent.save();
        console.log('✅ Payment Event created:', newEvent._id);

        // Pre-fill records for all students in the class
        const students = await Student.find({ classId: req.user.classId });
        console.log(`🔍 Found ${students.length} students to create records for`);

        const records = students
            .map(s => {
                const roll = s.rollNumber || s.rollNo;
                if (!roll) {
                    console.warn(`⚠️ Student skip: ID ${s._id} has no roll number`);
                    return null;
                }
                return {
                    eventId: newEvent._id,
                    classId: req.user.classId,
                    studentRoll: roll,
                    isPaid: false,
                    paidAmount: 0
                };
            })
            .filter(record => record !== null);

        // Deduplicate records by studentRoll just in case DB has duplicates
        const uniqueRolls = new Set();
        const uniqueRecords = records.filter(r => {
            if (uniqueRolls.has(r.studentRoll)) {
                console.warn(`⚠️ createEvent: Skipping duplicate studentRoll ${r.studentRoll}`);
                return false;
            }
            uniqueRolls.add(r.studentRoll);
            return true;
        });

        if (uniqueRecords.length > 0) {
            await PaymentRecord.insertMany(uniqueRecords);
            console.log(`✅ ${uniqueRecords.length} PaymentRecords inserted`);
        } else {
            console.warn('⚠️ No valid student records to insert for this event.');
        }

        res.status(201).json(newEvent);
    } catch (err) {
        console.error('❌ createEvent error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// Get student payment records for an event
// GET /api/payments/events/:id/records
// ---------------------------------------------------------
exports.getEventRecords = async (req, res) => {
    try {
        const { id } = req.params;
        const records = await PaymentRecord.find({ eventId: id }).sort({ studentRoll: 1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// Update payment status for a student
// PATCH /api/payments/records/:recordId
// ---------------------------------------------------------
exports.updateRecord = async (req, res) => {
    try {
        const { recordId } = req.params;
        const { isPaid, paidAmount } = req.body;

        const record = await PaymentRecord.findById(recordId);
        if (!record) return res.status(404).json({ error: 'Record not found' });

        record.isPaid = isPaid;
        record.paidAmount = isPaid ? (paidAmount || 0) : 0;
        record.paidAt = isPaid ? new Date() : null;

        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ---------------------------------------------------------
// Delete an event and its records
// DELETE /api/payments/events/:id
// ---------------------------------------------------------
exports.deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await PaymentEvent.findOneAndDelete({ _id: id, classId: req.user.classId });
        await PaymentRecord.deleteMany({ eventId: id });
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
