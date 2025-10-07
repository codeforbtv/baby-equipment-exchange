export default function rejectUser(email: string, userName: string) {
    return {
        to: email,
        from: 'info@vermontconnector.org',
        subject: 'Your Baby Product Exchange user account has been rejected',
        html: `<p>Hello ${userName}</p><p>The user account you created for the Baby Product Exchange has been rejected.</"p><p>If you feel this was done in error, please email <a href="mailto:info@vermontconnector.org">info@vermontconnector.org</a></p><p>Thank you and have a great day.</p>`
    };
}
