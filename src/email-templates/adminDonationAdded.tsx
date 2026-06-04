'use client';

import DonationCardSmall from '@/components/DonationCardSmall';
import { AdminDonationBody } from '@/types/DonationTypes';
import { renderToString } from 'react-dom/server';
import { emailSender, emailCc } from '@/data/emailSender';

export default function adminDonationAdded(adminEmail: string, adminName: string, donations: AdminDonationBody[]) {
    const donationCards = donations.map((donation, index) => <DonationCardSmall key={index} donation={donation} />);

    let html = `<p>Hello ${adminName},</p>
        <p>You have added the following items directly to the Baby Product Exchange inventory:</p>
    `;
    html += renderToString(donationCards);

    const tagsList = donations.map(d => d.tagNumber).join(', ');
    html += `<h3>Tag numbers: ${tagsList}</h3>
        <p><em>These items were added via admin donation and are immediately available in inventory.</em></p>`;

    return {
        to: adminEmail,
        cc: emailCc,
        from: emailSender,
        subject: 'Items added to Baby Product Exchange inventory',
        html: html
    };
}
