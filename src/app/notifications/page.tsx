'use client';
//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import Notifications from '@/components/Notifications';
//Api
import { addErrorEvent, getNotifications } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Notification } from '@/types/NotificationTypes';

const NotificationsPage = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<Notification | null>(null);

    async function fetchNotifications(): Promise<void> {
        setIsLoading(true);
        try {
            const notificationsResult = await getNotifications();
            setNotifications(notificationsResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Fetch notifications', error);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <ProtectedAdminRoute>
            <>
                {isLoading && <Loader />}
                {!isLoading && !notifications && <p>No new notifications</p>}
                {!isLoading && notifications && <Notifications notifications={notifications} />}
            </>
        </ProtectedAdminRoute>
    );
};

export default NotificationsPage;
