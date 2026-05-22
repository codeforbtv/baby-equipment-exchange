'use server';

import 'server-only';
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

export default async function sendMail(msg) {
    try {
        const info = await transporter.sendMail(msg);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.log('Error sending nodemailer email', error);
    }
}

export async function verifyMailer() {
    try {
        await transporter.verify();
        console.log('emailer verified');
    } catch (error) {
        console.log('emailer NOT verified', error);
    }
}
