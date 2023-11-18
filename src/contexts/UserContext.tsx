'use client'

import { onAuthStateChangedListener } from '@/api/firebase'
import { User } from 'firebase/auth'
import { createContext, useState, useEffect, ReactNode, useContext } from 'react'

type UserContextType = {
    currentUser: User | null
    isLoading: boolean
}

type Props = {
    children: ReactNode
}

export const UserContext = createContext<UserContextType>({
    currentUser: null,
    isLoading: false
})

export const UserProvider = ({ children }: Props) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const value = {
        currentUser,
        isLoading
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            if (!user) {
                setCurrentUser(null)
                setIsLoading(false)
            }
            setIsLoading(true)
            setCurrentUser(user)
            setIsLoading(false)
        })
        return unsubscribe
    }, [])

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUserContext = () => useContext(UserContext)
