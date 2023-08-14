'use client'

import { onAuthStateChangedListener } from '@/api/firebase'
import { Unsubscribe, User, UserCredential } from 'firebase/auth'
import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react'

type UserContextType = {
    currentUser: User | null
    setCurrentUser: Dispatch<SetStateAction<User | null>>
}

type Props = {
    children: ReactNode
}

export const UserContext = createContext<UserContextType>({
    setCurrentUser: () => null,
    currentUser: null
})

export const UserProvider = ({ children }: Props) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const value = {
        currentUser,
        setCurrentUser
    }

    console.log(currentUser)

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => setCurrentUser(user))
        return unsubscribe
    }, [])

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
