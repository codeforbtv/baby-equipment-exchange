import { emailSender, emailCc } from '@/data/emailSender';

export default function enableUser(email: string, userName: string) {
    return {
        to: email,
        cc: emailCc,
        from: emailSender,
        subject: 'Your Baby Product Exchange user account has been enabled',
        html: `<p>Hello ${userName}</p><p>The user account you created for the Baby Product Exchange has been enabled.</"p><p>If you feel this was done in error, please email <a href="mailto:info@vermontconnector.org">info@vermontconnector.org</a></p><p>Thank you and have a great day.</p>`
    };
}
