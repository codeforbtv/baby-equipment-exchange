'use client';
//Components
import { Box, Button, Paper, TextField } from '@mui/material';
import UserConfirmationDialogue from '@/components/UserConfirmationDialogue';
//Hooks
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
//Libs
import { onAuthStateChangedListener, callIsEmailInUse, createUser, addErrorEvent, signOutUser } from '@/api/firebase';
//Styling
import '../../styles/globalStyles.css';
import Loader from '@/components/Loader';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewAccount() {
    const [loginState, setLoginState] = useState<'pending' | 'loggedIn' | 'loggedOut'>('loggedOut');
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isEmailInUse, setIsEmailInUse] = useState<boolean>(false);
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const router = useRouter();

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

    // useEffect(() => {
    //     onAuthStateChangedListener((user) => {
    //         if (user) router.push('/');
    //         else setLoginState('loggedOut');
    //     });
    // }, []);

    const handleAccountCreate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        try {
            await createUser(displayName, email, password);
            setOpenDialog(true);
        } catch (error) {
            addErrorEvent('handleAccountCreate', error);
        }
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

    const handleClose = () => {
        signOutUser();
        setOpenDialog(false);
        router.push('/');
    };

    useEffect(() => {
        console.log('open dialog: ', openDialog);
    }, [openDialog]);

    return (
        <>
            <div className="page--header">
                <h1>Join</h1>
            </div>

            <Paper className="content--container" elevation={8} square={false}>
                {loginState === 'pending' && <Loader />}
                {loginState === 'loggedOut' && (
                    <>
                        <Box component="form" gap={3} display={'flex'} flexDirection={'column'} onSubmit={handleAccountCreate}>
                            <UserConfirmationDialogue open={openDialog} onClose={handleClose} displayName={displayName} />
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
