const pool = require('../config/db');

// Every attendance route for staff needs a linked, active employee profile.
async function requireEmployee(req, res) {
    if (!req.user.employee_id) {
        res.status(400).json({
            message: 'Your account is not linked to an employee profile.'
        });
        return null;
    }

    const [rows] = await pool.execute(
        `SELECT id
         FROM employees
         WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
        [req.user.employee_id]
    );

    if (rows.length === 0) {
        res.status(403).json({
            message: 'Your employee profile is inactive.'
        });
        return null;
    }

    return rows[0].id;
}

const TODAY_SQL = `
    SELECT id,
           DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
           check_in_at, check_out_at, working_minutes
    FROM attendance
    WHERE employee_id = ? AND work_date = CURDATE()
    LIMIT 1`;

const getToday = async (req, res) => {
    try {
        const employeeId = await requireEmployee(req, res);
        if (!employeeId) return;

        const [rows] = await pool.execute(TODAY_SQL, [employeeId]);

        return res.status(200).json({ attendance: rows[0] || null });
    } catch (error) {
        console.error('Get today attendance error:', error.message);
        return res.status(500).json({ message: 'Unable to load attendance.' });
    }
};

const checkIn = async (req, res) => {
    try {
        const employeeId = await requireEmployee(req, res);
        if (!employeeId) return;

        await pool.execute(
            `INSERT INTO attendance (employee_id, work_date, check_in_at)
             VALUES (?, CURDATE(), NOW())`,
            [employeeId]
        );

        const [rows] = await pool.execute(TODAY_SQL, [employeeId]);

        return res.status(201).json({
            message: 'Checked in successfully.',
            attendance: rows[0]
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'You have already checked in today.'
            });
        }

        console.error('Check-in error:', error.message);
        return res.status(500).json({ message: 'Unable to check in.' });
    }
};

const checkOut = async (req, res) => {
    try {
        const employeeId = await requireEmployee(req, res);
        if (!employeeId) return;

        const [existing] = await pool.execute(
            `SELECT id, check_out_at
             FROM attendance
             WHERE employee_id = ? AND work_date = CURDATE()
             LIMIT 1`,
            [employeeId]
        );

        if (existing.length === 0) {
            return res.status(400).json({
                message: 'You have not checked in today.'
            });
        }

        if (existing[0].check_out_at) {
            return res.status(409).json({
                message: 'You have already checked out today.'
            });
        }

        await pool.execute(
            `UPDATE attendance
             SET check_out_at = NOW(),
                 working_minutes = TIMESTAMPDIFF(MINUTE, check_in_at, NOW())
             WHERE id = ? AND check_out_at IS NULL`,
            [existing[0].id]
        );

        const [rows] = await pool.execute(TODAY_SQL, [employeeId]);

        return res.status(200).json({
            message: 'Checked out successfully.',
            attendance: rows[0]
        });
    } catch (error) {
        console.error('Check-out error:', error.message);
        return res.status(500).json({ message: 'Unable to check out.' });
    }
};

// The last 30 attendance records of the logged-in person.
const getMine = async (req, res) => {
    try {
        const employeeId = await requireEmployee(req, res);
        if (!employeeId) return;

        const [records] = await pool.execute(
            `SELECT id,
                    DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
                    check_in_at, check_out_at, working_minutes
             FROM attendance
             WHERE employee_id = ?
             ORDER BY work_date DESC
             LIMIT 30`,
            [employeeId]
        );

        return res.status(200).json({ records });
    } catch (error) {
        console.error('Get my attendance error:', error.message);
        return res.status(500).json({ message: 'Unable to load attendance.' });
    }
};

// Admin: every record for one date (defaults to today).
const getAll = async (req, res) => {
    try {
        const date = req.query.date || null;

        if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: 'Date must be in YYYY-MM-DD format.'
            });
        }

        const [records] = await pool.execute(
            `SELECT a.id, e.employee_code, e.first_name, e.last_name,
                    e.designation, d.name AS department_name,
                    DATE_FORMAT(a.work_date, '%Y-%m-%d') AS work_date,
                    a.check_in_at, a.check_out_at, a.working_minutes
             FROM attendance a
             JOIN employees e ON e.id = a.employee_id
             LEFT JOIN departments d ON d.id = e.department_id
             WHERE a.work_date = COALESCE(?, CURDATE())
             ORDER BY a.check_in_at ASC`,
            [date]
        );

        return res.status(200).json({ records });
    } catch (error) {
        console.error('Get all attendance error:', error.message);
        return res.status(500).json({ message: 'Unable to load attendance.' });
    }
};

module.exports = { getToday, checkIn, checkOut, getMine, getAll };