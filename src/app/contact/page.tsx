'use client'
//Components
import InputContainer from "@/components/InputContainer";
//Hooks
import { useState } from "react";
//Styling
import globalStyles from "@/styles/globalStyles.module.css"
import styles from "./Contact.module.css"

type ContactFormData = {
    input1: string | null,
    input2: string | null,
    input3: string | null,
    input4: string | null
}

export default function Contact() {
    const [formData, setFormData] = useState<ContactFormData>({ input1: null, input2: null, input3: null, input4: null })


    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value }
        })
    }


    return (
        <>
            <div className={styles["contact__container"]}>
                <h1>Contact</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <h4 className={styles["contact__heading"]}>Label:</h4><p className={styles["contact__paragraph"]}>Text</p><br />
                    <h4 className={styles["contact__heading"]}>Label:</h4><p className={styles["contact__paragraph"]}>Text</p><br />
                    <h4 className={styles["contact__heading"]}>Label:</h4><p className={styles["contact__paragraph"]}>Text</p><br />
                    <InputContainer for="input1" label="Label" footnote="Footnote">
                        <input
                            type="text"
                            name="input1"
                            id="input1"
                            placeholder="Short text"
                            onChange={(e) => handleInputChange(e)}
                            value={formData.input1 ? formData.input1 : ''}
                        ></input>
                    </InputContainer>
                    <InputContainer for="input2" label="Label" footnote="Footnote">
                        <input
                            type="text"
                            name="input2"
                            id="input2"
                            placeholder="Short text"
                            onChange={(e) => handleInputChange(e)}
                            value={formData.input2 ? formData.input2 : ''}
                        ></input>
                    </InputContainer>
                    <InputContainer for="input3" label="Label" footnote="Footnote">
                        <input
                            type="text"
                            name="input3"
                            id="input3"
                            placeholder="Short text"
                            onChange={(e) => handleInputChange(e)}
                            value={formData.input3 ? formData.input3 : ''}
                        ></input>
                    </InputContainer>
                    <InputContainer for="input4" label="Label" footnote="Footnote">
                        <textarea
                            name="input4"
                            id="input4"
                            rows={12}
                            placeholder="Long text"
                            onChange={(e) => handleInputChange(e)}
                            value={formData.input4 ? formData.input4 : ''}
                        ></textarea>
                    </InputContainer>
                </div>
            </div>
        </>
    )
}