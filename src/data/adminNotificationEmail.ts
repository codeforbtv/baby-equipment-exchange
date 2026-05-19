import 'server-only';

import { emailSender } from '@/data/emailSender';

export const adminNotificationEmail: string =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_SENDER ||
    process.env.SMTP_USER ||
    emailSender;
