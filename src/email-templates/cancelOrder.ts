import { sanitize, sanitizeCalendlyUrl, sanitizeTagNumbers } from '@/utils/utils';
import { emailSender, emailCc } from '@/data/emailSender';

export default function cancelOrder(email: string, message: string, tagNumbers: string[], notes?: string, inviteUrl?: string) {
    let html = message;
    const cleanTags = sanitizeTagNumbers(tagNumbers);
    const tagsList = cleanTags.join(', ');
    const cleanUrl = sanitizeCalendlyUrl(inviteUrl);

    if (cleanUrl.length > 0) {
        const schedulingLink = `<h3><b>*** <a href='${cleanUrl}'>Click here to schedule a time to discuss your request</a>  ***</b><br>Please reference the following tag numbers: ${tagsList}</h3>`;
        html += schedulingLink;
    }
    if (notes && notes.length > 0) {
        const sanitizedNotes = sanitize(notes);
        html += `<p><b>Additional notes</b><br>
           ${sanitizedNotes}</p>`;
    }
    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange order has been cancelled',
        html: html
    };
}
