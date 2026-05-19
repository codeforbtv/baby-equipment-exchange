import 'server-only';

import { adminNotificationEmail } from '@/data/adminNotificationEmail';
import { sanitize } from '@/utils/utils';
import { NewUserAccountInfo } from '@/types/UserTypes';

export default function adminUserCreated(
    userId: string,
    accountInfo: NewUserAccountInfo
) {
    const organization =
        accountInfo.organization?.name ??
        accountInfo.notes.find((note) =>
            note.startsWith('User provided organization:')
        ) ??
        'Not provided';
    const title = accountInfo.title || 'Not provided';

    return {
        to: adminNotificationEmail,
        from: adminNotificationEmail,
        subject: 'Baby Product Exchange account created',
        html: `
            <p>A new Baby Product Exchange account has been created and is awaiting review.</p>
            <p><b>Name:</b> ${sanitize(accountInfo.displayName)}</p>
            <p><b>Email:</b> ${sanitize(accountInfo.email)}</p>
            <p><b>Phone:</b> ${sanitize(accountInfo.phoneNumber)}</p>
            <p><b>Organization:</b> ${sanitize(organization)}</p>
            <p><b>Title:</b> ${sanitize(title)}</p>
            <p><b>User ID:</b> ${sanitize(userId)}</p>
        `
    };
}
