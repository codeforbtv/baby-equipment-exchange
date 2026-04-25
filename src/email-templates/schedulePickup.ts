import { sanitize, sanitizeSchedulingUrl, sanitizeTagNumbers } from '@/utils/utils';
import { emailSender, emailCc } from '@/data/emailSender';

export default function schedulePickup(email: string, inviteUrl: string, message: string, tagNumbers: string[], notes?: string) {
    let html = message;
    const cleanTags = sanitizeTagNumbers(tagNumbers);
    const tagsList = cleanTags.join(', ');
    const cleanUrl = sanitizeSchedulingUrl(inviteUrl);

    if (cleanUrl.length > 0) {
        const schedulingLink = `<h3><b>*** <a href='${cleanUrl}'>Click here to schedule a pickup of your requested items</a>  ***</b><br>Please reference the following tag numbers: ${tagsList}</h3>`;
        html += schedulingLink;
    } else if (tagsList.length > 0) {
        html += `<p>Please reference the following tag numbers: ${tagsList}</p>`;
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
        subject: 'Your Baby Product Exchange order has been fulfilled',
        html: html
    };
}
