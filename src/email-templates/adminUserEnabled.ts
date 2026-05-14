import 'server-only';

import { adminNotificationEmail } from '@/data/adminNotificationEmail';
import { sanitize } from '@/utils/utils';

type EnabledUserNotification = {
    email?: string;
    displayName?: string;
    uid: string;
};

export default function adminUserEnabled(user: EnabledUserNotification) {
    return {
        to: adminNotificationEmail,
        from: adminNotificationEmail,
        subject: 'Baby Product Exchange account enabled',
        html: `
            <p>A Baby Product Exchange account has been enabled.</p>
            <p><b>Name:</b> ${sanitize(user.displayName ?? 'Not provided')}</p>
            <p><b>Email:</b> ${sanitize(user.email ?? 'Not provided')}</p>
            <p><b>User ID:</b> ${sanitize(user.uid)}</p>
        `
    };
}
