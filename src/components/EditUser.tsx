'use client';

//Hooks
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
//API
import { callGetOrganizationNames, addErrorEvent, callIsEmailInUse, callSetClaims, callUpdateAuthUser, callEnableUser } from '@/api/firebase';
import sendMail from '@/api/nodemailer';
import { enableDbUser, updateDbUser } from '@/api/firebase-users';
//Components
import { Paper, Box, FormControl, Autocomplete, TextField, Button, FormLabel, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';
import Loader from '@/components/Loader';
import CustomDialog from './CustomDialog';
import ProtectedAdminRoute from './ProtectedAdminRoute';
//Constants
import userEnabled from '@/email-templates/userEnabled';
//Styles
import '@/styles/globalStyles.css';
//Types
import { PatternFormat, OnValueChange } from 'react-number-format';

import { UserCollection } from '@/models/user';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EditUserProps = {
    userDetails: UserCollection;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    setUserDetailsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const EditUser = (props: EditUserProps) => {
    const { uid, email, displayName, customClaims, phoneNumber, notes, organization, isDisabled, title } = props.userDetails;
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
            const organizationNamesResult = await callGetOrganizationNames();
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

    const handleSubmitUpdatedUser = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            //If account is inactive, activate and send confirmation email
            if (isDisabled) {
                try {
                    await Promise.all([callEnableUser(uid), enableDbUser(uid)]);
                    const emailMsg = userEnabled(email, displayName);
                    await sendMail(emailMsg);
                } catch (error) {
                    addErrorEvent('Error enable user', error);
                }
            }
            //if any fields stored in the firebase auth user have changed, update auth user.
            if (email !== newEmail || displayName !== newDisplayName) {
                try {
                    const updatedAuthUser = await callUpdateAuthUser(uid, {
                        email: newEmail,
                        displayName: newDisplayName
                    });
                } catch (error) {
                    addErrorEvent('Error updating email or display name', error);
                }
            }
            //If user role has changed it requires a separate API call
            if (role !== initialRole) {
                try {
                    const claims = { [`${role}`]: true };
                    await Promise.all([callSetClaims(uid, claims), updateDbUser(uid, { customClaims: claims })]);
                } catch (error) {
                    addErrorEvent('Error updated custom claims', error);
                }
            }
            //If any fields in User collection in DB, update db user
            if (phoneNumber !== newPhoneNumber || initialOrg !== selectedOrg || email !== newEmail || displayName !== newDisplayName || title !== newTitle) {
                try {
                    const updatedOrganization = selectedOrg
                        ? {
                              id: orgNamesAndIds[selectedOrg],
                              name: selectedOrg
                          }
                        : null;

                    await updateDbUser(uid, {
                        phoneNumber: newPhoneNumber,
                        organization: updatedOrganization,
                        title: newTitle,
                        email: newEmail,
                        displayName: newDisplayName
                    });
                } catch (error) {
                    addErrorEvent('Error updating DB user', error);
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
                            helperText={(isInvalidEmail && 'Please enter a valid email addres') || (isEmailInUse && 'This email is already in use')}
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
                        <FormControl disabled={!customClaims}>
                            <FormLabel id="role-radio-buttons-label">Role:</FormLabel>
                            <RadioGroup aria-labelledby="role-radio-buttons-label" name="role-radio-buttons-group" value={role} onChange={handleRadioChange}>
                                <FormControlLabel value="admin" control={<Radio />} label="Administrator" />
                                <FormControlLabel value="aid-worker" control={<Radio />} label="Aid Worker" />
                            </RadioGroup>
                        </FormControl>
                        <Box display={'flex'} gap={2}>
                            {!initialOrg ? (
                                <Button variant="contained" type="submit" disabled={!selectedOrg}>
                                    Enable User
                                </Button>
                            ) : (
                                <Button variant="contained" type="submit">
                                    Update User
                                </Button>
                            )}

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
