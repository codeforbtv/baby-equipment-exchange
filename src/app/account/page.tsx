'use client'
//Components
import Link from 'next/link'
import ButtonContainer from '@/components/ButtonContainer'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@mui/material'
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
//Hooks
import { useEffect, useState } from 'react'
import { useUserContext } from '@/contexts/UserContext'
//Models
import { AccountInformation as AccountInfo } from '@/types/post-data'
//Styling
import globalStyles from '@/styles/globalStyles.module.scss'
import styles from './Account.module.css'
import { getAccountType } from '@/api/firebase'
import { getUserAccount } from '@/api/firebase-users'

type UserDonations = {
    category: string
    brand: string
    model: string
    active: boolean
}[]

//Temporary holder for dummy data - to be updated with database link
const dummyDonations: UserDonations = [
    { category: 'High Chairs', brand: 'Acme', model: 'Ultra Deluxe', active: true },
    { category: 'Cribs', brand: 'Babys-r-us', model: 'Rocker 1000', active: true },
    { category: 'Strollers', brand: 'Acme', model: 'Mustang', active: false },
    { category: 'Cribs', brand: 'Fischer Price', model: 'Econoline', active: false },
    { category: 'High Chairs', brand: 'Skymall', model: 'Deluxe', active: true }
]

export default function Account() {
    const [accountType, setAccountType] = useState<string>('')
    const [userDonations, setUserDonations] = useState<UserDonations>(dummyDonations)
    const { currentUser } = useUserContext()
    const [accountInfo, setAccountInfo] = useState<AccountInfo>({
        name: '',
        contact: {
            user: undefined,
            name: undefined,
            email: undefined,
            phone: undefined,
            website: undefined,
            notes: undefined
        },
        location: {
            line_1: undefined,
            line_2: undefined,
            city: undefined,
            state: undefined,
            zipcode: undefined,
            latitude: undefined,
            longitude: undefined
        },
        photo: undefined
    })

    useEffect(() => {
        (async () => {
            if (currentUser) {
                try {
                    const accountInfo = await getUserAccount()
                    setAccountInfo(accountInfo)
                } catch (error) {
                    // eslint-disable-line no-empty
                }
            }
        })()
    }, [])

    useEffect(() => {
        getAccountType()
            .then((acctType) => {
                setAccountType(acctType!)
            })
            .catch((_reason: any) => {
                setAccountType('(unavailable)')
            })
    }, [])

    const userDonationList = userDonations.map((donation, index) => {
        return (
            <div key={index} className={styles['donations__list__item']}>
                <p>{donation.category}</p>
                <p>{donation.brand}</p>
                <p>{donation.model}</p>
                <p className={`${donation.active ? styles.active : ''}`}>{`${donation.active ? 'Active' : 'Pending'}`}</p>
            </div>
        )
    })

    return (
        <ProtectedRoute>
            <div className={styles['account__container']}>
                <h1>Account</h1>
                <h4>[Page Summary]</h4>
                <div className={globalStyles['content__container']}>
                    <div className={styles['account__header']}>
                        <h2>Account Details</h2>
                        <div>
                            <Button component={Link} href="/account/edit" variant="contained" endIcon={<PermIdentityOutlinedIcon />}>Edit Profile</Button>
                        </div>
                    </div>
                    <h4>Usertype: {accountType}</h4>
                    <h4>Display name {accountInfo.contact?.name}</h4>
                    <h4>
                        Contact: <br />
                        Phone: {accountInfo.contact?.phone}
                        <br />
                        Email: {accountInfo.contact?.email}
                    </h4>
                    <h4>
                        Location: <br />
                        {accountInfo.location?.line_1}
                        <br />
                        {accountInfo.location?.city} {accountInfo.location?.state}
                        <br />
                        {accountInfo.location?.zipcode}
                        <br />
                    </h4>
                    
                    <h2>Donations:</h2>
                    <div className={styles['donations__list']}>{userDonationList}</div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
