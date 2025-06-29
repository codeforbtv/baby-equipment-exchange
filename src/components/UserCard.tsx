//API
import {
    callCheckClaims,
    callSetClaimForAdmin,
    callSetClaimForAidWorker,
    callSetClaimForDonationReadAccess,
    callSetClaimForDonor,
    callSetClaimForVerified,
    callSetClaimForVolunteer,
    callSetClaims,
    callSetUserAccount,
    callUpdateUser
} from '@/api/firebase';
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
    ListItemText,
    ImageListItemBar,
    TextField,
    ListItemButton
} from '@mui/material';
import Loader from './Loader';
//Hooks
import React, { useEffect, useState } from 'react';
//Icons
import InfoIcon from '@mui/icons-material/Info';
//Interfaces
import { IContact } from '@/models/contact';
import { IAddress } from '@/models/address';
//Styles
import styles from './Card.module.css';
import { UserRecord } from 'firebase-admin/auth';

import { UserCardProps } from '@/types/post-data';

// type UserCardProps = {
//     name: string | undefined;
//     contact: IContact | null | undefined;
//     location: IAddress | null | undefined;
//     photo: string | null | undefined;
// };

export default function UserCard(props: UserCardProps) {
    const { uid, email, displayName, photoURL, phoneNumber, customClaims } = props;

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [editView, showEditView] = useState<boolean>(false);
    // const user = contact?.user;
    // const userId = contact?.user?.id;
    const [displayNameField, setDisplayNameField] = useState<string | undefined>(displayName);
    const [emailField, setEmailField] = useState<string | undefined>(email);
    const [phoneNumberField, setPhoneNumberField] = useState<string | undefined>(phoneNumber);
    // const [website, setWebsite] = useState<string>(contact?.website ?? '');
    // const [addressLine1, setAddressLine1] = useState<string>(location?.line_1 ?? '');
    // const [city, setCity] = useState<string>(location?.city ?? '');
    // const [state, setState] = useState<string>(location?.state ?? '');
    // const [zipcode, setZipcode] = useState<string>(location?.zipcode ?? '');
    const [canReadDonations, setCanReadDonations] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isAidWorker, setIsAidWorker] = useState<boolean>(false);
    const [isDonor, setIsDonor] = useState<boolean>(false);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isVolunteer, setIsVolunteer] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                if (uid != null) {
                    setIsLoading(false);
                }
                if (customClaims !== undefined) {
                    setCanReadDonations(customClaims['can-read-donations']);
                    setIsAdmin(customClaims['admin']);
                    setIsAidWorker(customClaims['aid-worker']);
                    setIsDonor(customClaims['donor']);
                    setIsVerified(customClaims['verified']);
                    setIsVolunteer(customClaims['volunteer']);
                }
            } catch (error) {
                console.log('error fetching custom claims', error);
            }
        })();
    }, []);

    async function handleFormSubmit() {
        const claims = {
            admin: isAdmin,
            'can-read-donations': canReadDonations,
            'aid-worker': isAidWorker,
            donor: isDonor,
            volunteer: isVolunteer
        };
        const accountInformation = {
            displayName: displayNameField,
            email: emailField,
            phoneNumber: `+1${phoneNumberField}`
        };
        await callUpdateUser(uid, accountInformation);
        await callSetClaims(uid, claims);
        handleHideEditView();
    }

    const handleIconButtonClick = () => {
        showEditView(true);
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

    const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            setPhoneNumberField(event.target.value);
        }
    };

    // const handleWebsiteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setWebsite(event.target.value);
    //     }
    // };

    // const handleStreetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setAddressLine1(event.target.value);
    //     }
    // };

    // const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setCity(event.target.value);
    //     }
    // };

    // const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setState(event.target.value);
    //     }
    // };

    // const handleZipcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         setZipcode(event.target.value);
    //     }
    // };

    const handleToggleIsAdmin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAdmin(event.target.checked);
    };

    const handleToggleIsAidWorker = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsAidWorker(event.target.checked);
    };

    const handleToggleCanReadDonations = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCanReadDonations(event.target.checked);
    };

    const handleToggleIsDonor = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsDonor(event.target.checked);
    };

    const handleToggleIsVolunteer = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsVolunteer(event.target.checked);
    };

    // const handleToggleIsVerified = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (uid != null) {
    //         callSetClaimForVerified(uid, event.target.checked);
    //     }
    // };

    if (!uid) {
        return <></>;
    } else {
        return isLoading ? (
            <Loader key={uid!} />
        ) : (
            <ListItem
                key={uid!}
                className={styles['grid__item']}
                secondaryAction={
                    <IconButton sx={{ color: 'rgba(16, 16, 16, 0.54)' }} aria-label={`details about ${displayName}`} onClick={handleIconButtonClick}>
                        <InfoIcon />
                    </IconButton>
                }
            >
                {/* <img
                    src={photoURL ?? undefined}
                    style={{
                        width: `${photoURL ? '100%' : '250px'}`,
                        height: `${photoURL ? '100%' : '250px'}`,
                        objectFit: 'fill'
                    }}
                    alt={`${photoURL ? `Profile photo of ${displayName}.` : `${displayName} does not have a photo.`}`}
                /> */}
                <ListItemText primary={displayName} secondary={email} />
                <Dialog open={editView} onClose={handleHideEditView}>
                    <DialogContent>
                        <h3>Edit {displayName ? `${displayName}` : 'user'}</h3>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Roles</FormLabel>
                            <FormGroup id="roles" aria-label="Roles" row>
                                <FormControlLabel label="Administrator" control={<Checkbox checked={isAdmin} onChange={handleToggleIsAdmin} />} />
                                <FormControlLabel label="Aid Worker" control={<Checkbox checked={isAidWorker} onChange={handleToggleIsAidWorker} />} />
                                <FormControlLabel label="Donor" control={<Checkbox checked={isDonor} onChange={handleToggleIsDonor} />} />
                                <FormControlLabel label="Volunteer" control={<Checkbox checked={isVolunteer} onChange={handleToggleIsVolunteer} />} />
                            </FormGroup>
                            {/* <FormLabel component="legend">Verification</FormLabel>
                            <FormControlLabel label="Verified" control={<Checkbox checked={isVerified} onChange={handleToggleIsVerified} />} /> */}
                            <FormLabel component="legend">Permission</FormLabel>
                            <FormControlLabel
                                label="Reading Donations"
                                control={<Checkbox checked={canReadDonations} onChange={handleToggleCanReadDonations} />}
                            />
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
                                onChange={handlePhoneNumberChange}
                                value={phoneNumber}
                                variant="standard"
                            />
                            {/* <TextField
                                type="text"
                                label="Website"
                                placeholder="Input website"
                                name="website"
                                id="website"
                                onChange={handleWebsiteChange}
                                value={website}
                                variant="standard"
                            />
                            <FormLabel component="legend">Location Details</FormLabel>
                            <TextField
                                type="text"
                                label="Street Address"
                                placeholder="Input street address"
                                name="street"
                                id="street"
                                onChange={handleStreetChange}
                                value={addressLine1}
                                variant="standard"
                            />
                            <TextField
                                type="text"
                                label="City"
                                placeholder="Input city"
                                name="city"
                                id="city"
                                onChange={handleCityChange}
                                value={city}
                                variant="standard"
                            />
                            <TextField
                                type="text"
                                label="State"
                                placeholder="Input state"
                                name="state"
                                id="state"
                                onChange={handleStateChange}
                                value={state}
                                variant="standard"
                            />
                            <TextField
                                type="text"
                                label="Zipcode"
                                placeholder="Input zipcode"
                                name="zipcode"
                                id="zipcode"
                                onChange={handleZipcodeChange}
                                value={zipcode}
                                variant="standard"
                            /> */}
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleFormSubmit}>update</Button>
                        <Button onClick={handleHideEditView}>close</Button>
                    </DialogActions>
                </Dialog>
            </ListItem>
        );
    }
}
