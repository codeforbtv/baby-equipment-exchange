'use server';

import 'server-only';

import * as nodemailer from 'nodemailer';
import { addErrorEvent } from './firebase';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bryan.parmelee@gmail.com',
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

export default async function sendMail(msg) {
    try {
        const info = await transporter.sendMail(msg);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        addErrorEvent('Send nodemailer email', error);
    }
}
