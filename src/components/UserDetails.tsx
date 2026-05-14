'use client';

//Hooks
import { useEffect, useState, Dispatch, SetStateAction } from 'react';
//Components
import Loader from '@/components/Loader';
import EditUser from '@/components/EditUser';
import { ListItem, Typography, Button, IconButton, Box } from '@mui/material';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import CustomDialog from '@/components/CustomDialog';
//APIs
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { enableUser, getUserDetails } from '@/app/actions/firebase';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
//styles
import '@/styles/globalStyles.css';
//Types
import { IUser } from '@/models/user';

type UserDetailsProps = {
    id: string;
    user?: IUser;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setUsersUpdated?: Dispatch<SetStateAction<boolean>>;
    onUsersChanged?: () => void;
};

export default function UserDetails(props: UserDetailsProps) {
    const { id, setIdToDisplay, setUsersUpdated, onUsersChanged, user } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<IUser | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogTitle, setDialogTitle] = useState<string>('User updated');
    const [dialogContent, setDialogContent] = useState<string>('');
    const [userDetailsUpdated, setUserDetailsUpdated] = useState<boolean>(false);

    const handleClose = () => {
        if (onUsersChanged) onUsersChanged();
        if (setUsersUpdated) setUsersUpdated(true);
        //Re-fetch user to show updated details
        if (userDetails) {
            fetchUserDetails(userDetails.uid);
        }
        setIsDialogOpen(false);
    };

    async function fetchUserDetails(id: string): Promise<void> {
        setIsLoading(true);
        try {
            const userDetailsResult = await getUserDetails({ idToken: await getAuthIdToken(), userId: id });
            setUserDetails(userDetailsResult);
        } catch (error) {
            addErrorEvent('Fetch user details', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleEnableUser = async (): Promise<void> => {
        if (!userDetails) return;

        setIsLoading(true);
        try {
            await enableUser({ idToken: await getAuthIdToken(), userId: userDetails.uid });
            setDialogTitle('User enabled');
            setDialogContent(`User ${userDetails.displayName} has been enabled.`);
            setUserDetailsUpdated(true);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Enable user from user details', error);
            setDialogTitle('Unable to enable user');
            setDialogContent(`User ${userDetails.displayName} could not be enabled. Please try again.`);
            setIsDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    //Re-fetch user if user has been updated.
    useEffect(() => {
        if (!user || userDetailsUpdated) {
            fetchUserDetails(id);
        } else {
            setUserDetails(user);
        }
    }, [id, user, userDetailsUpdated]);

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
                        <Typography variant="h5">{userDetails.displayName}</Typography>
                        <Typography variant="h6">{userDetails.email}</Typography>
                        <Typography variant="body1">{userDetails.phoneNumber}</Typography>
                        {userDetails.organization === null ? (
                            <p style={{ color: 'red' }}>This user is missing an organization. Click edit user to assign one.</p>
                        ) : (
                            <Typography variant="body1" sx={{ marginTop: '1em' }}>
                                <b>Organization: </b> {userDetails.organization.name}
                            </Typography>
                        )}
                        {userDetails.title && (
                            <Typography variant="body1">
                                <b>Title: </b>
                                {userDetails.title}
                            </Typography>
                        )}
                        {userDetails.distributedItems && (
                            <>
                                <Typography variant="body1" sx={{ marginTop: '1em' }}>
                                    <b>Distributed Items:</b>
                                </Typography>
                                <ul>
                                    {userDetails.distributedItems.map((item) => (
                                        <li key={item.tagNumber}>{item.tagNumber}</li>
                                    ))}
                                </ul>
                            </>
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
                        <Box display="flex" gap={2} flexWrap="wrap" sx={{ marginTop: '2em' }}>
                            <Button variant="contained" type="button" onClick={() => setIsEditMode(true)} startIcon={<EditIcon />}>
                                Edit User
                            </Button>
                            {userDetails.isDisabled && (
                                <Button variant="outlined" type="button" onClick={handleEnableUser}>
                                    Enable User
                                </Button>
                            )}
                        </Box>
                    </div>
                )}
                {!isLoading && userDetails && isEditMode && (
                    <EditUser userDetails={userDetails} setIsEditMode={setIsEditMode} setUserDetailsUpdated={setUserDetailsUpdated} />
                )}
                <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title={dialogTitle} content={dialogContent} />
            </div>
        </ProtectedAdminRoute>
    );
}
