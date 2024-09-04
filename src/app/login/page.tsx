'use client';
//Components
import ToasterNotification from '@/components/ToasterNotification';
import Loader from '@/components/Loader';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { Box, TextField, Button } from '@mui/material';

//Hooks
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
//Libs
import { signInAuthUserWithEmailAndPassword, onAuthStateChangedListener } from '@/api/firebase';
//Styling
import '../../styles/globalStyles.css';
import styles from './Login.module.css';

export default function Login() {
    const [loginState, setLoginState] = useState<'pending' | 'loggedIn' | 'loggedOut'>('pending');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get('status');

    useEffect(() => {
        onAuthStateChangedListener((user) => {
            if (user) router.push('/');
            else setLoginState('loggedOut');
        });
    }, []);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        try {
            await signInAuthUserWithEmailAndPassword(email, password);
            router.push('/');
        } catch (error) {
            router.push('/login?status=invalid_login');
        }
    };

    return (
        <>
            <div className="page-container">
                <h1>Login</h1>
                <h4>[Page Summary]</h4>
                <div className="content--container">
                    {loginState === 'pending' && <Loader />}
                    {loginState === 'loggedOut' && (
                        <>
                            <Box component="form" gap={3} display={'flex'} flexDirection={'column'} onSubmit={handleLogin}>
                                <TextField
                                    type="text"
                                    name="email"
                                    id="email"
                                    label="Email"
                                    placeholder="Input Email"
                                    autoComplete="email"
                                    value={email}
                                    required
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setEmail(event.target.value);
                                    }}
                                />
                                <TextField
                                    type="password"
                                    name="password"
                                    id="password"
                                    label="Password"
                                    placeholder="Input Password"
                                    autoComplete="current-password"
                                    value={password}
                                    required
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setPassword(event.target.value);
                                    }}
                                />
                                <Button variant="contained" type="submit" endIcon={<VpnKeyOutlinedIcon />}>
                                    Login
                                </Button>
                            </Box>
                            <hr />
                            <span>Instructions for forgotten password.</span>
                        </>
                    )}
                </div>
            </div>
            {status && <ToasterNotification status={status} />}
        </>
    );
}
