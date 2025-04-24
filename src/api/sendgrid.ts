'use server';

import 'server-only';

import * as sgMail from '@sendgrid/mail';
import { addErrorEvent } from './firebase';
import { email } from '@/types/SendgridTypes';

const apiKey = process.env.SENDGRID_API_KEY;

export default async function sendEmail(msg: email) {
    if (apiKey) sgMail.setApiKey(apiKey);

    sgMail
        .send(msg)
        .then(() => console.log('email sent'))
        .catch((error) => addErrorEvent('send email', error));
}
