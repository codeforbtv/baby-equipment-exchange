'use client';
//Components
import { Box, TextField, Button } from '@mui/material';
//Hooks
import { useState } from 'react';
import { useRouter } from 'next/navigation';
//Libs
import { resetPassword } from '@/api/firebase-users';
//Styling
import '../../styles/globalStyles.css';
import CustomDialog from '@/components/CustomDialog';
import { addErrorEvent } from '@/api/firebase';
import Loader from '@/components/Loader';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPassword() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const router = useRouter();

    const handleClose = () => {
        setIsDialogOpen(false);
        router.push('/login');
    };

    const validateEmail = (email: string): void => {
        if (email.length === 0 || !emailRegex.test(email)) {
            setIsInvalidEmail(true);
        } else {
            setIsInvalidEmail(false);
        }
    };

    const handleEmailInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(event.target.value);
        validateEmail(email);
    };

    const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            await resetPassword(email);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error resetting password', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlur = (): void => {
        validateEmail(email);
    };

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <>
                    <div className="page--header">
                        <h1>Reset Password</h1>
                        <h4>Enter an email and instructions for restting your password will be sent to you.</h4>
                    </div>
                    <div className="content--container">
                        <Box component="form" gap={3} display={'flex'} flexDirection={'column'} onSubmit={handlePasswordReset}>
                            <TextField
                                type="email"
                                label="Email"
                                name="email"
                                id="email"
                                placeholder="Input email"
                                autoComplete="email"
                                value={email}
                                error={isInvalidEmail}
                                helperText={isInvalidEmail ? 'Please enter a valid email addres' : undefined}
                                required
                                onChange={handleEmailInput}
                                onBlur={handleBlur}
                            />

                            <Button variant="contained" type="submit">
                                Continue
                            </Button>
                            <Button variant="outlined" type="button" onClick={() => router.push('./login')}>
                                Cancel
                            </Button>
                        </Box>
                    </div>
                </>
            )}
            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Email Sent"
                content={`An email with instructions for resetting your password has been sent to ${email}. Please check your spam folder if you cannot find this email. `}
            />
        </>
    );
}
