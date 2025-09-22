'use client';

import DonationCardSmall from '@/components/DonationCardSmall';
import { DonationBody } from '@/types/DonationTypes';
import { renderToString } from 'react-dom/server';

export default function donationsSubmitted(donorEmail: string, donorName: string, donations: DonationBody[]) {
    const donationCards = donations.map((donation) => <DonationCardSmall donation={donation} />);

    let html = `<p>Hello ${donorName},</p>
        <p>We have recieved your request to donate the following items:</p>
    `;
    html += renderToString(donationCards);

    html += `Please be patient while we review your request. You will recieve another email once we've determined whether we can accept your items.`;

    return {
        to: donorEmail,
        from: 'bryan.parmelee@gmail.com',
        subject: 'Your Baby Equipment Exchange donation has been submitted.',
        html: html
    };
}
