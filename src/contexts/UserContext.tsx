import { onAuthStateChangedListener } from '@/api/firebase'
import { User } from 'firebase/auth'
import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react'

type UserContextType = {
    currentUser: User | null
    setCurrentUser: Dispatch<SetStateAction<User>> | Dispatch<SetStateAction<null>>
}

type Props = {
    children: ReactNode
}

export const UserContext = createContext<UserContextType>({
    setCurrentUser: () => null,
    currentUser: null
})

export const UserProvider = ({ children }: Props) => {
    const [currentUser, setCurrentUser] = useState(null)
    const value = {
        currentUser,
        setCurrentUser
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((user) => {
            if (!user) setCurrentUser(user)
        })
        return unsubscribe
    }, [])

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
