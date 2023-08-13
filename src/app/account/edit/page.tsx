'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ButtonContainer from "@/components/ButtonContainer";
import ToasterNotification from "@/components/ToasterNotification";
//Hooks
import { useState, useEffect, ReactElement } from "react";
//Libs
import { Theme } from "@/components/ButtonContainer";
//Styling
import globalStyles from "@/styles/globalStyles.module.css";
import styles from "./AccountEdit.module.css";

type AccountInformation = {
    name: string,
    username: string,
    dob: Date,
    contact: { phone: string, email: string },
    location: { streetAddress: string, city: string, state: string, zip: string },
    type: string
}



export default function EditAccount() {
    const [accountDetails, setAccountDetails] = useState<AccountInformation>({
        name: 'John Doe',
        username: 'johndoe@email.com',
        dob: new Date(),
        contact: { phone: '555-555-1234', email: 'johndoe@email.com' },
        location: { streetAddress: '1234 Main Street', city: 'Burlington', state: 'VT', zip: '05401' },
        type: 'admin'
    })
    const dateString = `${accountDetails.dob.getMonth() + 1}/${accountDetails.dob.getDate()}/${accountDetails.dob.getFullYear()}`;

    return (
        <>
            <div className={styles["account__container"]}>
                <h1>Edit Account</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <form id="editAccount">

                        <div className={styles["account__header"]}>
                            <h2>Account Details</h2>
                        </div>
                        <h4>Username: {accountDetails.username}</h4>
                        <h4>Usertype: {accountDetails.type}</h4>
                        <h4>Contact:</h4>
                        <InputContainer for="contact-phone" label="Phone Number" footnote="Footnote">
                            <input type="tel" name="contact-phone" id="contact-phone" />
                        </InputContainer>
                        <InputContainer for="contact-email" label="Email" footnote="Footnote">
                            <input type="email" name="contact-email" id="contact-email" />
                        </InputContainer>
                        <InputContainer for="dob" label="Birthdate" footnote="Footnote">
                            <input type="date" name="dob" id="dob" />
                        </InputContainer>
                        <h4>Location: </h4>
                        <InputContainer for="location-street" label="Street Address" footnote="Footnote">
                            <input type="text" name="location-street" id="location-street" />
                        </InputContainer>
                        <InputContainer for="location-city" label="City" footnote="Footnote">
                            <input type="text" name="location-city" id="location-city" />
                        </InputContainer>
                        <InputContainer for="location-state" label="State" footnote="Footnote">
                            <input type="text" name="location-state" id="location-state" />
                        </InputContainer>
                        <InputContainer for="location-zip" label="Zip Code" footnote="Footnote">
                            <input type="text" name="location-zip" id="location-zip" />
                        </InputContainer>
                        <ButtonContainer text="Save" type="submit" hasIcon />
                    </form>

                </div >
            </div >
        </>
    )
}