'use client';
//Components
import { Autocomplete, Box, Button, Paper, TextField } from '@mui/material';
import UserConfirmationDialogue from '@/components/UserConfirmationDialogue';
//Hooks
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
//Libs
import { callIsEmailInUse, createUser, addErrorEvent, callGetOrganizationNames } from '@/api/firebase';
import { PatternFormat, OnValueChange } from 'react-number-format';
//Styling
import '../../styles/globalStyles.css';
import Loader from '@/components/Loader';
import { newUserAccountInfo } from '@/types/UserTypes';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewAccount() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [confirmedUserName, setConfirmedUserName] = useState<string>('');

    //List of Org names, ids from Server
    const [orgNamesAndIds, setOrgNamesAndIds] = useState<{
        [key: string]: string;
    }>({});

    const orgNames = Object.keys(orgNamesAndIds);

    //Org Value from existing list
    const [orgValue, setOrgValue] = useState<string | null>(null);

    //Org value if user entered text
    const [orgInputValue, setOrgInputValue] = useState<string>('');

    const router = useRouter();

    const getOrgNames = async (): Promise<void> => {
        try {
            const organizationNames = await callGetOrganizationNames();
            setOrgNamesAndIds(organizationNames);
        } catch (error) {
            addErrorEvent('Could not fetch org names', error);
        }
    };

    const handleAccountCreate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);

        //if user selects existing org, submit org name and id. If not, enter the user suplied org name in the notes field.

        let organization;
        let notes: string[] = [];

        if (orgValue) {
            organization = {
                id: orgNamesAndIds[orgValue],
                name: orgValue
            };
        } else {
            organization = null;
            notes = [`User provided organization: ${orgInputValue}`];
        }

        const accountInfo: newUserAccountInfo = {
            displayName: displayName,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            organization: organization,
            notes: notes
        };
        try {
            const newUser = await createUser(accountInfo);
            newUser.displayName && setConfirmedUserName(newUser.displayName);
            setIsLoading(false);
            setOpenDialog(true);
        } catch (error) {
            setIsLoading(false);
            addErrorEvent('handleAccountCreate', error);
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
        setEmail(event.target.value);
        validateEmail(email);
    };

    const handlePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.target.value);
        if (password.length != 0 && event.target.value != confirmPassword) {
            setPasswordsDoNotMatch(true);
        } else {
            setPasswordsDoNotMatch(false);
        }
    };

    const handleConfirmPassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setConfirmPassword(event.target.value);
        if (confirmPassword.length != 0 && event.target.value != password) {
            setPasswordsDoNotMatch(true);
        } else {
            setPasswordsDoNotMatch(false);
        }
    };

    const handleBlur = async (): Promise<void> => {
        validateEmail(email);
        if (!isInvalidEmail) {
            const emailInUse = await callIsEmailInUse(email);
            setIsEmailInUse(emailInUse);
        }
    };

    const handlePhoneNumberInput: OnValueChange = (values): void => {
        setPhoneNumber(values.formattedValue);
    };

    const handleClose = () => {
        setOpenDialog(false);
        router.push('/');
    };

    useEffect(() => {
        getOrgNames();
    }, []);

    return (
        <>
            <div className="page--header">
                <h1>Join</h1>
            </div>

            <Paper className="content--container" elevation={8} square={false}>
                {isLoading ? (
                    <Loader />
                ) : (
                    <>
                        <Box component="form" gap={3} display={'flex'} flexDirection={'column'} onSubmit={handleAccountCreate} className="form--container">
                            <UserConfirmationDialogue open={openDialog} onClose={handleClose} displayName={confirmedUserName} />
                            <TextField
                                type="text"
                                label="Display Name"
                                name="displayName"
                                id="displayName"
                                placeholder="Provide a display name"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                    setDisplayName(event.target.value);
                                }}
                                value={displayName}
                                required
                            />
                            <TextField
                                type="text"
                                label="Email"
                                name="email"
                                id="email"
                                placeholder="Input email"
                                autoComplete="email"
                                value={email}
                                error={isEmailInUse || isInvalidEmail}
                                helperText={(isInvalidEmail && 'Please enter a valid email addres') || (isEmailInUse && 'This email is already in use')}
                                required
                                onChange={handleEmailInput}
                                onBlur={handleBlur}
                            />
                            <Autocomplete
                                sx={{ maxWidth: '580px' }}
                                freeSolo={true}
                                value={orgValue}
                                onChange={(event: any, newValue: string | null) => setOrgValue(newValue)}
                                inputValue={orgInputValue}
                                onInputChange={(event, newInputValue) => setOrgInputValue(newInputValue)}
                                id="organzation-select"
                                options={orgNames}
                                renderInput={(params) => <TextField {...params} label="Organization (select or enter a name)" />}
                            />
                            <TextField
                                type="password"
                                label="Password"
                                name="password"
                                id="password"
                                placeholder="Input password"
                                autoComplete="current-password"
                                value={password}
                                required
                                onChange={handlePassword}
                            />
                            <TextField
                                type="password"
                                label="Confirm Password"
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                error={passwordsDoNotMatch}
                                helperText={passwordsDoNotMatch ? 'Passwords do not match.' : undefined}
                                required
                                onChange={handleConfirmPassword}
                            />
                            <PatternFormat
                                id="phone-number"
                                format="+1 (###) ###-####"
                                mask="_"
                                allowEmptyFormatting
                                value={phoneNumber}
                                onValueChange={handlePhoneNumberInput}
                                type="tel"
                                displayType="input"
                                customInput={TextField}
                            />
                            <Button variant="contained" type={'submit'} disabled={isEmailInUse || passwordsDoNotMatch}>
                                Join
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </>
    );
}
