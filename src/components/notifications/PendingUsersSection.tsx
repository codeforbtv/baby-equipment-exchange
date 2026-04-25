import { Dispatch, SetStateAction } from 'react';
import { Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import { IUser } from '@/models/user';
import { NotificationCallbacks } from '@/types/NotificationTypes';

interface Props {
    users: IUser[];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    callbacks?: NotificationCallbacks;
}

const PendingUsersSection = ({ users, setIdToDisplay, callbacks }: Props) => {
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
                    callbacks={callbacks}
                />
            ))}
        </div>
    );
};

export default PendingUsersSection;
