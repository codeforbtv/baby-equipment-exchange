import { sanitize } from '@/utils/utils';
import { email } from '@/types/SendgridTypes';

export default function reject(donorEmail: string, notes?: string): email {
    const sanitizedNotes = notes ? sanitize(notes) : '';
    return {
        to: donorEmail,
        from: 'info@vermontconnector.org',
        subject: 'Your Baby Equipment Exchange donation(s) have been rejected',
        html: `
            <p>Your donation(s) to the Baby Equipment Exchange have been rejected</p>           
            <p><b>Additional notes</b></p>
            <p>${sanitizedNotes}</p>
        `
    };
}
