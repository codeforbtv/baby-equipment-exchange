import { sanitize } from '@/utils/utils';
import { email } from '@/types/SendgridTypes';

export default function accept(donorEmail: string, inviteUrl: string, notes?: string): email {
    const sanitizedNotes = notes ? sanitize(notes) : '';
    return {
        to: donorEmail,
        from: 'info@vermontconnector.org',
        subject: 'Your Baby Equipment Exchange donation(s) have been accpeted',
        html: `
            <p>Your donation(s) to the Baby Equipment Exchange have been accepted!</p>
            <p>Click <a href='${inviteUrl}'>here</a> to schedule a dropoff time.</p>
            <p><b>Additional notes</b></p>
            <p>${sanitizedNotes}</p>
        `
    };
}
