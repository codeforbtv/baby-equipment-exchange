import { Dispatch, SetStateAction } from 'react';
import { Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { IUser } from '@/models/user';

interface Props {
    users: IUser[];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
}

const PendingUsersSection = ({ users, setIdToDisplay, setNotificationsUpdated }: Props) => {
    if (users.length === 0) return null;

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Users awaiting approval
            </Typography>
            {users.map((user) => (
                <NotificationCard
                    key={user.uid}
                    type="pending-user"
                    user={user}
                    setIdToDisplay={setIdToDisplay}
                    setNotificationsUpdated={setNotificationsUpdated}
                />
            ))}
        </div>
    );
};

export default PendingUsersSection;
