'use client'
//Components
import { Box, Button, Paper, TextField } from '@mui/material'
//Hooks
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
//Libs
import { onAuthStateChangedListener, createNewUser } from '@/api/firebase'
//Styling
import globalStyles from '@/styles/globalStyles.module.scss'
import { NewUser } from '@/types/post-data'
import { isEmailInUse } from '@/api/firebase-admin'
import Loader from '@/components/Loader'

export default function NewAccount() {
    const [loginState, setLoginState] = useState<'pending' | 'loggedIn' | 'loggedOut'>('pending')
    const [displayName, setDisplayName] = useState<string>('')
    const [email, setEmail] = useState<string>('')
    const [emailInUse, setEmailInUse] = useState<boolean>(false)
    const [passwordsDoNotMatch, setPasswordsDoNotMatch] = useState<boolean>(false)
    const [password, setPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const router = useRouter()

    useEffect(() => {
        onAuthStateChangedListener((user) => {
            if (user) router.push('/')
            else setLoginState('loggedOut')
        })
    }, [])

    const handleAccountCreate = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()
        try {
            const newUser: NewUser = {
                user: undefined,
                name: displayName,
                email: email,
                photo: undefined
            }
            await createNewUser(newUser, password)
            router.push('/')
        } catch (error) {
            // eslint-ignore-line no-empty
        }
    }

    const handlePassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.target.value)
        if (confirmPassword.length != 0 && event.target.value != confirmPassword) {
            setPasswordsDoNotMatch(true)
        } else {
            setPasswordsDoNotMatch(false)
        }
    }

    const handleConfirmPassword = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setConfirmPassword(event.target.value)
        if (confirmPassword.length != 0 && event.target.value != password) {
            setPasswordsDoNotMatch(true)
        } else {
            setPasswordsDoNotMatch(false)
        }
    }

    const handleEmailInput = async (): Promise<void> => {
        setEmailInUse(await isEmailInUse(email))
    }

    return (
        <>
            <div>
                <h1>Join</h1>
                <h4>Create a new account.</h4>
                <Paper className={globalStyles['content__container']} elevation={8} square={false}>
                    {loginState === 'pending' && <Loader />}
                    {loginState === 'loggedOut' && (
                        <>
                            <Box component="form" gap={3} display={"flex"} flexDirection={"column"} onSubmit={handleAccountCreate}>
                                <TextField
                                    type="text"
                                    label="Display Name"
                                    name="displayName"
                                    id="displayName"
                                    placeholder="Provide a display name"
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setDisplayName(event.target.value)
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
                                    error={emailInUse}
                                    helperText={emailInUse ? 'Email address is already in use.' : undefined}
                                    required
                                    inputProps={{
                                        onBlur: handleEmailInput
                                    }}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setEmail(event.target.value)
                                    }}
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
                                    placeholder=" Confirm password"
                                    value={confirmPassword}
                                    error={passwordsDoNotMatch}
                                    helperText={passwordsDoNotMatch ? 'Passwords do not match.' : undefined}
                                    required
                                    onChange={handleConfirmPassword}
                                />
                                <Button variant="contained" type={'submit'} disabled={emailInUse || passwordsDoNotMatch}>Join</Button>
                            </Box>
                        </>
                    )}
                </Paper>
            </div>
        </>
    )
}
