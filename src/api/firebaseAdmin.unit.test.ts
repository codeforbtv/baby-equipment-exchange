/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));
jest.mock('firebase-functions/v2', () => ({ setGlobalOptions: jest.fn() }));
jest.mock('firebase-functions/v2/https', () => ({
    HttpsError: class HttpsError extends Error {
        constructor(
            public code: string,
            message: string
        ) {
            super(message);
        }
    }
}));
jest.mock('firebase-functions/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
}));
jest.mock('firebase-admin', () => ({
    apps: [],
    app: jest.fn(),
    credential: { cert: jest.fn(() => ({ credential: true })) }
}));
jest.mock('firebase-admin/app', () => ({ initializeApp: jest.fn(() => ({ name: 'test-admin-app' })) }));
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn(() => ({})) }));
jest.mock('firebase-admin/storage', () => ({ getStorage: jest.fn(() => ({})) }));
jest.mock('firebase-admin/firestore', () => {
    const eventAdd = jest.fn();
    return {
        FieldValue: {},
        getFirestore: jest.fn(() => ({
            collection: jest.fn(() => ({ add: eventAdd }))
        })),
        mockEventAdd: eventAdd
    };
});

import * as logger from 'firebase-functions/logger';
import { addEvent } from './firebaseAdmin';

const mockLoggerError = jest.mocked(logger.error);
const mockEventAdd = jest.requireMock('firebase-admin/firestore').mockEventAdd as jest.Mock;

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe('firebaseAdmin Event persistence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('addEvent remains pending until the Event write settles', async () => {
        const write = deferred<void>();
        mockEventAdd.mockReturnValue(write.promise);
        let settled = false;

        const event = addEvent({ location: 'request test' }).finally(() => {
            settled = true;
        });
        await Promise.resolve();
        expect(settled).toBe(false);

        write.resolve();
        await event;
        expect(settled).toBe(true);
        expect(mockEventAdd).toHaveBeenCalledTimes(1);
    });

    test('Event write failure logs once and does not recurse', async () => {
        const writeError = new Error('Event unavailable');
        mockEventAdd.mockRejectedValue(writeError);

        await addEvent({ location: 'request test' });

        expect(mockEventAdd).toHaveBeenCalledTimes(1);
        expect(mockLoggerError).toHaveBeenCalledTimes(1);
        expect(mockLoggerError).toHaveBeenCalledWith(
            expect.objectContaining({ location: '_addEvent', collection: 'Event', error: expect.stringContaining('Event unavailable') })
        );
    });
});
