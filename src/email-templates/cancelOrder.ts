import { emailCc, emailSender } from '@/data/emailSender';
import { sanitize } from '@/utils/utils';

export default function cancelOrder(email: string, message: string, tagNumbers: string[], notes?: string, inviteUrl?: string) {
    let html = message;

    if (tagNumbers.length > 0) {
        html += `<p>Please reference the following tag numbers: ${tagNumbers.join(', ')}</p>`;
    }

    if (inviteUrl) {
        html += `<p><b><a href="${inviteUrl}">Click here to schedule a follow-up conversation</a></b></p>`;
    }

    if (notes && notes.length > 0) {
        html += `<p><b>Additional notes</b><br>${sanitize(notes)}</p>`;
    }

    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange order has been updated',
        html
    };
}
