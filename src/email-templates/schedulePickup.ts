import { sanitize } from '@/utils/utils';
import { emailSender, emailCc } from '@/data/emailSender';

export default function schedulePickup(email: string, inviteUrl: string, message: string, tagNumbers: string[], notes?: string) {
    let html = message;
    let tagsList = '';
    for (let i = 0; i < tagNumbers.length; i++) {
        if (i < tagNumbers.length - 1) {
            tagsList += tagNumbers[i] + ', ';
        } else if (i === tagNumbers.length - 1) {
            tagsList += tagNumbers[i];
        }
    }
    const schedulingLink = `<h3><b>*** <a href='${inviteUrl}'>Click here to schedule a pickup of your requested items</a>  ***</b><br>Please reference the following tag numbers: ${tagsList}</h3>`;
    html += schedulingLink;
    if (notes && notes.length > 0) {
        const sanitizedNotes = sanitize(notes);
        html += `<p><b>Additional notes</b><br>
           ${sanitizedNotes}</p>`;
    }
    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange order has been fufilled',
        html: html
    };
}
