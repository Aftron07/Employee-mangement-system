const nodemailer = require('nodemailer');

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });
}

async function sendPasswordResetEmail(to, resetLink) {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: 'Reset your EMS password',
        text:
            'We received a request to reset your password.\n\n' +
            `Open this link to choose a new password (valid for 15 minutes):\n${resetLink}\n\n` +
            'If you did not request this, you can ignore this email.',
        html:
            '<p>We received a request to reset your password.</p>' +
            `<p><a href="${resetLink}">Reset my password</a></p>` +
            '<p>This link is valid for 15 minutes.</p>' +
            '<p>If you did not request this, you can ignore this email.</p>'
    });
}

module.exports = { sendPasswordResetEmail };