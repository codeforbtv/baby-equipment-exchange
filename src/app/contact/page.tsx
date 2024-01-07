'use client';
//Components
import { Box, Button, TextField } from '@mui/material';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
//Hooks
import { useState } from 'react';
//Styling
import globalStyles from '@/styles/globalStyles.module.scss';
import styles from './Contact.module.css';

type ContactFormData = {
    contactName: string | null;
    email: string | null;
    subject: string | null;
    message: string | null;
};

export default function Contact() {
    const [formData, setFormData] = useState<ContactFormData>({ contactName: null, email: null, subject: null, message: null });

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) {
        setFormData((prev) => {
            return { ...prev, [e.target.name]: e.target.value };
        });
    }

    return (
        <>
            <div className={styles['contact__container']}>
                <h1>Contact</h1>
                <h4>Send a message to the exchange administrators</h4>
                <div className={globalStyles['content__container']}>
                    <Box>
                        <div className={styles['contact-details__container']}>
                            <h4 className={styles['contact__heading']}>Address:</h4>
                            <p className={styles['contact__paragraph']}>
                                1205 North Ave
                                <br />
                                Burlington, VT 05408
                            </p>
                        </div>
                        <div className={styles['contact-details__container']}>
                            <h4 className={styles['contact__heading']}>Email:</h4>
                            <p className={`${styles['contact__paragraph']} ${styles['contact__paragraph--email']}`}>vermontconnector@gmail.com</p>
                        </div>
                        <div className={styles['contact-details__container']}>
                            <h4 className={styles['contact__heading']}>Appointments:</h4>
                            <p className={styles['contact__paragraph']}>
                                <a href="">Calendar</a>
                            </p>
                        </div>
                    </Box>
                    <Box component="form" gap={3} display={'flex'} flexDirection={'column'} onSubmit={() => {}}>
                        <TextField
                            required
                            type="text"
                            label="Contact Name"
                            name="contactName"
                            id="contactName"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                            value={formData.contactName ? formData.contactName : ''}
                        ></TextField>
                        <TextField
                            type="text"
                            label="Email"
                            name="email"
                            id="email"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                            value={formData.email ? formData.email : ''}
                        ></TextField>
                        <TextField
                            type="text"
                            label="Subject"
                            name="subject"
                            id="subject"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                            value={formData.subject ? formData.subject : ''}
                        ></TextField>
                        <TextField
                            multiline={true}
                            name="message"
                            label="Message"
                            id="message"
                            minRows={12}
                            placeholder="Type your message here"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                            value={formData.message ? formData.message : ''}
                        ></TextField>
                        <div className={styles['form__section--bottom']}>
                            <Button variant="contained" type={'submit'} endIcon={<GroupsOutlinedIcon />}>
                                Submit
                            </Button>
                        </div>
                    </Box>
                </div>
            </div>
        </>
    );
}
