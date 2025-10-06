'use client';

//Hooks
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
//Components
import Loader from '@/components/Loader';
import EditUser from '@/components/EditUser';
import { List, ListItem, Typography, Button, Divider, IconButton } from '@mui/material';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from '@/components/CustomDialog';
//APIs
import { addErrorEvent, callEnableUser } from '@/api/firebase';
import { getDbUser, getUserDetails } from '@/api/firebase-users';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//styles
import '@/styles/globalStyles.css';
import { IUser } from '@/models/user';
//Types

type UserDetailsProps = {
    id: string;
    user?: IUser;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setUsersUpdated?: Dispatch<SetStateAction<boolean>>;
};

export default function UserDetails(props: UserDetailsProps) {
    const { id, setIdToDisplay, setUsersUpdated, user } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<IUser | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        if (setUsersUpdated) setUsersUpdated(true);
        //Re-fetch user to show updated details
        if (userDetails) {
            fetchUserDetails(userDetails.uid);
        }
        setIsDialogOpen(false);
    };

    const handleEnableUser = async (uid: string): Promise<void> => {
        setIsLoading(true);
        try {
            await callEnableUser(uid);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Call enable user', error);
        } finally {
            setIsLoading(false);
        }
    };

    async function fetchUserDetails(id: string): Promise<void> {
        setIsLoading(true);
        try {
            const userDetailsResult: IUser = await getDbUser(id);
            setUserDetails(userDetailsResult);
        } catch (error) {
            addErrorEvent('Fetch user details', error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            setUserDetails(user);
        } else {
            fetchUserDetails(id);
        }
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {isEditMode ? <h3>Edit User</h3> : <h3>User Details</h3>}
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                {isLoading && <Loader />}
                {!isLoading && !userDetails && <p>User not found</p>}
                {!isLoading && userDetails && !isEditMode && (
                    <div className="content--container">
                        <h3>{userDetails.displayName}</h3>
                        <h4>{userDetails.email}</h4>
                        <h4>{userDetails.phoneNumber}</h4>
                        {userDetails.organization === null ? (
                            <p style={{ color: 'red' }}>
                                You must{' '}
                                <Button variant="text" onClick={() => setIsEditMode(true)}>
                                    select an organzation
                                </Button>{' '}
                                before you can enable this user.
                            </p>
                        ) : (
                            <p>
                                <b>Organization:</b> {userDetails.organization.name}
                            </p>
                        )}
                        {userDetails.notes && userDetails.notes.length > 0 && (
                            <>
                                <p>
                                    <b>Notes:</b>
                                </p>
                                <ul>
                                    {userDetails.notes.map((note, i) => (
                                        <ListItem key={i}>{note}</ListItem>
                                    ))}
                                </ul>
                            </>
                        )}
                        {userDetails.disabled && (
                            <Button
                                variant="contained"
                                type="button"
                                onClick={() => handleEnableUser(userDetails.uid)}
                                disabled={userDetails.organization === null}
                            >
                                Enable User
                            </Button>
                        )}
                        <Button variant="contained" type="button" onClick={() => setIsEditMode(true)}>
                            Edit User
                        </Button>
                    </div>
                )}
                {!isLoading && userDetails && isEditMode && (
                    <EditUser userDetails={userDetails} setIsEditMode={setIsEditMode} fetchUserDetails={fetchUserDetails} setUsersUpdated={setUsersUpdated} />
                )}
                <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="User enabled" content={`User ${userDetails?.displayName} has been enabled.`} />
            </div>
        </ProtectedAdminRoute>
    );
}
