import { sanitize, sanitizeCalendlyUrl, sanitizeTagNumbers } from '@/utils/utils';
import { emailSender, emailCc } from '@/data/emailSender';

export default function accept(donorEmail: string, inviteUrl: string, message: string, tagNumbers: string[], notes?: string) {
    let html = message;
    const cleanTags = sanitizeTagNumbers(tagNumbers);
    const tagsList = cleanTags.join(', ');
    const cleanUrl = sanitizeCalendlyUrl(inviteUrl);

    if (cleanUrl.length > 0) {
        const schedulingLink = `<h3><b>*** <a href='${cleanUrl}'>Click here to schedule a dropoff for your accepted items</a>  ***</b><br>Please reference the following tag numbers: ${tagsList}</h3>`;
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
        to: donorEmail,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange donation has been reviewed',
        html: html
    };
}
