'use client';
//Components
import ToasterNotification from '@/components/ToasterNotification';
import Loader from '@/components/Loader';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { Box, TextField, Button } from '@mui/material';

//Hooks
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

    return (
        <>
            <Suspense fallback={<Loader />}>
                <LoginForm
                    loginState={loginState}
                    setLoginState={setLoginState}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    router={router}
                />
            </Suspense>
        </>
    );
}

function LoginForm({ loginState, setLoginState, email, setEmail, password, setPassword, router }: any) {
    const [isInvalidLogin, setIsInvalidLogin] = useState<boolean>(false);

    useEffect(() => {
        onAuthStateChangedListener((user) => {
            if (user) router.push('/');
            else setLoginState('loggedOut');
        });
    }, [router]);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        try {
            await signInAuthUserWithEmailAndPassword(email, password);
            router.push('/');
        } catch (error) {
            setIsInvalidLogin(true);
        }
    };

    return (
        <>
            <div className="page--header">
                <h1>Login</h1>
                <h4>[Page Summary]</h4>
            </div>
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
                                error={isInvalidLogin}
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
                                error={isInvalidLogin}
                                helperText={isInvalidLogin && 'The credentials provided were invalid, please try again'}
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
                        <Link id="reset-password" href="./reset-password">
                            Forgot password?
                        </Link>
                    </>
                )}
            </div>
            <hr />
            <h4>
                Don't have an account?{' '}
                <Link id="join" href="./join">
                    Join here
                </Link>
            </h4>
        </>
    );
}
