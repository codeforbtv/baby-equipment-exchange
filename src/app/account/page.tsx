'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ImageThumbnail from "@/components/ImageThumbnail";
import ButtonContainer from "@/components/ButtonContainer";
import ToasterNotification from "@/components/ToasterNotification";
//Hooks
import { useState, useEffect, ReactElement } from "react";
//Libs
import { Theme } from "@/components/ButtonContainer";
//Styling
import globalStyles from "@/styles/globalStyles.module.css";
import styles from "./Account.module.css";

type AccountInformation = {
    name: string,
    username: string,
    dob: Date,
    contact: { phone: string, email: string },
    location: { streetAddress: string, city: string, state: string, zip: string },
    type: string
}

type UserDonations = {
    category: string,
    brand: string,
    model: string,
    active: boolean
}[]

const dummyDonations: UserDonations = [
    { category: 'High Chairs', brand: 'Acme', model: 'Ultra Deluxe', active: true },
    { category: 'Cribs', brand: 'Babys-r-us', model: 'Rocker 1000', active: true },
    { category: 'Strollers', brand: 'Acme', model: 'Mustang', active: false },
    { category: 'Cribs', brand: 'Fischer Price', model: 'Econoline', active: false },
    { category: 'High Chairs', brand: 'Skymall', model: 'Deluxe', active: true },
]




export default function Account() {
    const [accountDetails, setAccountDetails] = useState<AccountInformation>({
        name: 'John Doe',
        username: 'johndoe@email.com',
        dob: new Date(),
        contact: { phone: '555-555-1234', email: 'johndoe@email.com' },
        location: { streetAddress: '1234 Main Street', city: 'Burlington', state: 'VT', zip: '05401' },
        type: 'admin'
    })
    const [userDonations, setUserDonations] = useState<UserDonations>(dummyDonations);
    const dateString = `${accountDetails.dob.getMonth() + 1}/${accountDetails.dob.getDate()}/${accountDetails.dob.getFullYear()}`;

    const userDonationList = userDonations.map(donation => {
        return (<div className={styles['donations__list__item']}>
            <p>{donation.category}</p>
            <p>{donation.brand}</p>
            <p>{donation.model}</p>
            <p className={`${donation.active ? styles.active : ''}`}>{`${donation.active ? 'Active' : 'Pending'}`}</p>
        </div>)
    })

    return (
        <>
            <div className={styles["account__container"]}>
                <h1>Account</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <div className={styles["account__header"]}>
                        <h2>Account Details</h2>
                        <ButtonContainer text="Edit Account" link="/account/edit" />
                    </div>
                    <h4>Username: {accountDetails.username}</h4>
                    <h4>DOB: {dateString}</h4>
                    <h4>Contact: <br />
                        Phone: {accountDetails.contact.phone}<br />
                        Email: {accountDetails.contact.email}
                    </h4>
                    <h4>Location: <br />
                        {accountDetails.location.streetAddress}<br />
                        {accountDetails.location.city} {accountDetails.location.state}<br />
                        {accountDetails.location.zip}<br />
                    </h4>
                    <h4>Usertype: {accountDetails.type}</h4>
                    <h2>Donations:</h2>
                    <div className={styles['donations__list']}>
                        {userDonationList}
                    </div>

                </div >
            </div >
        </>
    )
}