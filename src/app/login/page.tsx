'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ButtonContainer from "@/components/ButtonContainer";
import ToasterNotification from "@/components/ToasterNotification";
import Loader from "@/components/Loader";
//Hooks
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
//Libs
import { Theme } from "@/components/ButtonContainer";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInAuthUserWithEmailAndPassword } from '../../api/firebase'
//Styling
import globalStyles from "@/styles/globalStyles.module.css"
import styles from "./Login.module.css";


export default function Login() {
    const [loginState, setLoginState] = useState<'pending' | 'loggedIn' | 'loggedOut'>('pending')
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const status = searchParams.get('status');

    useEffect(() => {
        onAuthStateChanged(auth, user => {
            if (user) router.push('/')
            else setLoginState('loggedOut')
        })
    }, [])

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        try {
            await signInAuthUserWithEmailAndPassword(email, password);
            router.push('/')
        } catch (error) {
            router.push('/login?status=invalid_login')
            setEmail('')
            setPassword('')
        }
    }


    return (
        <>
            <div className={styles["login__container"]}>
                <h1>Login</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    {loginState === 'pending' && <Loader />}
                    {loginState === 'loggedOut' &&
                        <>
                            <form onSubmit={handleLogin}>
                                <InputContainer for="email" label="Email" footnote="Footnote">
                                    <input type="text" name="email" id="email" placeholder=" Input email" value={email} required onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setEmail(event.target.value)
                                    }} />
                                </InputContainer>
                                <InputContainer for="password" label="Password" footnote="Footnote" >
                                    <input type="password" name="password" id="password" placeholder=" Input password" value={password} required onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setPassword(event.target.value)
                                    }} />
                                </InputContainer>
                                <ButtonContainer type='submit' text="Login" theme={Theme.dark} hasIcon />
                            </form>
                            <hr />
                            <p>Instructions for forgotten password, account setup.</p>
                        </>
                    }
                </div>
            </div>
            {status &&
                <ToasterNotification status={status} />
            }
        </>
    )
}