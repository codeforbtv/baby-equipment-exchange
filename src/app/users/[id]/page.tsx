'use client';

//Hooks
import { useEffect, useState } from 'react';

//APIs
import { addErrorEvent, callEnableUser } from '@/api/firebase';
import { getUserDetails } from '@/api/firebase-users';

//Components
import Loader from '@/components/Loader';
import EditUser from '@/components/EditUser';
import { List, ListItem, Typography, Button, Divider } from '@mui/material';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from '@/components/CustomDialog';

//Types
import type { UserDetails } from '@/types/UserTypes';

//styles
import '@/styles/globalStyles.css';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        setIsDialogOpen(false);
        //Re-fetch user to show updated details
        if (userDetails) {
            fetchUserDetails(userDetails.uid);
        }
    };

    const handleEnableUser = async (uid: string): Promise<void> => {
        setIsLoading(true);
        try {
            const enabledUser = await callEnableUser(uid);
            if (userDetails) {
                const enabledUserDetails: UserDetails = {
                    ...userDetails,
                    disabled: enabledUser.disabled
                };
                setUserDetails(enabledUserDetails);
            }
            setIsLoading(false);
            setIsDialogOpen(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Call enable user', error);
        }
        setIsLoading(false);
    };

    async function fetchUserDetails(id: string): Promise<void> {
        try {
            const userDetailsResult: UserDetails = await getUserDetails(id);
            setUserDetails(userDetailsResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Fetch user details', error);
        }
    }

    useEffect(() => {
        fetchUserDetails(params.id);
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {isEditMode ? <h1>Edit User</h1> : <h1>User Details</h1>}
                {isLoading && <Loader />}
                {!isLoading && !userDetails && <p>User not found</p>}
                {!isLoading && userDetails && !isEditMode && (
                    <div className="content--container">
                        <h3>{userDetails.displayName}</h3>
                        <h4>{userDetails.email}</h4>
                        <p>{userDetails.phoneNumber}</p>
                        {userDetails.organization === null && (
                            <p style={{ color: 'red' }}>
                                You must{' '}
                                <Button variant="text" onClick={() => setIsEditMode(true)}>
                                    select an organzation
                                </Button>{' '}
                                before you can enable this user.
                            </p>
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
                        <Divider></Divider>
                        <Typography variant="overline">Organization:</Typography>
                        <Typography>{userDetails.organization?.name}</Typography>
                        <Typography variant="h4"></Typography>
                        <Typography variant="overline">Notes:</Typography>
                        <List>{userDetails.notes && userDetails.notes.map((note, i) => <ListItem key={i}>{note}</ListItem>)}</List>
                    </div>
                )}
                {!isLoading && userDetails && isEditMode && (
                    <EditUser userDetails={userDetails} setIsEditMode={setIsEditMode} fetchUserDetails={fetchUserDetails} />
                )}
                <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="User enabled" content={`User ${userDetails?.displayName} has been enabled.`} />
            </div>
        </ProtectedAdminRoute>
    );
}
