'use client';
//Components
import ToasterNotification from '@/components/ToasterNotification';
import Loader from '@/components/Loader';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { Box, TextField, Button } from '@mui/material';

//Hooks
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
//Libs
import { resetPassword } from '@/api/firebase';
//Styling
import '../../styles/globalStyles.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPassword() {
    const [email, setEmail] = useState<string>('');
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const router = useRouter();

    const searchParams = useSearchParams();
    const status = searchParams.get('status');

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

        try {
            await resetPassword(email);
            router.push('/login?status=password_reset');
        } catch (error: any) {
            console.log(error);
        }
    };

    const handleBlur = (): void => {
        validateEmail(email);
    };

    return (
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

            {status && <ToasterNotification status={status} />}
        </>
    );
}
