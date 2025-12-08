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
import { getDbUser } from '@/api/firebase-users';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
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
                        {userDetails.title && <Typography variant="body1">{userDetails.title}</Typography>}
                        {userDetails.distributedItems && (
                            <>
                                <Typography variant="body1">
                                    <b>Distributed Items:</b>
                                </Typography>
                                <ul>
                                    {userDetails.distributedItems.map((item) => (
                                        <li>{item.tagNumber}</li>
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
                        <Button variant="contained" type="button" onClick={() => setIsEditMode(true)} sx={{ marginTop: '2em' }}>
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
