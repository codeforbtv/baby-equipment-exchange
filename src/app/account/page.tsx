'use client'
//Components
import ButtonContainer from "@/components/ButtonContainer";
//Hooks
import { useState} from "react";
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

//This will initially be fetched from the DB
const dummyUser: AccountInformation = {
    name: 'John Doe',
    username: 'johndoe@email.com',
    dob: new Date(),
    contact: { phone: '555-555-1234', email: 'johndoe@email.com' },
    location: { streetAddress: '1234 Main Street', city: 'Burlington', state: 'VT', zip: '05401' },
    type: 'admin'
}

type UserDonations = {
    category: string,
    brand: string,
    model: string,
    active: boolean
}[]

//Temporary holder for dummy data - to be updated with database link
const dummyDonations: UserDonations = [
    { category: 'High Chairs', brand: 'Acme', model: 'Ultra Deluxe', active: true },
    { category: 'Cribs', brand: 'Babys-r-us', model: 'Rocker 1000', active: true },
    { category: 'Strollers', brand: 'Acme', model: 'Mustang', active: false },
    { category: 'Cribs', brand: 'Fischer Price', model: 'Econoline', active: false },
    { category: 'High Chairs', brand: 'Skymall', model: 'Deluxe', active: true },
]


export default function Account() {
    const dateString = `${dummyUser.dob.getMonth() + 1}/${dummyUser.dob.getDate()}/${dummyUser.dob.getFullYear()}`;
    const [userDonations, setUserDonations] = useState<UserDonations>(dummyDonations);

    const userDonationList = userDonations.map((donation, index) => {
        return (<div key={index} className={styles['donations__list__item']}>
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
                    <h4>Username: {dummyUser.username}</h4>
                    <h4>DOB: {dateString}</h4>
                    <h4>Contact: <br />
                        Phone: {dummyUser.contact.phone}<br />
                        Email: {dummyUser.contact.email}
                    </h4>
                    <h4>Location: <br />
                        {dummyUser.location.streetAddress}<br />
                        {dummyUser.location.city} {dummyUser.location.state}<br />
                        {dummyUser.location.zip}<br />
                    </h4>
                    <h4>Usertype: {dummyUser.type}</h4>
                    <h2>Donations:</h2>
                    <div className={styles['donations__list']}>
                        {userDonationList}
                    </div>

                </div >
            </div >
        </>
    )
}