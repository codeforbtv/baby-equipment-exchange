'use client'
//Components
import InputContainer from '@/components/InputContainer'
import ButtonContainer from '@/components/ButtonContainer'
//Hooks
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
//Libs
import { Theme } from '@/components/ButtonContainer'
import { onAuthStateChangedListener, createNewUser } from '../../api/firebase'
//Styling
import globalStyles from '@/styles/globalStyles.module.css'
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

    const handleEmailInput = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        setEmailInUse(await isEmailInUse(event.target.value))
    }

    return (
        <>
            <div>
                <h1>Join</h1>
                <h4>Create a new account.</h4>
                <div className={globalStyles['content__container']}>
                    {loginState === 'pending' && <Loader />}
                    {loginState === 'loggedOut' && (
                        <>
                            <form onSubmit={handleAccountCreate}>
                                <InputContainer for="displayName" label="Display Name" footnote="">
                                    <input
                                        type="text"
                                        name="displayName"
                                        id="displayName"
                                        placeholder="Provide a display name"
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                            setDisplayName(event.target.value)
                                        }}
                                        value={displayName}
                                        required
                                    />
                                </InputContainer>
                                <InputContainer for="email" label="Email" footnote={emailInUse ? 'Email address is already in use.' : ' '}>
                                    <input
                                        type="text"
                                        name="email"
                                        id="email"
                                        placeholder="Input email"
                                        autoComplete="email"
                                        value={email}
                                        required
                                        onBlur={handleEmailInput}
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                            setEmail(event.target.value)
                                        }}
                                    />
                                </InputContainer>
                                <InputContainer for="password" label="Password" footnote="">
                                    <input
                                        type="password"
                                        name="password"
                                        id="password"
                                        placeholder="Input password"
                                        autoComplete="current-password"
                                        value={password}
                                        required
                                        onChange={handlePassword}
                                    />
                                </InputContainer>
                                <InputContainer for="confirmPassword" label="Confirm Password" footnote={passwordsDoNotMatch ? 'Passwords do not match.' : ''}>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        id="confirmPassword"
                                        placeholder=" Confirm password"
                                        value={confirmPassword}
                                        required
                                        onChange={handleConfirmPassword}
                                    />
                                </InputContainer>
                                {emailInUse || passwordsDoNotMatch ? (
                                    <ButtonContainer type="submit" text="create" theme={Theme.dark} hasIcon disabled />
                                ) : (
                                    <ButtonContainer type="submit" text="create" theme={Theme.dark} hasIcon />
                                )}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
