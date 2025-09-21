import { sanitize } from '@/utils/utils';

export default function reject(donorEmail: string, message: string, notes?: string) {
    let html = message;
    if (notes && notes.length > 0) {
        const sanitizedNotes = sanitize(notes);
        html += `<p><b>Additional notes</b><br>
           ${sanitizedNotes}</p>`;
    }

    return {
        to: donorEmail,
        from: 'bryan.parmelee@gmail.com',
        subject: 'Your Baby Equipment Exchange donation has been reviewed',
        html: html
    };
}
