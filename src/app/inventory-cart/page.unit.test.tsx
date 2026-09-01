/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../contexts/RequestedInventoryContext', () => ({
    useRequestedInventoryContext: jest.fn()
}));
jest.mock('../../contexts/UserContext', () => ({ useUserContext: jest.fn() }));
jest.mock('../../api/firebase-donations', () => ({ requestInventoryItems: jest.fn() }));
jest.mock('../../api/firebase', () => ({
    addErrorEvent: jest.fn(),
    callAreDonationsAvailable: jest.fn()
}));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => jest.requireActual<typeof import('react')>('react').createElement('img', props)
}));
jest.mock('../../components/Loader', () => ({
    __esModule: true,
    default: () => jest.requireActual<typeof import('react')>('react').createElement('div', null, 'Loading')
}));
jest.mock('../../components/InventoryDetailsDialog', () => ({
    __esModule: true,
    default: () => null
}));
jest.mock('../../components/CustomDialog', () => ({
    __esModule: true,
    default: ({ isOpen, onClose, title, content }: { isOpen: boolean; onClose: () => void; title: string; content: React.ReactNode }) => {
        if (!isOpen) return null;
        const ReactModule = jest.requireActual<typeof import('react')>('react');
        return ReactModule.createElement(
            'div',
            { role: 'dialog' },
            ReactModule.createElement('h2', null, title),
            ReactModule.createElement('div', null, content),
            ReactModule.createElement('button', { onClick: onClose }, 'Ok')
        );
    }
}));

import { useRequestedInventoryContext } from '../../contexts/RequestedInventoryContext';
import { useUserContext } from '../../contexts/UserContext';
import { requestInventoryItems } from '../../api/firebase-donations';
import { addErrorEvent, callAreDonationsAvailable } from '../../api/firebase';
import { useRouter } from 'next/navigation';
import InventoryCart from './page';
import type { InventoryItem } from '../../models/inventoryItem';

const mockUseRequestedInventoryContext = jest.mocked(useRequestedInventoryContext);
const mockUseUserContext = jest.mocked(useUserContext);
const mockRequestInventoryItems = jest.mocked(requestInventoryItems);
const mockCallAreDonationsAvailable = jest.mocked(callAreDonationsAvailable);
const mockAddErrorEvent = jest.mocked(addErrorEvent);
const mockUseRouter = jest.mocked(useRouter);
const mockRouterPush = jest.fn();

const requestedItem = {
    id: 'donation-1',
    brand: 'Demo',
    model: 'Seat',
    images: ['/demo.jpg']
};

const clearRequestedInventory = jest.fn();

function renderCart() {
    localStorage.setItem('requestedInventory', JSON.stringify([requestedItem.id]));
    mockUseRequestedInventoryContext.mockReturnValue({
        requestedInventory: [requestedItem as unknown as InventoryItem],
        addRequestedInventoryItem: jest.fn(),
        removeRequestedInventoryItem: jest.fn(),
        clearRequestedInventory,
        isLoading: false
    });
    mockUseUserContext.mockReturnValue({
        currentUser: { uid: 'user-1', displayName: 'Aid Worker', email: 'aid@example.test' }
    } as ReturnType<typeof useUserContext>);
    return render(<InventoryCart />);
}

describe('InventoryCart request submission', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockCallAreDonationsAvailable.mockResolvedValue([]);
        mockRequestInventoryItems.mockResolvedValue(undefined);
        mockAddErrorEvent.mockResolvedValue(undefined);
        mockUseRouter.mockReturnValue({ push: mockRouterPush } as unknown as ReturnType<typeof useRouter>);
    });

    test('unavailable preflight preserves the cart and does not create a request', async () => {
        mockCallAreDonationsAvailable.mockResolvedValue([requestedItem.id]);
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));

        expect(await screen.findByText('Item(s) no longer available.')).toBeInTheDocument();
        expect(mockRequestInventoryItems).not.toHaveBeenCalled();
        expect(clearRequestedInventory).not.toHaveBeenCalled();
        expect(localStorage.getItem('requestedInventory')).toBe(JSON.stringify([requestedItem.id]));
    });

    test.each(['user read failed', 'commit failed'])('%s preserves the cart and shows only failure', async (message) => {
        mockRequestInventoryItems.mockRejectedValue(new Error(message));
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));

        expect(await screen.findByText('We couldn’t submit your request.')).toBeInTheDocument();
        expect(screen.getByText('Your cart has been saved. Please try again. If the problem continues, contact the Exchange.')).toBeInTheDocument();
        expect(screen.queryByText('Your request has been submitted.')).not.toBeInTheDocument();
        expect(clearRequestedInventory).not.toHaveBeenCalled();
        expect(localStorage.getItem('requestedInventory')).toBe(JSON.stringify([requestedItem.id]));
        expect(mockAddErrorEvent).not.toHaveBeenCalled();
    });

    test('closing failure and retrying submits the same item IDs', async () => {
        mockRequestInventoryItems.mockRejectedValueOnce(new Error('commit failed')).mockResolvedValueOnce(undefined);
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));
        expect(await screen.findByText('We couldn’t submit your request.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));

        expect(await screen.findByText('Your request has been submitted.')).toBeInTheDocument();
        expect(mockRequestInventoryItems).toHaveBeenNthCalledWith(1, [requestedItem.id], expect.any(Object));
        expect(mockRequestInventoryItems).toHaveBeenNthCalledWith(2, [requestedItem.id], expect.any(Object));
    });

    test('clears the cart and shows success only after persistence resolves', async () => {
        let resolveRequest!: () => void;
        mockRequestInventoryItems.mockReturnValue(
            new Promise<void>((resolve) => {
                resolveRequest = resolve;
            })
        );
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));
        await waitFor(() => expect(mockRequestInventoryItems).toHaveBeenCalledTimes(1));
        expect(clearRequestedInventory).not.toHaveBeenCalled();
        expect(screen.queryByText('Your request has been submitted.')).not.toBeInTheDocument();

        resolveRequest();
        expect(await screen.findByText('Your request has been submitted.')).toBeInTheDocument();
        expect(clearRequestedInventory).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem('requestedInventory')).toBeNull();
    });

    test('post-commit storage cleanup failure still shows committed success', async () => {
        const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new Error('storage failed');
        });
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Request Items' }));

        expect(await screen.findByText('Your request has been submitted.')).toBeInTheDocument();
        expect(screen.queryByText('We couldn’t submit your request.')).not.toBeInTheDocument();
        expect(mockAddErrorEvent).toHaveBeenCalledWith('Clear requested inventory after commit', expect.any(Error));
        removeItem.mockRestore();
    });

    test('a rapid second click cannot issue a second request', async () => {
        let resolveRequest!: () => void;
        mockRequestInventoryItems.mockReturnValue(
            new Promise<void>((resolve) => {
                resolveRequest = resolve;
            })
        );
        renderCart();
        const requestButton = screen.getByRole('button', { name: 'Request Items' });

        fireEvent.click(requestButton);
        fireEvent.click(requestButton);

        await waitFor(() => expect(mockRequestInventoryItems).toHaveBeenCalledTimes(1));
        resolveRequest();
        expect(await screen.findByText('Your request has been submitted.')).toBeInTheDocument();
    });
});
