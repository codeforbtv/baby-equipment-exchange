//API
import {
    callCheckClaims,
    callSetClaimForAdmin,
    callSetClaimForAidWorker,
    callSetClaimForDonationReadAccess,
    callSetClaimForDonor,
    callSetClaimForVerified,
    callSetClaimForVolunteer,
    callSetUserAccount
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

// type UserCardProps = {
//     name: string | undefined;
//     contact: IContact | null | undefined;
//     location: IAddress | null | undefined;
//     photo: string | null | undefined;
// };

type UserCardProps = Omit<UserRecord, 'toJSON'>;

export default function UserCard(props: UserCardProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [editView, showEditView] = useState<boolean>(false);
    // const user = contact?.user;
    // const userId = contact?.user?.id;
    // const [displayName, setDisplayName] = useState<string>(contact?.name ?? '');
    // const [email, setEmail] = useState<string>(contact?.email ?? '');
    // const [phoneNumber, setPhoneNumber] = useState<string>(contact?.phone ?? '');
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

    const { uid, email, displayName, photoURL, phoneNumber, customClaims } = props;

    useEffect(() => {
        (async () => {
            try {
                if (uid != null && customClaims) {
                    setCanReadDonations(customClaims['can-read-donations']);
                    setIsAdmin(customClaims['admin']);
                    setIsAidWorker(customClaims['aid-worker']);
                    setIsDonor(customClaims['donor']);
                    setIsVerified(customClaims['verified']);
                    setIsVolunteer(customClaims['volunteer']);
                    setIsLoading(false);
                }
            } catch (error) {
                // eslint-disable-line no-empty
            }
        })();
    }, []);

    function handleFormSubmit() {
        // callSetUserAccount(userId!, {
        //     name: displayName,
        //     contact: {
        //         name: displayName,
        //         user: user,
        //         email: email,
        //         notes: contact?.notes,
        //         phone: phoneNumber,
        //         website: website
        //     },
        //     location: {
        //         line_1: addressLine1,
        //         line_2: location?.line_2,
        //         city: city,
        //         state: state,
        //         zipcode: zipcode,
        //         latitude: location?.latitude,
        //         longitude: location?.longitude
        //     },
        //     photo: photo
        // }).then(() => handleHideEditView());
    }

    const handleIconButtonClick = () => {
        showEditView(true);
    };

    const handleHideEditView = () => {
        showEditView(false);
    };

    const handleDisplayNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setDisplayName(event.target.value);
        // }
    };

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setEmail(event.target.value);
        // }
    };

    const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setPhoneNumber(event.target.value);
        // }
    };

    const handleWebsiteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setWebsite(event.target.value);
        // }
    };

    const handleStreetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setAddressLine1(event.target.value);
        // }
    };

    const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setCity(event.target.value);
        // }
    };

    const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setState(event.target.value);
        // }
    };

    const handleZipcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (uid != null) {
        //     setZipcode(event.target.value);
        // }
    };

    const handleToggleIsAdmin = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForAdmin(uid, event.target.checked);
        }
    };

    const handleToggleIsAidWorker = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForAidWorker(uid, event.target.checked);
        }
    };

    const handleToggleCanReadDonations = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForDonationReadAccess(uid, event.target.checked);
        }
    };

    const handleToggleIsDonor = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForDonor(uid, event.target.checked);
        }
    };

    const handleToggleIsVerified = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForVerified(uid, event.target.checked);
        }
    };

    const handleToggleIsVolunteer = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (uid != null) {
            callSetClaimForVolunteer(uid, event.target.checked);
        }
    };

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
                            <FormLabel component="legend">Verification</FormLabel>
                            <FormControlLabel label="Verified" control={<Checkbox checked={isVerified} onChange={handleToggleIsVerified} />} />
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
