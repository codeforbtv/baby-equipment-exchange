'use client';

import { Dispatch, SetStateAction, useCallback, useMemo, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { fetchNotificationFeedData, getDashboardNotifications, getOrganizationNames } from '@/app/actions/firebase';
import { getAllDonations, getAllInventory } from '@/api/firebase-donations';
import { getAllDbUsers } from '@/api/firebase-users';
import { getAllCategories } from '@/api/firebase-categories';
import { useUserContext } from '@/contexts/UserContext';
import Notifications from '@/components/Notifications';
import Donations from '@/components/Donations';
import Inventory from '@/components/Inventory';
import Users from '@/components/Users';
import Organizations from '@/components/Organizations';
import Categories from '@/components/Categories';
import NotificationFeed from '@/components/NotificationFeed';
import Loader from '@/components/Loader';
import { CalendlyTimeRange } from '@/types/CalendlyTypes';
import { NotificationData, NotificationItem } from '@/types/NotificationTypes';

const calendlyTimeRange: CalendlyTimeRange = '30days';
const swrOptions = { revalidateOnFocus: false };

export const dashboardDataKeys = {
    notifications: 'dashboard:notifications',
    notificationFeed: `dashboard:notification-feed:${calendlyTimeRange}`,
    donations: 'dashboard:donations',
    inventory: 'dashboard:inventory',
    users: 'dashboard:users',
    organizations: 'dashboard:organizations',
    categories: 'dashboard:categories'
} as const;

const notificationRefreshKeys = [dashboardDataKeys.notifications, dashboardDataKeys.notificationFeed] as const;
const donationRefreshKeys = [dashboardDataKeys.donations, dashboardDataKeys.inventory, ...notificationRefreshKeys] as const;
const inventoryRefreshKeys = [dashboardDataKeys.inventory, dashboardDataKeys.donations, ...notificationRefreshKeys] as const;
const userRefreshKeys = [dashboardDataKeys.users, ...notificationRefreshKeys] as const;

async function fetchWithLogging<T>(location: string, fetcher: () => Promise<T>): Promise<T> {
    try {
        return await fetcher();
    } catch (error) {
        addErrorEvent(location, error);
        throw error;
    }
}

function useCanFetchNotifications(): boolean {
    const { currentUser, isAdmin, isLoading } = useUserContext();
    return Boolean(currentUser && isAdmin && !isLoading);
}

async function fetchDashboardNotifications() {
    const idToken = await getAuthIdToken();
    return getDashboardNotifications({ idToken });
}

function useSWRRefreshHandler(keys: string | readonly string[]): () => void {
    const { mutate } = useSWRConfig();
    const keysToRefresh = useMemo(() => (Array.isArray(keys) ? keys : [keys]), [keys]);

    return useMemo(
        () => () => {
            void Promise.all(keysToRefresh.map((key) => mutate(key))).catch((error) => addErrorEvent('Dashboard SWR refresh', error));
        },
        [keysToRefresh, mutate]
    );
}

function useNotificationRefreshHandler(): () => void {
    const { mutate } = useSWRConfig();
    const pendingScrollTop = useRef<number | null>(null);

    const refreshNotifications = useCallback(() => {
        if (typeof window !== 'undefined') {
            pendingScrollTop.current = window.scrollY;
        }

        void Promise.all(notificationRefreshKeys.map((key) => mutate(key)))
            .catch((error) => addErrorEvent('Dashboard notification refresh', error))
            .finally(() => {
                if (pendingScrollTop.current === null) return;

                const scrollTop = pendingScrollTop.current;
                pendingScrollTop.current = null;
                window.requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
            });
    }, [mutate]);

    return refreshNotifications;
}

export async function refreshDashboardTab(mutate: (key: string) => Promise<unknown>, tabIndex: number): Promise<void> {
    const keysByTab = [
        notificationRefreshKeys,
        [dashboardDataKeys.donations],
        [dashboardDataKeys.inventory],
        [dashboardDataKeys.users],
        [dashboardDataKeys.organizations],
        [dashboardDataKeys.categories]
    ] as const;

    await Promise.all(keysByTab[tabIndex]?.map((key) => mutate(key)) ?? []);
}

export function DashboardNotificationFeed({ onNavigate }: { onNavigate: (tabIndex: number, entityId: string) => void }) {
    const canFetch = useCanFetchNotifications();

    const { data: notifications } = useSWR(
        canFetch ? dashboardDataKeys.notifications : null,
        () => fetchWithLogging('Dashboard notification feed notifications', fetchDashboardNotifications),
        swrOptions
    );
    const { data: feedData } = useSWR(
        canFetch ? dashboardDataKeys.notificationFeed : null,
        () => fetchWithLogging('Dashboard notification feed data', () => fetchNotificationFeedData(calendlyTimeRange)),
        swrOptions
    );

    const notificationItems = useMemo<NotificationItem[]>(
        () => feedData?.items.map((item) => ({ ...item, timestamp: new Date(item.timestamp) })) ?? [],
        [feedData]
    );

    const notificationData = useMemo<NotificationData | null>(() => {
        if (!notifications || !feedData) return null;

        return {
            ...notifications,
            pickupBookingStatus: feedData.pickupBookingStatus,
            dropOffBookingStatus: feedData.dropOffBookingStatus,
            calendlyTimeRange
        };
    }, [feedData, notifications]);

    return <NotificationFeed items={notificationItems} onNavigate={onNavigate} notificationData={notificationData} />;
}

export function DashboardNotificationsTab(props: {
    activeSubTab: number;
    onSubTabChange: Dispatch<SetStateAction<number>>;
    highlightedEntityId: string | null;
}) {
    const { activeSubTab, onSubTabChange, highlightedEntityId } = props;
    const canFetch = useCanFetchNotifications();

    const { data: notifications, isLoading: isLoadingNotifications } = useSWR(
        canFetch ? dashboardDataKeys.notifications : null,
        () => fetchWithLogging('Dashboard notifications', fetchDashboardNotifications),
        swrOptions
    );
    const { data: feedData, isLoading: isLoadingFeedData } = useSWR(
        canFetch ? dashboardDataKeys.notificationFeed : null,
        () => fetchWithLogging('Dashboard notification details', () => fetchNotificationFeedData(calendlyTimeRange)),
        swrOptions
    );
    const onNotificationsChanged = useNotificationRefreshHandler();

    const notificationData = useMemo<NotificationData | null>(() => {
        if (!notifications || !feedData) return null;

        return {
            ...notifications,
            pickupBookingStatus: feedData.pickupBookingStatus,
            dropOffBookingStatus: feedData.dropOffBookingStatus,
            calendlyTimeRange
        };
    }, [feedData, notifications]);

    if (isLoadingNotifications || isLoadingFeedData) return <Loader />;
    if (!notifications) return <p>No notifications at this time.</p>;

    return (
        <Notifications
            notifications={notifications}
            onNotificationsChanged={onNotificationsChanged}
            activeSubTab={activeSubTab}
            onSubTabChange={onSubTabChange}
            notificationData={notificationData}
            highlightedEntityId={highlightedEntityId}
        />
    );
}

export function DashboardDonationsTab() {
    const { data: donations, isLoading } = useSWR(dashboardDataKeys.donations, () => fetchWithLogging('Dashboard donations', getAllDonations), swrOptions);
    const onDonationsChanged = useSWRRefreshHandler(donationRefreshKeys);

    if (isLoading) return <Loader />;
    if (!donations) return <p>No donations found.</p>;

    return <Donations donations={donations} onDonationsChanged={onDonationsChanged} />;
}

export function DashboardInventoryTab() {
    const { data: inventory, isLoading } = useSWR(dashboardDataKeys.inventory, () => fetchWithLogging('Dashboard inventory', getAllInventory), swrOptions);
    const onInventoryChanged = useSWRRefreshHandler(inventoryRefreshKeys);

    if (isLoading) return <Loader />;
    if (!inventory) return <p>No inventory found.</p>;

    return <Inventory inventory={inventory} onInventoryChanged={onInventoryChanged} />;
}

export function DashboardUsersTab() {
    const { data: users, isLoading } = useSWR(
        dashboardDataKeys.users,
        () => fetchWithLogging('Dashboard users', async () => (await getAllDbUsers()).filter((user) => !user.isDeleted)),
        swrOptions
    );
    const onUsersChanged = useSWRRefreshHandler(userRefreshKeys);

    if (isLoading) return <Loader />;
    if (!users) return <p>No users found.</p>;

    return <Users users={users} onUsersChanged={onUsersChanged} />;
}

export function DashboardOrganizationsTab() {
    const { data: orgNamesAndIds, isLoading } = useSWR(
        dashboardDataKeys.organizations,
        () => fetchWithLogging('Dashboard organizations', getOrganizationNames),
        swrOptions
    );
    const onOrganizationsChanged = useSWRRefreshHandler(dashboardDataKeys.organizations);

    if (isLoading) return <Loader />;
    if (!orgNamesAndIds) return <p>No organizations found.</p>;

    return <Organizations orgNamesAndIds={orgNamesAndIds} onOrganizationsChanged={onOrganizationsChanged} />;
}

export function DashboardCategoriesTab() {
    const { data: categories, isLoading } = useSWR(dashboardDataKeys.categories, () => fetchWithLogging('Dashboard categories', getAllCategories), swrOptions);
    const onCategoriesChanged = useSWRRefreshHandler(dashboardDataKeys.categories);

    if (isLoading) return <Loader />;
    if (!categories) return <p>No categories found.</p>;

    return <Categories categories={categories} onCategoriesChanged={onCategoriesChanged} />;
}
