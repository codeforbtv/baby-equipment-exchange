import { sanitize } from '@/utils/utils';
import { emailSender, emailCc } from '@/data/emailSender';

export default function reject(donorEmail: string, message: string, notes?: string) {
    let html = message;
    if (notes && notes.length > 0) {
        const sanitizedNotes = sanitize(notes);
        html += `<p><b>Additional notes</b><br>
           ${sanitizedNotes}</p>`;
    }

    return {
        to: donorEmail,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange donation has been reviewed',
        html: html
    };
}
