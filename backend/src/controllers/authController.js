
const { sendPasswordResetEmail } = require('../utils/mailer');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: 'Authentication is not configured.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `SELECT id, email, password_hash, role,
                    employee_id, is_active,
                    failed_login_attempts, locked_at,
                    must_change_password
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        if (user.locked_at) {
            return res.status(423).json({
                message: 'Account locked. Contact your administrator.'
            });
        }

        const passwordIsValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordIsValid) {
            await pool.execute(
                `UPDATE users
                 SET failed_login_attempts = failed_login_attempts + 1,
                     locked_at = CASE
                         WHEN failed_login_attempts + 1 >= 5
                         THEN UTC_TIMESTAMP()
                         ELSE locked_at
                     END
                 WHERE id = ? AND locked_at IS NULL`,
                [user.id]
            );

            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        await pool.execute(
            `UPDATE users
             SET failed_login_attempts = 0
             WHERE id = ?`,
            [user.id]
        );

        const mustChangePassword = Boolean(
            user.must_change_password
        );

        const token = jwt.sign(
            {
                role: user.role,
                employee_id: user.employee_id,
                must_change_password: mustChangePassword
            },
            process.env.JWT_SECRET,
            {
                subject: String(user.id),
                expiresIn: process.env.JWT_EXPIRES_IN || '8h'
            }
        );

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id,
                must_change_password: mustChangePassword
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

// LOGOUT
const logout = async (req, res) => {
    try {
        return res.status(200).json({
            message: 'Logout successful.'
        });

    } catch (error) {
        console.error('Logout error:', error.message);

        return res.status(500).json({
            message: 'Unable to logout right now.'
        });
    }
};

// GET CURRENT USER
const getMe = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, email, role, employee_id, is_active,
                    must_change_password, locked_at
             FROM users
             WHERE id = ? AND is_active = 1`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Account is no longer active.'
            });
        }

        const user = users[0];

        if (user.locked_at) {
            return res.status(401).json({
                message: 'Account is locked.'
            });
        }

        if (user.employee_id === null) {
            return res.status(200).json({ user });
        }

        const [employees] = await pool.execute(
            `SELECT e.id, e.employee_code, e.first_name,
                    e.last_name, e.email, e.designation,
                    e.department_id, d.name AS department_name,
                    e.is_active
             FROM employees e
             LEFT JOIN departments d ON d.id = e.department_id
             WHERE e.id = ? AND e.deleted_at IS NULL`,
            [user.employee_id]
        );

        return res.status(200).json({
            user,
            employee: employees[0] || null
        });

    } catch (error) {
        console.error('Get current user error:', error.message);

        return res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

// CREATE USER
const createUser = async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            employee_id = null
        } = req.body;

        if (
            typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof password !== 'string' ||
            password.length < 12 ||
            !['admin', 'manager', 'employee'].includes(role) ||
            (
                employee_id !== null &&
                !Number.isSafeInteger(Number(employee_id))
            )
        ) {
            return res.status(400).json({
                message: 'Provide a valid email, a password of at least 12 characters, a role and an optional employee_id.'
            });
        }

        if (role !== 'admin' && employee_id === null) {
            return res.status(400).json({
                message: 'Manager and employee accounts require an employee_id.'
            });
        }

        if (role === 'admin' && employee_id !== null) {
            return res.status(400).json({
                message: 'Create Admin accounts without employee_id.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        let linkedEmployeeId = null;

        if (employee_id !== null) {
            const [employees] = await pool.execute(
                `SELECT id, email, is_active
                 FROM employees
                 WHERE id = ? AND deleted_at IS NULL`,
                [Number(employee_id)]
            );

            if (
                employees.length === 0 ||
                !employees[0].is_active ||
                employees[0].email.toLowerCase() !== normalizedEmail
            ) {
                return res.status(400).json({
                    message: 'Employee must exist, be active, and have the same email.'
                });
            }

            linkedEmployeeId = Number(employee_id);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
                (email, password_hash, role, employee_id,
                 is_active, must_change_password,
                 failed_login_attempts)
             VALUES (?, ?, ?, ?, 1, 1, 0)`,
            [
                normalizedEmail,
                passwordHash,
                role,
                linkedEmployeeId
            ]
        );

        return res.status(201).json({
            message: 'User account created successfully.',
            user: {
                id: result.insertId,
                email: normalizedEmail,
                role,
                employee_id: linkedEmployeeId,
                must_change_password: true
            }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Email or employee already has an account.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                message: 'Invalid employee_id.'
            });
        }

        console.error('Create user error:', error.message);

        return res.status(500).json({
            message: 'Internal server error.'
        });
    }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (
            typeof currentPassword !== 'string' ||
            typeof newPassword !== 'string' ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                message: 'Current password and new password are required.'
            });
        }

        if (newPassword.length < 12) {
            return res.status(400).json({
                message: 'New password must be at least 12 characters long.'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: 'New password must differ from the current password.'
            });
        }

        const [users] = await pool.execute(
            `SELECT id, password_hash
             FROM users
             WHERE id = ? AND is_active = 1 AND locked_at IS NULL`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Active, unlocked user account not found.'
            });
        }

        const passwordIsValid = await bcrypt.compare(
            currentPassword,
            users[0].password_hash
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: 'Current password is incorrect.'
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        await pool.execute(
            `UPDATE users
             SET password_hash = ?,
                 must_change_password = 0,
                 failed_login_attempts = 0,
                 password_reset_token_hash = NULL,
                 password_reset_expires_at = NULL
             WHERE id = ?`,
            [newPasswordHash, req.user.id]
        );

        return res.status(200).json({
            message: 'Password changed successfully.'
        });

    } catch (error) {
        console.error('Change password error:', error.message);

        return res.status(500).json({
            message: 'Unable to change password right now.'
        });
    }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({
                message: 'Email is required.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `SELECT id, is_active
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        const response = {
            message: 'If an active account exists, password-reset instructions will be sent.'
        };

        if (users.length === 0 || !users[0].is_active) {
            return res.status(200).json(response);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        await pool.execute(
            `UPDATE users
             SET password_reset_token_hash = ?,
                 password_reset_expires_at =
                     DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)
             WHERE id = ?`,
            [tokenHash, users[0].id]
        );

        const resetLink =
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}` +
            `/reset-password?token=${resetToken}`;

        sendPasswordResetEmail(normalizedEmail, resetLink)
            .then(() => console.log('Reset email sent to', normalizedEmail))
            .catch((error) => {
                console.error('Reset email failed:', error.message);
            });

        return res.status(200).json(response);

    } catch (error) {
        console.error('Forgot password error:', error.message);

        return res.status(500).json({
            message: 'Unable to process the request right now.'
        });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (
            typeof token !== 'string' ||
            !token ||
            typeof newPassword !== 'string' ||
            newPassword.length < 12
        ) {
            return res.status(400).json({
                message: 'A valid reset token and a password of at least 12 characters are required.'
            });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const [users] = await pool.execute(
            `SELECT id
             FROM users
             WHERE password_reset_token_hash = ?
               AND password_reset_expires_at > UTC_TIMESTAMP()
               AND is_active = 1
             LIMIT 1`,
            [tokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({
                message: 'Reset token is invalid or expired.'
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        const [result] = await pool.execute(
            `UPDATE users
             SET password_hash = ?,
                 must_change_password = 0,
                 password_reset_token_hash = NULL,
                 password_reset_expires_at = NULL
             WHERE id = ?
               AND password_reset_token_hash = ?
               AND password_reset_expires_at > UTC_TIMESTAMP()
               AND is_active = 1`,
            [passwordHash, users[0].id, tokenHash]
        );

        if (result.affectedRows !== 1) {
            return res.status(400).json({
                message: 'Reset token is invalid or expired.'
            });
        }

        return res.status(200).json({
            message: 'Password reset successfully. If the account is locked, contact your administrator.'
        });

    } catch (error) {
        console.error('Reset password error:', error.message);

        return res.status(500).json({
            message: 'Unable to reset the password right now.'
        });
    }
};

// UNLOCK USER
const unlockUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId < 1) {
            return res.status(400).json({
                message: 'A valid user ID is required.'
            });
        }

        const [result] = await pool.execute(
            `UPDATE users
             SET locked_at = NULL,
                 failed_login_attempts = 0
             WHERE id = ? AND is_active = 1`,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Active user account not found.'
            });
        }

        return res.status(200).json({
            message: 'Account unlocked successfully.'
        });

    } catch (error) {
        console.error('Unlock account error:', error.message);

        return res.status(500).json({
            message: 'Unable to unlock the account right now.'
        });
    }
};

module.exports = {
    login,
    logout,
    getMe,
    createUser,
    changePassword,
    forgotPassword,
    resetPassword,
    unlockUser
};
