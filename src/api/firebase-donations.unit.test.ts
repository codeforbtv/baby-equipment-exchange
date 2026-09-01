/**
 * @jest-environment node
 */

jest.mock('firebase/firestore', () => ({
    Timestamp: class {},
    arrayRemove: jest.fn(),
    arrayUnion: jest.fn((value) => ({ arrayUnion: value })),
    collection: jest.fn((_db, name) => ({ kind: 'collection', name })),
    deleteDoc: jest.fn(),
    doc: jest.fn((...args) => {
        if (args.length === 1) return { id: 'order-id', kind: 'document', collection: args[0].name };
        return { id: args[2], kind: 'document', collection: args[1] };
    }),
    documentId: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    or: jest.fn(),
    query: jest.fn(),
    runTransaction: jest.fn(),
    serverTimestamp: jest.fn(() => ({ serverTimestamp: true })),
    updateDoc: jest.fn(),
    where: jest.fn(),
    writeBatch: jest.fn()
}));

jest.mock('firebase/storage', () => ({ deleteObject: jest.fn(), ref: jest.fn() }));
jest.mock('./firebase', () => ({ db: {}, storage: {}, addErrorEvent: jest.fn() }));
jest.mock('./firebase-images', () => ({ uploadImages: jest.fn() }));

import { getDoc, writeBatch } from 'firebase/firestore';
import { addErrorEvent } from './firebase';
import { requestInventoryItems } from './firebase-donations';

const mockGetDoc = getDoc as jest.Mock;
const mockWriteBatch = writeBatch as jest.Mock;
const mockAddErrorEvent = jest.mocked(addErrorEvent);
const mockCommit = jest.fn();
const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();

const user = { id: 'user-1', name: 'Aid Worker', email: 'aid@example.test' };

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe('requestInventoryItems', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ organization: { id: 'org-1', name: 'Demo Org' } }) });
        mockCommit.mockResolvedValue(undefined);
        mockWriteBatch.mockReturnValue({ set: mockBatchSet, update: mockBatchUpdate, commit: mockCommit });
        mockAddErrorEvent.mockResolvedValue(undefined);
    });

    test('rejects a user-read failure with the original error and queues no writes', async () => {
        const originalError = new Error('user read failed');
        mockGetDoc.mockRejectedValue(originalError);

        await expect(requestInventoryItems(['donation-1'], user)).rejects.toBe(originalError);

        expect(mockWriteBatch).not.toHaveBeenCalled();
        expect(mockAddErrorEvent).toHaveBeenCalledWith('Request inventory items', originalError);
    });

    test('rejects a commit failure with the original error', async () => {
        const originalError = new Error('commit failed');
        mockCommit.mockRejectedValue(originalError);

        await expect(requestInventoryItems(['donation-1'], user)).rejects.toBe(originalError);

        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockAddErrorEvent).toHaveBeenCalledWith('Request inventory items', originalError);
    });

    test('telemetry failure cannot replace the business error', async () => {
        const businessError = new Error('commit failed');
        mockCommit.mockRejectedValue(businessError);
        mockAddErrorEvent.mockRejectedValue(new Error('telemetry failed'));
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        await expect(requestInventoryItems(['donation-1'], user)).rejects.toBe(businessError);

        expect(consoleError).toHaveBeenCalledWith('Unable to record request inventory failure', expect.any(Error));
        consoleError.mockRestore();
    });

    test('does not resolve before batch.commit resolves', async () => {
        const commit = deferred<void>();
        const commitStarted = deferred<void>();
        mockCommit.mockImplementation(() => {
            commitStarted.resolve();
            return commit.promise;
        });

        let settled = false;
        const request = requestInventoryItems(['donation-1'], user).finally(() => {
            settled = true;
        });
        await commitStarted.promise;
        await Promise.resolve();
        expect(settled).toBe(false);

        commit.resolve();
        await request;
        expect(settled).toBe(true);
    });

    test.each([
        ['missing user', { exists: () => false, data: () => undefined }],
        ['missing organization', { exists: () => true, data: () => ({}) }]
    ])('commits with organization null for a %s', async (_label, userSnapshot) => {
        mockGetDoc.mockResolvedValue(userSnapshot);

        await requestInventoryItems(['donation-1'], user);

        expect(mockBatchSet).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'order-id' }),
            expect.objectContaining({ requestor: { ...user, organization: null } })
        );
        expect(mockCommit).toHaveBeenCalledTimes(1);
    });
});
