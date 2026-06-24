import { emailSender, emailCc } from '@/data/emailSender';

export default function reservedForUser(email: string, name: string, itemHtml: string) {
    const html =
        `<p>Hello ${name},</p>` +
        `<p>An item has been reserved for you through the Baby Product Exchange:</p>` +
        itemHtml +
        `<p>You'll receive pickup details soon.</p>`;
    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'An item has been reserved for you',
        html
    };
}
