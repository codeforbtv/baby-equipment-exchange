'use client';

//Hooks
import { useEffect, useState } from 'react';

//APIs
import { addErrorEvent, callEnableUser } from '@/api/firebase';
import { getUserDetails } from '@/api/firebase-users';

//Components
import Loader from '@/components/Loader';

import {
    FormControl,
    FormLabel,
    List,
    ListItem,
    TextField,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Divider
} from '@mui/material';

//Types
import type { UserDetails } from '@/types/UserTypes';

//styles
import '../../HomeStyles.module.css';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [open, setIsOpen] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
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
            setIsOpen(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Call enable user', error);
        }
        setIsLoading(false);
    };

    async function fetchUserDetails(id: string): Promise<void> {
        try {
            const userDetails: UserDetails = await getUserDetails(id);
            setUserDetails(userDetails);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Fetch user details', error);
        }
    }

    useEffect(() => {
        fetchUserDetails(params.id);
    }, []);

    useEffect(() => {
        console.log(userDetails);
    }, [userDetails]);

    return (
        <div className="page--header">
            <h1>User Details</h1>
            {isLoading && <Loader />}
            {!isLoading && userDetails === null && <p>User not found</p>}
            {!isLoading && userDetails !== null && (
                <div className="content--container">
                    <h3>{userDetails.displayName}</h3>
                    <h4>{userDetails.email}</h4>
                    <p>{userDetails.phoneNumber}</p>
                    {userDetails.disabled && (
                        <Button variant="contained" type="button" onClick={() => handleEnableUser(userDetails.uid)}>
                            Enable User
                        </Button>
                    )}
                    <Divider></Divider>
                    <Typography variant="overline">Organization:</Typography>
                    <Typography variant="h4"></Typography>
                    <Typography variant="overline">Notes:</Typography>
                    <List>{userDetails.notes && userDetails.notes.map((note, i) => <ListItem key={i}>{note}</ListItem>)}</List>
                </div>
            )}
            <Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                <DialogTitle>User Updated</DialogTitle>
                <DialogContent>
                    <DialogContentText>{`User ${userDetails?.displayName} has been updated successfully.`}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
