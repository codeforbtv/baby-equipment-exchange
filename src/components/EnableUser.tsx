'use client';
//Hooks
import { Dispatch, SetStateAction } from 'react';
//Components
import CustomConfirm from './CustomConfirm';
//Api
import { callEnableUser } from '@/api/firebase';
import { enableDbUser } from '@/api/firebase-users';
import sendMail from '@/api/nodemailer';
import { addErrorEvent } from '@/api/firebase';
//Email Templates
import enableUser from '@/email-templates/enableUser';
//Types
import type { UserCollection } from '@/models/user';

type EnableUserProps = {
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    user: UserCollection;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
};

const EnableUser = (props: EnableUserProps) => {
    const { isOpen, onClose, onCancel, user, setIsLoading } = props;

    const handleEnableUser = async (uid: string, userName: string, userEmail: string) => {
        setIsLoading(true);
        try {
            await Promise.all([callEnableUser(uid), enableDbUser(uid)]);
            const msg = enableUser(userEmail, userName);
            await sendMail(msg);
        } catch (error) {
            addErrorEvent('Call enable user', error);
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
            onConfirm={() => handleEnableUser(user.uid, user.displayName, user.email)}
            title="Enable user?"
            content="This will enable the user. Are you sure?"
            successTitle="User enabled"
            successDialog={`The user ${user.displayName} has been enabled.`}
        />
    );
};

export default EnableUser;
