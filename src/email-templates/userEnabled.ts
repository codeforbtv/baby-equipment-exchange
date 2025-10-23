import { emailSender, emailCc } from '@/data/emailSender';

//To-Do, add login link once domain is set.
export default function userEnabled(email: string, displayName: string) {
    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Equipment Exchange account is now active.',
        html: `<p>Hello, ${displayName}</p>
                <p>Your account has been enabled and you can now log into the Baby Equipment Exchange with the username: ${email} and the password you created.</p>
        `
    };
}
