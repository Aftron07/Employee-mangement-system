const express = require('express');
const router = express.Router();

const { authorize } = require('../middleware/authMiddleware');
const { getAdminSummary } = require('../controllers/dashboardController');

router.get('/admin', authorize('admin'), getAdminSummary);

module.exports = router;