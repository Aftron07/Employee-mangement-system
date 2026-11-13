const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/authMiddleware');
const {
    getToday,
    checkIn,
    checkOut,
    getMine,
    getAll
} = require('../controllers/attendanceController');

// Staff: employees and managers record their own attendance.
router.get('/today', authorize('employee', 'manager'), getToday);
router.post('/check-in', authorize('employee', 'manager'), checkIn);
router.post('/check-out', authorize('employee', 'manager'), checkOut);
router.get('/my', authorize('employee', 'manager'), getMine);

// Admin: view everyone's records.
router.get('/', authorize('admin'), getAll);

module.exports = router;