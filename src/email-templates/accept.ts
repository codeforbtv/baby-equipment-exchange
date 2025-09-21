import { sanitize } from '@/utils/utils';

export default function accept(donorEmail: string, inviteUrl: string, message: string, notes?: string) {
    let html = message;
    const schedulingLink = `<h3><b>*** <a href='${inviteUrl}'>Click here to schedule a dropoff for your accepted items</a>  ***</b></h3>`;
    html += schedulingLink;
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
