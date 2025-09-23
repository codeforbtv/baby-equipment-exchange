import { sanitize } from '@/utils/utils';

export default function schedulePickup(email: string, inviteUrl: string, message: string, notes?: string) {
    let html = message;
    const schedulingLink = `<h3><b>*** <a href='${inviteUrl}'>Click here to schedule a pickup of your requested items</a>  ***</b></h3>`;
    html += schedulingLink;
    if (notes && notes.length > 0) {
        const sanitizedNotes = sanitize(notes);
        html += `<p><b>Additional notes</b><br>
           ${sanitizedNotes}</p>`;
    }
    return {
        to: email,
        from: 'info@vermontconnector.org',
        subject: 'Your Baby Equipment Exchange order has been fufilled',
        html: html
    };
}
