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
//Types
import { Notification } from '@/types/NotificationTypes';
import DonationCard from '@/components/DonationCard';
import DonationDetails from '@/components/DonationDetails';

type NotificationsProps = {
    notifications: Notification;
    setNotificationsUpdated: Dispatch<SetStateAction<boolean>>;
};

const Notifications = (props: NotificationsProps) => {
    const { notifications, setNotificationsUpdated } = props;

    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [userIdToDisplay, setUserIdToDisplay] = useState<string | null>(null);

    const donationsAwaitingApproval = notifications.donations.filter((donation) => donation.status === 'in processing');
    const requestedDonations = notifications.donations.filter((donation) => donation.status === 'requested');
    const usersAwaitingApproval = notifications.users;

    console.log(donationsAwaitingApproval, requestedDonations, usersAwaitingApproval);
    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && <DonationDetails id={donationIdToDisplay} setIdToDisplay={setDonationIdToDisplay} />}
            {userIdToDisplay && <UserDetails id={userIdToDisplay} setIdToDisplay={setUserIdToDisplay} />}
            {!donationIdToDisplay && !userIdToDisplay && (
                <>
                    <div className="page--header">
                        <h3>Notifications</h3>
                    </div>
                    {donationsAwaitingApproval.length > 0 && (
                        <>
                            <h3>Submitted donations requiring approval</h3>
                            {donationsAwaitingApproval.map((donation) => (
                                <DonationCard key={donation.id} donation={donation} setIdToDisplay={setDonationIdToDisplay} />
                            ))}
                        </>
                    )}
                    {requestedDonations.length > 0 && (
                        <>
                            <h3>Requested donations</h3>
                            {requestedDonations.map((donation) => (
                                <DonationCard key={donation.id} donation={donation} setIdToDisplay={setDonationIdToDisplay} />
                            ))}
                        </>
                    )}
                    {/* {usersAwaitingApproval.length > 0 && (
                        <>
                            <h3>Users awaiting approval</h3>
                             <div className="content--container">
                                     <List className={styles['browse__grid']}>
                            {usersAwaitingApproval.map((user) => {
                    

                             </List>
                            </div>
                        </>
                    )} */}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Notifications;
