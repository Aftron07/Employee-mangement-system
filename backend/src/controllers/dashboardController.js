const pool = require('../config/db');

const getAdminSummary = async (req, res) => {
    try {
        const [[employees]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM employees
             WHERE deleted_at IS NULL AND is_active = 1`
        );

        const [[departments]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM departments
             WHERE deleted_at IS NULL AND is_active = 1`
        );

        const [[locked]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM users
             WHERE locked_at IS NOT NULL`
        );

        const [[present]] = await pool.query(
            `SELECT COUNT(*) AS total
             FROM attendance
             WHERE work_date = CURDATE()`
        );

        const [recentEmployees] = await pool.query(
            `SELECT id, employee_code, first_name, last_name,
                    designation, created_at
             FROM employees
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC
             LIMIT 5`
        );

        return res.status(200).json({
            totals: {
                employees: employees.total,
                departments: departments.total,
                locked_accounts: locked.total,
                present_today: present.total,
            },
            recent_employees: recentEmployees
        });
    } catch (error) {
        console.error('Admin summary error:', error.message);

        return res.status(500).json({
            message: 'Unable to load dashboard data.'
        });
    }
};

module.exports = { getAdminSummary };