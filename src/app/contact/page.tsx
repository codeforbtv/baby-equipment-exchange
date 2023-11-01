'use client'
//Components
import InputContainer from "@/components/InputContainer";
import ButtonContainer from "@/components/ButtonContainer";
//Hooks
import { useState } from "react";
//Styling
import globalStyles from "@/styles/globalStyles.module.css"
import styles from "./Contact.module.css"

type ContactFormData = {
    contactName: string | null,
    email: string | null,
    subject: string | null,
    message: string | null
}

export default function Contact() {
    const [formData, setFormData] = useState<ContactFormData>({ contactName: null, email: null, subject: null, message: null })


    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value }
        })
    }


    return (
        <>
            <div className={styles["contact__container"]}>
                <h1>Contact</h1>
                <h4>Send a message to the exchange administrators</h4>
                <div className={globalStyles["content__container"]}>
                    <div className={styles["contact-details__container"]}>
                        <h4 className={styles["contact__heading"]}>Address:</h4><p className={styles["contact__paragraph"]}>1205 North Ave<br />Burlington, VT 05408</p>
                    </div>
                    <div className={styles["contact-details__container"]}>
                        <h4 className={styles["contact__heading"]}>Email:</h4><p className={`${styles["contact__paragraph"]} ${styles["contact__paragraph--email"]}`}>vermontconnector@gmail.com</p>
                    </div>
                    <div className={styles["contact-details__container"]}>
                        <h4 className={styles["contact__heading"]}>Appointments:</h4><p className={styles["contact__paragraph"]}><a href="">Calendar</a></p>
                    </div>
                    <form>
                        <InputContainer for="contactName" label="Name" footnote="Required">
                            <input
                                required
                                type="text"
                                name="contactName"
                                id="contactName"
                                onChange={(e) => handleInputChange(e)}
                                value={formData.contactName ? formData.contactName : ''}
                            ></input>
                        </InputContainer>
                        <InputContainer for="email" label="Email" footnote="Required">
                            <input
                                type="text"
                                name="email"
                                id="email"
                                onChange={(e) => handleInputChange(e)}
                                value={formData.email ? formData.email : ''}
                            ></input>
                        </InputContainer>
                        <InputContainer for="subject" label="Subject" footnote="Required">
                            <input
                                type="text"
                                name="subject"
                                id="subject"
                                onChange={(e) => handleInputChange(e)}
                                value={formData.subject ? formData.subject : ''}
                            ></input>
                        </InputContainer>
                        <InputContainer for="message" label="Message" footnote="Required">
                            <textarea
                                name="message"
                                id="message"
                                rows={12}
                                placeholder="Type your message here"
                                onChange={(e) => handleInputChange(e)}
                                value={formData.message ? formData.message : ''}
                            ></textarea>
                        </InputContainer>
                        <div className={styles['form__section--bottom']}>
                            <ButtonContainer type={'submit'} text={'Submit'} hasIcon width={'45%'} />
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}