'use client';
//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import UserDetails from '@/components/UserDetails';
import { ListItem, ListItemText, List } from '@mui/material';
//Api

//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Notification } from '@/types/NotificationTypes';
import DonationCard from '@/components/DonationCard';
import DonationDetails from '@/components/DonationDetails';
import UserCard from '@/components/UserCard';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated: Dispatch<SetStateAction<boolean>>;
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);

    const notificationCount = notifications.donations.length + notifications.users.length;
    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const requestedDonations = notifications.donations.filter((donation) => donation.status === 'requested');
    const usersAwaitingApproval = notifications.users;

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {!donationIdToDisplay && !userIdToDisplay && (
                <>
                    <div className="page--header">
                        <h3>{`You have ${notificationCount} notifications`}</h3>
                    </div>
                    {donationsAwaitingApproval.length > 0 && (
                        <>
                            <h4>Donations requiring approval</h4>
                            {donationsAwaitingApproval.map((donation) => (
                                <DonationCard key={donation.id} donation={donation} setIdToDisplay={setDonationIdToDisplay} />
                            ))}
                        </>
                    )}
                    {requestedDonations.length > 0 && (
                        <>
                            <h4>Requested Equipment</h4>
                            {requestedDonations.map((donation) => (
                                <DonationCard key={donation.id} donation={donation} setIdToDisplay={setDonationIdToDisplay} />
                            ))}
                        </>
                    )}
                    {usersAwaitingApproval.length > 0 && (
                        <>
                            <h4>Users awaiting approval</h4>
                            <div className="content--container">
                                <List className={styles['browse__grid']}>
                                    {usersAwaitingApproval.map((user) => (
                                        <UserCard key={user.uid} authUser={user} setIdToDisplay={setUserIdToDisplay} />
                                    ))}
                                </List>
                            </div>
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
