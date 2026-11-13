const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Authentication token is required'
            });
        }

        const token = authHeader.split(' ')[1];

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                message: 'Invalid or expired token'
            });
        }

        const [users] = await pool.query(
            `SELECT id, email, role, employee_id, is_active,
                    must_change_password, locked_at
             FROM users
             WHERE id = ?`,
            [decoded.sub]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                message: 'User account is inactive or unavailable'
            });
        }

        const user = users[0];

        if (user.locked_at) {
            return res.status(423).json({
                message: 'Your account is locked. Contact the Admin.'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
            must_change_password: Boolean(user.must_change_password)
        };

        const isPasswordChangeRoute =
            req.path.endsWith('/change-password');

        const isMeRoute = req.path.endsWith('/me');

        if (
            user.must_change_password &&
            !isPasswordChangeRoute &&
            !isMeRoute
        ) {
            return res.status(403).json({
                code: 'PASSWORD_CHANGE_REQUIRED',
                message: 'Please change your password before continuing.'
            });
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);

        return res.status(500).json({
            message: 'Authentication failed'
        });
    }
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Please log in first'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You are not authorized to perform this action'
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize
};