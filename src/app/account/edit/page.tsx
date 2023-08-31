'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ButtonContainer from "@/components/ButtonContainer";
//Hooks
import { useState } from "react";
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

//This will initially be fetched from the DB
const dummyUser: AccountInformation = {
    name: 'John Doe',
    username: 'johndoe@email.com',
    dob: new Date(),
    contact: { phone: '555-555-1234', email: 'johndoe@email.com' },
    location: { streetAddress: '1234 Main Street', city: 'Burlington', state: 'VT', zip: '05401' },
    type: 'admin'
}

type AccountFormData = {
    name: string | null,
    username: string | null,
    dob: string | null,
    contactEmail: string | null,
    contactPhone: string | null,
    locationStreet: string | null,
    locationCity: string | null,
    locationState: string | null,
    locationZip: string | null,
    type: string | null,
}


export default function EditAccount() {
    const formattedUserDob = `${dummyUser.dob.getFullYear()}-${(dummyUser.dob.getMonth() + 1).toString().padStart(2, '0')}-${dummyUser.dob.getDate().toString().padStart(2, '0')}`;
    const [formData, setFormData] = useState<AccountFormData>({
        name: dummyUser.name,
        username: dummyUser.username,
        dob: formattedUserDob,
        contactEmail: dummyUser.contact.email,
        contactPhone: dummyUser.contact.phone,
        locationStreet: dummyUser.location.streetAddress,
        locationCity: dummyUser.location.city,
        locationState: dummyUser.location.state,
        locationZip: dummyUser.location.zip,
        type: dummyUser.type
    });

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormData(prev => {
            return { ...prev, [e.target.name]: e.target.value }
        })
    }

    //Use this to handle passing form data to the database on submission
    function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        let submittedData = new FormData(e.currentTarget);
    }


    return (
        <>
            <div className={styles["account__container"]}>
                <h1>Edit Account</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <div className={styles["account__header"]}>
                        <h2>Account Details</h2>
                    </div>
                    <h4>Username: {dummyUser.username}</h4>
                    <h4>Usertype: {dummyUser.type}</h4>
                    <form className={styles['form']} id="editAccount" onSubmit={handleFormSubmit}>
                        <div className={styles['form__section--right']}>
                            <h4>Contact:</h4>
                            <InputContainer for="contactEmail" label="Email" footnote="Footnote">
                                <input type="email" name="contactEmail" id="contactEmail" onChange={(event) => handleInputChange(event)} value={formData.contactEmail ? formData.contactEmail : ''} />
                            </InputContainer>
                            <InputContainer for="contactPhone" label="Phone Number" footnote="Footnote">
                                <input type="tel" name="contactPhone" id="contactPhone" onChange={(event) => handleInputChange(event)} value={formData.contactPhone ? formData.contactPhone : ''} />
                            </InputContainer>
                            <InputContainer for="dob" label="Birthdate" footnote="Footnote">
                                <input type="date" name="dob" id="dob" onChange={(event) => handleInputChange(event)} value={formData.dob ? formData.dob : ''} />
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--left']}>
                            <h4>Location: </h4>
                            <InputContainer for="locationStreet" label="Street Address" footnote="Footnote">
                                <input type="text" name="locationStreet" id="locationStreet" onChange={(event) => handleInputChange(event)} value={formData.locationStreet ? formData.locationStreet : ''} />
                            </InputContainer>
                            <InputContainer for="locationCity" label="City" footnote="Footnote">
                                <input type="text" name="locationCity" id="locationCity" onChange={(event) => handleInputChange(event)} value={formData.locationCity ? formData.locationCity : ''} />
                            </InputContainer>
                            <InputContainer for="locationState" label="State" footnote="Footnote">
                                <input type="text" name="locationState" id="locationState" onChange={(event) => handleInputChange(event)} value={formData.locationState ? formData.locationState : ''} />
                            </InputContainer>
                            <InputContainer for="locationZip" label="Zip Code" footnote="Footnote">
                                <input type="text" name="locationZip" id="locationZip" onChange={(event) => handleInputChange(event)} value={formData.locationZip ? formData.locationZip : ''} />
                            </InputContainer>
                        </div>
                        <div className={styles['form__section--bottom']}>
                            <ButtonContainer text="Save" type="submit" hasIcon />
                        </div>
                    </form>

                </div >
            </div >
        </>
    )
}