export const emailSender: string = process.env.NEXT_PUBLIC_EMAIL_SENDER ?? '';

export const emailCc: string[] = (process.env.NEXT_PUBLIC_EMAIL_CC ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
