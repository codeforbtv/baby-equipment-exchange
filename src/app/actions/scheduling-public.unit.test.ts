/**
 * @jest-environment node
 */

const mockVerifyIdToken = jest.fn();
const mockAddErrorEvent = jest.fn();
const mockGetSchedulingPageLink = jest.fn();
const mockSendMail = jest.fn();

jest.mock(
    '@/api/firebaseAdmin',
    () => ({
        auth: {
            verifyIdToken: mockVerifyIdToken
        },
        addErrorEvent: mockAddErrorEvent,
        db: {},
        DONATIONS_COLLECTION: 'Donations',
        ORDERS_COLLECTION: 'Orders'
    }),
    { virtual: true }
);

jest.mock('../../api/firebaseAdmin', () => ({
    auth: {
        verifyIdToken: mockVerifyIdToken
    },
    addErrorEvent: mockAddErrorEvent,
    db: {},
    DONATIONS_COLLECTION: 'Donations',
    ORDERS_COLLECTION: 'Orders'
}));

jest.mock(
    '@/api/nodemailer',
    () => ({
        __esModule: true,
        default: mockSendMail
    }),
    { virtual: true }
);

jest.mock('../../api/nodemailer', () => ({
    __esModule: true,
    default: mockSendMail
}));

jest.mock('./scheduling', () => ({
    getSchedulingPageLink: mockGetSchedulingPageLink
}));

let getAdminSchedulingPageLinks: typeof import('./scheduling-public').getAdminSchedulingPageLinks;
let sendPickupSchedulingEmail: typeof import('./scheduling-public').sendPickupSchedulingEmail;

describe('public scheduling actions', () => {
    beforeAll(async () => {
        ({ getAdminSchedulingPageLinks, sendPickupSchedulingEmail } =
            await import('./scheduling-public'));
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('rejects unauthenticated scheduling link requests before calling Calendly', async () => {
        await expect(
            getAdminSchedulingPageLinks({ idToken: '' })
        ).rejects.toThrow('Unable to load scheduling links.');

        expect(mockVerifyIdToken).not.toHaveBeenCalled();
        expect(mockGetSchedulingPageLink).not.toHaveBeenCalled();
        expect(mockAddErrorEvent).toHaveBeenCalled();
    });

    it('rejects unauthenticated scheduling email requests before sending mail', async () => {
        await expect(
            sendPickupSchedulingEmail({
                idToken: '',
                orderId: 'order-1',
                eventTypeUri: 'forged-event'
            })
        ).rejects.toThrow('Unable to send scheduling email.');

        expect(mockVerifyIdToken).not.toHaveBeenCalled();
        expect(mockGetSchedulingPageLink).not.toHaveBeenCalled();
        expect(mockSendMail).not.toHaveBeenCalled();
        expect(mockAddErrorEvent).toHaveBeenCalled();
    });

    it('rejects non-admin users before calling Calendly', async () => {
        mockVerifyIdToken.mockResolvedValue({ admin: false } as any);

        await expect(
            getAdminSchedulingPageLinks({ idToken: 'user-token' })
        ).rejects.toThrow('Unable to load scheduling links.');

        expect(mockVerifyIdToken).toHaveBeenCalledWith('user-token', true);
        expect(mockGetSchedulingPageLink).not.toHaveBeenCalled();
        expect(mockAddErrorEvent).toHaveBeenCalled();
    });

    it('returns only active narrow scheduling link fields for admins', async () => {
        mockVerifyIdToken.mockResolvedValue({ admin: true } as any);
        mockGetSchedulingPageLink.mockResolvedValue([
            {
                active: true,
                uri: 'https://api.calendly.com/event_types/dropoff',
                name: 'Donation Dropoff',
                scheduling_url: 'https://calendly.com/bee/dropoff',
                internal_note: 'server-only metadata'
            },
            {
                active: false,
                uri: 'https://api.calendly.com/event_types/old',
                name: 'Old Link',
                scheduling_url: 'https://calendly.com/bee/old'
            }
        ] as any);

        await expect(
            getAdminSchedulingPageLinks({ idToken: 'admin-token' })
        ).resolves.toEqual([
            {
                uri: 'https://api.calendly.com/event_types/dropoff',
                name: 'Donation Dropoff',
                scheduling_url: 'https://calendly.com/bee/dropoff'
            }
        ]);
    });

    it('hides Calendly failures behind a generic error', async () => {
        mockVerifyIdToken.mockResolvedValue({ admin: true } as any);
        mockGetSchedulingPageLink.mockRejectedValue(
            new Error('Calendly API error 401: secret detail')
        );

        await expect(
            getAdminSchedulingPageLinks({ idToken: 'admin-token' })
        ).rejects.toThrow('Unable to load scheduling links.');
        await expect(
            getAdminSchedulingPageLinks({ idToken: 'admin-token' })
        ).rejects.not.toThrow('secret detail');
    });
});
