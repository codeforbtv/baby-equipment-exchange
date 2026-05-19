'use server';

import 'server-only';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_HOST,
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
