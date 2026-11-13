
require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function createAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (
            !email ||
            !password ||
            password.length < 12 ||
            !process.env.JWT_SECRET
        ) {
            throw new Error(
                'Set ADMIN_EMAIL, ADMIN_PASSWORD (12+ characters), and JWT_SECRET in .env'
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            `INSERT INTO users
                (email, password_hash, role, employee_id, is_active)
             VALUES (?, ?, 'admin', NULL, 1)
             ON DUPLICATE KEY UPDATE id = id`,
            [email, passwordHash]
        );

        if (result.affectedRows === 0) {
            console.log('Admin account already exists; no changes made.');
        } else {
            console.log('Admin account created successfully.');
        }
    } catch (error) {
        console.error('Could not create Admin:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

createAdmin();
