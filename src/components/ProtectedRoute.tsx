'use client'
//Components
import Loader from './Loader'
//hooks
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUserContext } from '@/contexts/UserContext'
//Styling
import globalStyles from '@/styles/globalStyles.module.scss'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, isLoading } = useUserContext()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.push('/login')
        }
    }, [currentUser, isLoading])

    if (isLoading) {
        return (
            <div className={globalStyles['content__container']}>
                <Loader />
            </div>
        )
    }

    if (currentUser) return <div>{children}</div>
}
