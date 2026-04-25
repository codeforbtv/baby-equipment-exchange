'use client';
/**
 * Notifications Page (standalone, outside Dashboard)
 *
 * Fetches each notification slice independently on mount.
 * Mutations update local state inside the Notifications component
 * via NotificationCallbacks — no re-fetch.
 */
// Hooks
import { useCallback, useEffect, useState } from 'react';
// Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import Notifications from '@/components/Notifications';
// Api
import { addErrorEvent } from '@/api/firebase';
import { getDonationNotifications, getOrdersNotifications } from '@/api/firebase-donations';
import { getUsersNotifications } from '@/api/firebase-users';
// Styles
import '@/styles/globalStyles.css';
// Types
import type { NotificationData } from '@/types/NotificationTypes';

const NotificationsPage = () => {
    // Start as true so no empty-state flash occurs before the first fetch completes.
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [notifications, setNotifications] = useState<NotificationData | null>(null);

    const fetchNotifications = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            const [donationResult, userResult, orderResult] = await Promise.allSettled([
                getDonationNotifications(),
                getUsersNotifications(),
                getOrdersNotifications()
            ]);

            if (donationResult.status === 'rejected') {
                addErrorEvent('NotificationsPage – donations', donationResult.reason);
            }
            if (userResult.status === 'rejected') {
                addErrorEvent('NotificationsPage – users', userResult.reason);
            }
            if (orderResult.status === 'rejected') {
                addErrorEvent('NotificationsPage – orders', orderResult.reason);
            }

            setNotifications({
                donations: donationResult.status === 'fulfilled' ? donationResult.value : [],
                users: userResult.status === 'fulfilled' ? userResult.value : [],
                orders: orderResult.status === 'fulfilled' ? orderResult.value : []
            });
        } catch (error) {
            addErrorEvent('NotificationsPage/fetch', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch once on mount. Subsequent updates use optimistic local removal
    // inside the Notifications component — no further fetches triggered by mutations.
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <ProtectedAdminRoute>
            <>
                {isLoading && <Loader />}
                {!isLoading && notifications && <Notifications notifications={notifications} />}
                {!isLoading && !notifications && <p>No new notifications at this time.</p>}
            </>
        </ProtectedAdminRoute>
    );
};

export default NotificationsPage;
