//API
import { addErrorEvent, callSetClaims, callUpdateAuthUser } from '@/api/firebase';
import { getDbUser } from '@/api/firebase-users';
//Components
import {
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField
} from '@mui/material';
import Loader from './Loader';
//Hooks
import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
//Icons
import InfoIcon from '@mui/icons-material/Info';

//Styles
import styles from './Card.module.css';

import { AuthUserRecord } from '@/types/UserTypes';
import { IUser } from '@/models/user';
import { useRouter } from 'next/navigation';

type UserCardProps = {
    authUser: AuthUserRecord;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

export default function UserCard(props: UserCardProps) {
    const { uid, email, displayName, customClaims, disabled } = props.authUser;
    const setIdToDisplay = props.setIdToDisplay;

    const [isDialogLoading, setIsDialogLoading] = useState<boolean>(false);
    const [editView, showEditView] = useState<boolean>(false);
    const [displayNameField, setDisplayNameField] = useState<string | undefined>(displayName);
    const [emailField, setEmailField] = useState<string | undefined>(email);
    const [dbUser, setDbUser] = useState<IUser | null>();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAidWorker, setIsAidWorker] = useState<boolean>(false);

    const router = useRouter();

    const fetchDbUser = async (uid: string): Promise<IUser> => {
        try {
            const dbUser = await getDbUser(uid);
            setDbUser(dbUser);
        } catch (error) {
            addErrorEvent('Error fetching db user', error);
        }
        return Promise.reject();
    };

    useEffect(() => {
        if (editView) {
            setIsDialogLoading(true);
            fetchDbUser(uid);
            setIsDialogLoading(false);
        }
    }, [editView]);

    async function handleFormSubmit() {
        const claims = {
            admin: isAdmin,
            'aid-worker': isAidWorker
        };
        const accountInformation = {
            displayName: displayNameField,
            email: emailField
            // phoneNumber: `+1${phoneNumberField}`
        };
        await callUpdateAuthUser(uid, accountInformation);
        await callSetClaims(uid, claims);
        handleHideEditView();
    }

    const handleIconButtonClick = () => {
        router.push(`/users/${uid}`);
    };

    const handleHideEditView = () => {
        showEditView(false);
    };

    const handleDisplayNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            setDisplayNameField(event.target.value);
        }
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            setEmailField(event.target.value);
        }
    };

    // const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setPhoneNumberField(event.target.value);
    //     }
    // };

    const handleToggleIsAdmin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAdmin(event.target.checked);
    };

    const handleToggleIsAidWorker = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAidWorker(event.target.checked);
    };

    // const handleToggleIsVerified = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         callSetClaimForVerified(uid, event.target.checked);
    //     }
    // };

    return (
        <ListItem key={uid!}>
            <ListItemButton component="a" onClick={() => setIdToDisplay(uid)}>
                <ListItemText primary={displayName} secondary={email} sx={{ color: 'black' }} />
                {disabled && <ListItemText primary={'This user requires approval'} sx={{ color: 'red' }}></ListItemText>}
            </ListItemButton>
            <Dialog open={editView} onClose={handleHideEditView}>
                <DialogContent>
                    <h3>Edit {displayName ? `${displayName}` : 'user'}</h3>
                    {isDialogLoading ? (
                        <Loader />
                    ) : (
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Roles</FormLabel>
                            <FormGroup id="roles" aria-label="Roles" row>
                                <FormControlLabel label="Administrator" control={<Checkbox checked={isAdmin} onChange={handleToggleIsAdmin} />} />
                                <FormControlLabel label="Aid Worker" control={<Checkbox checked={isAidWorker} onChange={handleToggleIsAidWorker} />} />
                            </FormGroup>

                            <FormLabel component="legend">Contact Details</FormLabel>
                            <TextField
                                type="email"
                                label="Email"
                                placeholder="Input email"
                                name="contactEmail"
                                id="contactEmail"
                                onChange={handleEmailChange}
                                value={email}
                                variant="standard"
                            />
                            <TextField
                                type="text"
                                label="Display Name"
                                placeholder="Input display name"
                                name="displayName"
                                id="displayName"
                                onChange={handleDisplayNameChange}
                                value={displayName}
                                variant="standard"
                            />
                            <TextField
                                type="tel"
                                label="Phone Number"
                                placeholder="input phone number"
                                name="contactPhone"
                                id="contactPhone"
                                // onChange={handlePhoneNumberChange}
                                // value={phoneNumber}
                                variant="standard"
                            />
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFormSubmit}>update</Button>
                    <Button onClick={handleHideEditView}>close</Button>
                </DialogActions>
            </Dialog>
        </ListItem>
    );
}
