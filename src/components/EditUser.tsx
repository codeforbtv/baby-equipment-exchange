'use client';

//Hooks
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

//API
import { callGetOrganizationNames, addErrorEvent, callIsEmailInUse } from '@/api/firebase';
import { PatternFormat, OnValueChange } from 'react-number-format';
//Componenets
import {
    Paper,
    Box,
    FormControl,
    InputLabel,
    Select,
    SelectChangeEvent,
    MenuItem,
    Autocomplete,
    TextField,
    Button,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import Loader from '@/components/Loader';
//Styles
import '@/styles/globalStyles.css';
//Types
import { UserDetails } from '@/types/UserTypes';
import { event } from 'firebase-functions/v1/analytics';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EditUserProps = {
    userDetails: UserDetails;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
};

const EditUser = (props: EditUserProps) => {
    const { email, displayName, metadata, customClaims, phoneNumber, notes, organization } = props.userDetails;
    const setIsEditMode = props.setIsEditMode;

    let initialRole = '';
    if (customClaims && customClaims.admin === true) {
        initialRole = 'admin';
    } else if (customClaims && customClaims['aid-worker'] === true) {
        initialRole = 'aid-worker';
    }

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newDisplayName, setNewDisplayName] = useState<string>(displayName);
    const [newEmail, setNewEmail] = useState<string>(email);
    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState<string>(phoneNumber);
    const [role, setRole] = useState<string>(initialRole);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);

    const initialOrg: string | null = organization ? organization.name : null;

    const [selectedOrg, setSelectedOrg] = useState<string | null>(initialOrg);

    const getOrgNames = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const organizationNamesResult = await callGetOrganizationNames();
            setOrgNamesAndIds(organizationNamesResult);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('Could not fetch org names', error);
        }
    };

    const validateEmail = (email: string): void => {
        if (email.length === 0 || !emailRegex.test(email)) {
            setIsInvalidEmail(true);
        } else {
            setIsInvalidEmail(false);
        }
    };

    const handleEmailInput = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        setNewEmail(event.target.value);
        validateEmail(newEmail);
    };

    const handleBlur = async (): Promise<void> => {
        validateEmail(newEmail);
        //Only check if email is valid if different from inital email value
        if (!isInvalidEmail && newEmail !== email) {
            const emailInUse = await callIsEmailInUse(newEmail);
            setIsEmailInUse(emailInUse);
        }
    };

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setNewPhoneNumber(values.formattedValue);
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRole((event.target as HTMLInputElement).value);
    };

    const handleSubmitUpdatedUser = async (event: React.FormEvent) => {
        event.preventDefault();
        //if any fields stored in the firebase auth user have changed, update auth user.
        if (email !== newEmail || displayName !== newDisplayName) {
        }

        //If user role has changed it requires a separate API call
        if (role !== initialRole) {
        }
        //If any fields in User collection in DB, update db user
        if (phoneNumber !== newPhoneNumber || initialOrg !== selectedOrg) {
        }
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    return (
        <>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" gap={3} display={'flex'} flexDirection={'column'} className="form--container" onSubmit={}>
                        <TextField
                            type="text"
                            label="Display Name"
                            name="displayName"
                            id="displayName"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                setNewDisplayName(event.target.value);
                            }}
                            value={newDisplayName}
                            required
                        />
                        <TextField
                            type="text"
                            label="Email"
                            name="email"
                            id="email"
                            autoComplete="email"
                            value={newEmail}
                            error={isEmailInUse || isInvalidEmail}
                            helperText={(isInvalidEmail && 'Please enter a valid email addres') || (isEmailInUse && 'This email is already in use')}
                            required
                            onChange={handleEmailInput}
                            onBlur={handleBlur}
                        />
                        {orgNamesAndIds ? (
                            <Autocomplete
                                disablePortal
                                sx={{ maxWidth: '580px' }}
                                value={selectedOrg}
                                onChange={(event: any, newValue: string | null) => setSelectedOrg(newValue)}
                                id="organzation-select"
                                options={orgNames}
                                renderInput={(params) => <TextField {...params} label="Organization" />}
                            />
                        ) : (
                            <p>Could not load list of organizations</p>
                        )}
                        <PatternFormat
                            id="phone-number"
                            format="+1 (###) ###-####"
                            mask="_"
                            allowEmptyFormatting
                            value={newPhoneNumber}
                            onValueChange={handlePhoneNumberInput}
                            type="tel"
                            displayType="input"
                            customInput={TextField}
                        />
                        <FormControl disabled={!customClaims}>
                            <FormLabel id="role-radio-buttons-label">Role:</FormLabel>
                            <RadioGroup aria-labelledby="role-radio-buttons-label" name="role-radio-buttons-group" value={role} onChange={handleRadioChange}>
                                <FormControlLabel value="admin" control={<Radio />} label="Administrator" />
                                <FormControlLabel value="aid-worker" control={<Radio />} label="Aid Worker" />
                            </RadioGroup>
                        </FormControl>
                        <Button variant="contained" type="submit">
                            Update User
                        </Button>
                        <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Paper>
        </>
    );
};

export default EditUser;
