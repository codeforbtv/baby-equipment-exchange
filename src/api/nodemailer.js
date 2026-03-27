'use server';

import 'server-only';
import * as nodemailer from 'nodemailer';
import { google } from 'googleapis';
const OAuth2 = google.auth.OAuth2;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thebabyproductexchange@gmail.com',
        pass: process.env.GOOGLE_APP_PASSWORD
    }
});

// const oauth2Client = new OAuth2(process.env.OAUTH_CLIENT_ID, process.env.OAUTH_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');

// oauth2Client.setCredentials({
//     refresh_token: process.env.OAUTH_REFRESH_TOKEN
// });

// const accessToken = await oauth2Client.getAccessToken();

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     scope: 'https://mail.google.com/',
//     auth: {
//         type: 'OAuth2',
//         user: 'wendy@vermontconnector.org',
//         clientId: process.env.OAUTH_CLIENT_ID,
//         clientSecret: process.env.OAUTH_CLIENT_SECRET,
//         refreshToken: process.env.OAUTH_REFRESH_TOKEN,
//         accessToken: process.env.OAUTH_ACCESS_TOKEN
//     }
// });

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
