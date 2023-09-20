'use client'
//Components
import InputContainer from '@/components/InputContainer'
import ButtonContainer from '@/components/ButtonContainer'
import ProtectedRoute from '@/components/ProtectedRoute'
//Hooks
import { useEffect, useState } from 'react'
//Models
import { AccountInformation as AccountInfo } from '@/types/post-data'
//Styling
import globalStyles from '@/styles/globalStyles.module.css'
import styles from './AccountEdit.module.css'
import { getAccountType } from '@/api/firebase'
import { getUserAccount, setUserAccount } from '@/api/firebase-users'

type AccountFormData = {
    name: string | null
    username: string | null
    contactEmail: string | null
    contactPhone: string | null
    locationStreet: string | null
    locationCity: string | null
    locationState: string | null
    locationZip: string | null
    type: string | null
}

export default function EditAccount() {
    const [accountType, setAccountType] = useState<string>('')


    useEffect(() => {
        getAccountType().then((acctType) => {
            setAccountType(acctType!)
        })
    }, [])

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

    const [formData, setFormData] = useState<AccountFormData>({
        name: accountInfo.name,
        username: accountInfo.contact?.email ?? '',
        contactEmail: accountInfo.contact?.email ?? '',
        contactPhone: accountInfo.contact?.phone ?? '',
        locationStreet: accountInfo.location?.line_1 ?? '',
        locationCity: accountInfo.location?.city ?? '',
        locationState: accountInfo.location?.state ?? '',
        locationZip: accountInfo.location?.zipcode ?? '',
        type: accountType
    })

    useEffect(() => {
        (async () => {
            const accountInfo = await getUserAccount()

            setAccountInfo(accountInfo)

            setFormData({
                name: accountInfo.name,
                username: accountInfo.contact?.email ?? '',
                contactEmail: accountInfo.contact?.email ?? '',
                contactPhone: accountInfo.contact?.phone ?? '',
                locationStreet: accountInfo.location?.line_1 ?? '',
                locationCity: accountInfo.location?.city ?? '',
                locationState: accountInfo.location?.state ?? '',
                locationZip: accountInfo.location?.zipcode ?? '',
                type: accountType
            })
        })()
    }, [])

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value }
        })
    }

    //Use this to handle passing form data to the database on submission
    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        //const submittedData = new FormData(e.currentTarget)
        setUserAccount({
            ...accountInfo,
            contact: {
                name: formData.name,
                user: accountInfo.contact?.user,
                email: formData.contactEmail,
                notes: accountInfo.contact?.notes,
                phone: formData.contactPhone,
                website: accountInfo.contact?.website
            },
            location: {
                line_1: formData.locationStreet,
                line_2: accountInfo.location?.line_2,
                city: formData.locationCity,
                state: formData.locationState,
                zipcode: formData.locationZip,
                latitude: accountInfo.location?.latitude,
                longitude: accountInfo.location?.longitude
            }
        })
    }

    return (
        <ProtectedRoute>
            <div className={styles['account__container']}>
                <h1>Edit Account</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles['content__container']}>
                    <div className={styles['account__header']}>
                        <h2>Account Details</h2>
                    </div>
                    <h4>Username: {accountInfo.contact?.email}</h4>
                    <h4>Usertype: {accountType}</h4>
                    <form className={styles['form']} id="editAccount" onSubmit={handleFormSubmit}>
                        <div className={styles['form__section--right']}>
                            <h4>Contact:</h4>
                            <InputContainer for="contactEmail" label="Email" footnote="Footnote">
                                <input
                                    type="email"
                                    name="contactEmail"
                                    id="contactEmail"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.contactEmail ? formData.contactEmail : ''}
                                />
                            </InputContainer>
                            <InputContainer for="contactPhone" label="Phone Number" footnote="Footnote">
                                <input
                                    type="tel"
                                    name="contactPhone"
                                    id="contactPhone"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.contactPhone ? formData.contactPhone : ''}
                                />
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--left']}>
                            <h4>Location: </h4>
                            <InputContainer for="locationStreet" label="Street Address" footnote="Footnote">
                                <input
                                    type="text"
                                    name="locationStreet"
                                    id="locationStreet"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.locationStreet ? formData.locationStreet : ''}
                                />
                            </InputContainer>
                            <InputContainer for="locationCity" label="City" footnote="Footnote">
                                <input
                                    type="text"
                                    name="locationCity"
                                    id="locationCity"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.locationCity ? formData.locationCity : ''}
                                />
                            </InputContainer>
                            <InputContainer for="locationState" label="State" footnote="Footnote">
                                <input
                                    type="text"
                                    name="locationState"
                                    id="locationState"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.locationState ? formData.locationState : ''}
                                />
                            </InputContainer>
                            <InputContainer for="locationZip" label="Zip Code" footnote="Footnote">
                                <input
                                    type="text"
                                    name="locationZip"
                                    id="locationZip"
                                    onChange={(event) => handleInputChange(event)}
                                    value={formData.locationZip ? formData.locationZip : ''}
                                />
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--bottom']}>
                            <ButtonContainer text="Save" type="submit" hasIcon />
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    )
}
