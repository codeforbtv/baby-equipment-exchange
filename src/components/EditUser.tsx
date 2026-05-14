'use client';

//Hooks
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
//API
import { addErrorEvent, getAuthIdToken } from '@/api/firebase';
import { getOrganizationNames, isEmailInUse as checkEmailInUse, setCustomClaims, updateAuthUser } from '@/app/actions/firebase';
//Components
import { Paper, Box, FormControl, Autocomplete, TextField, Button, FormLabel, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';
import Loader from '@/components/Loader';
import CustomDialog from './CustomDialog';
import ProtectedAdminRoute from './ProtectedAdminRoute';
//Styles
import '@/styles/globalStyles.css';
//Types
import { PatternFormat, OnValueChange } from 'react-number-format';

import { IUser } from '@/models/user';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EditUserProps = {
    userDetails: IUser;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    setUserDetailsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const EditUser = (props: EditUserProps) => {
    const { uid, email, displayName, customClaims, phoneNumber, organization, isDisabled, title } = props.userDetails;
    const { setIsEditMode, setUserDetailsUpdated } = props;

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
    const [newTitle, setNewTitle] = useState<string>(title ?? '');
    const [role, setRole] = useState<string>(initialRole);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleClose = () => {
        if (setUserDetailsUpdated) setUserDetailsUpdated(true);
        setIsDialogOpen(false);
        setIsEditMode(false);
    };

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);

    const initialOrg: string | null = organization ? organization.name : null;

    const [selectedOrg, setSelectedOrg] = useState<string | null>(initialOrg);

    const getOrgNames = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const organizationNamesResult = await getOrganizationNames();
            setOrgNamesAndIds(organizationNamesResult);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        } finally {
            setIsLoading(false);
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
        const nextEmail = event.target.value;
        setNewEmail(nextEmail);
        validateEmail(nextEmail);
        if (nextEmail === email) setIsEmailInUse(false);
    };

    const handleBlur = async (): Promise<void> => {
        validateEmail(newEmail);
        //Only check if email is valid if different from inital email value
        if (!isInvalidEmail && newEmail !== email) {
            const emailInUse = await checkEmailInUse({ email: newEmail });
            setIsEmailInUse(emailInUse);
        }
    };

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setNewPhoneNumber(values.formattedValue);
    };

    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRole((event.target as HTMLInputElement).value);
    };

    const handleSubmitUpdatedUser = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            if (role !== initialRole) {
                try {
                    const claims: Partial<Record<string, boolean>> = { [role]: true };
                    await setCustomClaims({ idToken: await getAuthIdToken(), userId: uid, claims });
                } catch (error) {
                    addErrorEvent('Error updated custom claims', error);
                }
            }
            if (email !== newEmail || displayName !== newDisplayName || phoneNumber !== newPhoneNumber || initialOrg !== selectedOrg || title !== newTitle) {
                try {
                    const updatedOrganization = selectedOrg
                        ? { id: orgNamesAndIds[selectedOrg], name: selectedOrg }
                        : null;
                    await updateAuthUser({
                        idToken: await getAuthIdToken(),
                        uid,
                        accountInformation: {
                            email: newEmail,
                            displayName: newDisplayName,
                            phoneNumber: newPhoneNumber,
                            organization: updatedOrganization,
                            title: newTitle
                        }
                    });
                } catch (error) {
                    addErrorEvent('Error updating user', error);
                    throw error;
                }
            }
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error updating user', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    return (
        <ProtectedAdminRoute>
            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <Box component="form" gap={3} display={'flex'} flexDirection={'column'} className="form--container" onSubmit={handleSubmitUpdatedUser}>
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
                            helperText={(isInvalidEmail && 'Please enter a valid email address') || (isEmailInUse && 'This email is already in use')}
                            required
                            onChange={handleEmailInput}
                            onBlur={handleBlur}
                        />
                        {orgNamesAndIds ? (
                            <Autocomplete
                                disablePortal
                                sx={{ maxWidth: { sm: '88%', xs: '80%' } }}
                                value={selectedOrg}
                                onChange={(event: any, newValue: string | null) => setSelectedOrg(newValue)}
                                id="organzation-select"
                                options={orgNames}
                                renderInput={(params) => <TextField {...params} label="Organization" />}
                            />
                        ) : (
                            <Typography variant="body1">Could not load list of organizations</Typography>
                        )}
                        <TextField
                            type="text"
                            label="Title"
                            name="title"
                            id="title"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                setNewTitle(event.target.value);
                            }}
                            value={newTitle}
                        />
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
                        {isDisabled && (
                            <Typography variant="body2" color="text.secondary">
                                Saving these changes will not enable this user account.
                            </Typography>
                        )}
                        <FormControl disabled={!customClaims}>
                            <FormLabel id="role-radio-buttons-label">Role:</FormLabel>
                            <RadioGroup aria-labelledby="role-radio-buttons-label" name="role-radio-buttons-group" value={role} onChange={handleRadioChange}>
                                <FormControlLabel value="admin" control={<Radio />} label="Administrator" />
                                <FormControlLabel value="aid-worker" control={<Radio />} label="Aid Worker" />
                            </RadioGroup>
                        </FormControl>
                        <Box display={'flex'} gap={2}>
                            <Button variant="contained" type="submit" disabled={isEmailInUse || isInvalidEmail}>
                                Update User
                            </Button>

                            <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="User updated" content={`The user ${newDisplayName} has been updated.`} />
        </ProtectedAdminRoute>
    );
};

export default EditUser;
