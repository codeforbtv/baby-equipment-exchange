'use client';
//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import DonationDetails from '@/components/DonationDetails';
import ReviewOrder from './ReviewOrder';
import NotificationCard from '@/components/NotificationCard';
//Api

//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);
    const [orderIdToDisplay, setOrderIdToDisplay] = useState<string | null>(null);

    const notificationCount = notifications.donations.length + notifications.users.length;
    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const donationsAwaitingDropoff = notifications.donations.filter((donation) => donation.status === 'pending delivery');
    const donationsAwaitingPickup = notifications.donations.filter((donation) => donation.status === 'reserved');
    const orders = notifications.orders;
    const usersAwaitingApproval = notifications.users;

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {orderIdToDisplay && (
                <ReviewOrder
                    id={orderIdToDisplay}
                    order={orders.find((o) => o.id === orderIdToDisplay)}
                    setIdToDisplay={setOrderIdToDisplay}
                    setNotificationsUpdated={setNotificationsUpdated}
                />
            )}
            {!donationIdToDisplay && !userIdToDisplay && !orderIdToDisplay && (
                <>
                    <div className="page--header">
                        <h3>{`You have ${notificationCount} notifications`}</h3>
                    </div>
                    {donationsAwaitingApproval.length > 0 && (
                        <>
                            <h4>Donations requiring approval</h4>
                            {donationsAwaitingApproval.map((donation) => (
                                <NotificationCard
                                    key={donation.id}
                                    donation={donation}
                                    type="pending-donation"
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                    {donationsAwaitingDropoff.length > 0 && (
                        <>
                            <h4>Donations waiting to be recieved</h4>
                            {donationsAwaitingDropoff.map((donation) => (
                                <NotificationCard
                                    key={donation.id}
                                    donation={donation}
                                    type="pending-delivery"
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                    {donationsAwaitingPickup.length > 0 && (
                        <>
                            <h4>Donations waiting for pickup</h4>
                            {donationsAwaitingPickup.map((donation) => (
                                <NotificationCard
                                    key={donation.id}
                                    donation={donation}
                                    type="reserved"
                                    setIdToDisplay={setDonationIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                    {orders.length > 0 && (
                        <>
                            <h4>Requested Equipment</h4>
                            {orders.map((order) => (
                                <NotificationCard
                                    key={order.id}
                                    type="order"
                                    order={order}
                                    setIdToDisplay={setOrderIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                    {usersAwaitingApproval.length > 0 && (
                        <>
                            <h4>Users awaiting approval</h4>
                            {usersAwaitingApproval.map((user) => (
                                <NotificationCard
                                    key={user.uid}
                                    type="pending-user"
                                    user={user}
                                    setIdToDisplay={setUserIdToDisplay}
                                    setNotificationsUpdated={setNotificationsUpdated}
                                />
                            ))}
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
