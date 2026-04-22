'use client';
//Hooks
import { Dispatch, SetStateAction } from 'react';
//Components
import CustomConfirm from './CustomConfirm';
//Api
import { callDisableUser } from '@/api/firebase';
import { disableDbUser } from '@/api/firebase-users';
import sendMail from '@/api/nodemailer';
import { addErrorEvent } from '@/api/firebase';
//Email Templates
import disableUser from '@/email-templates/disableUser';
//Types
import type { UserCollection } from '@/models/user';

type DisableUserProps = {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    title: string;
    user: UserCollection;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
};

const DisableUser = (props: DisableUserProps) => {
    const { isOpen, onClose, onCancel, title, user, setIsLoading } = props;

    const handleDisableUser = async (uid: string, userName: string, userEmail: string): Promise<void> => {
        setIsLoading(true);
        try {
            await Promise.all([callDisableUser(uid), disableDbUser(uid)]);
            const msg = disableUser(userEmail, userName);
            await sendMail(msg);
        } catch (error) {
            addErrorEvent('Call disable user', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CustomConfirm
            isOpen={isOpen}
            onClose={onClose}
            onCancel={onCancel}
            onConfirm={() => handleDisableUser(user.uid, user.displayName, user.email)}
            title={title || "Disable user?"}
            content={`This will disable the user "${user.displayName}." Are you sure?`}
            successTitle="User disabled"
            successDialog={`The user ${user.displayName} has been disabled.`}
        />
    );
};

export default DisableUser;
