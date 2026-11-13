const cors = require("cors");
const express = require('express');
const app = express();
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const { authenticate, authorize } =
    require('./middleware/authMiddleware');

app.use(express.json({ limit: '1mb' }));

// Public health check
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Employee Management System API is running'
    });
});

// Public authentication route; individual routes enforce their own access.
app.use('/api/v1/auth', authRoutes);

// Database health check
app.get('/api/v1/health/db', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT DATABASE() AS database_name'
        );

        res.status(200).json({
            message: 'MySQL connection successful',
            database: rows[0].database_name
        });
    } catch (error) {
        console.error('Database health check error:', error.message);
        res.status(500).json({
            message: 'Database connection failed'
        });
    }
});

// Existing CRUD routes: Admin only until narrower permissions are added.
app.use(
    '/api/v1/departments',
    authenticate,
    authorize('admin'),
    departmentRoutes
);

app.use(
    '/api/v1/employees',
    authenticate,
    authorize('admin'),
    employeeRoutes
);

// Dashboard data: each route sets its own role rule.
app.use('/api/v1/dashboard', authenticate, dashboardRoutes);
app.use('/api/v1/attendance', authenticate, attendanceRoutes);








// Handle malformed JSON
app.use((error, req, res, next) => {
    if (
        error instanceof SyntaxError &&
        error.status === 400 &&
        'body' in error
    ) {
        return res.status(400).json({
            message: 'Invalid JSON request body'
        });
    }

    console.error('Unhandled server error:', error.message);

    return res.status(500).json({
        message: 'Internal server error'
    });
});

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown for local development and deployment.
process.on('SIGINT', () => {
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
});
