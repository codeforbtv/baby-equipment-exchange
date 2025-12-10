'use client';

//Hooks
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';
//components
import PendingDonations from '@/components/PendingDonations';
import DonationForm from '@/components/DonationForm';
import { Button, Box, TextField, Typography, Paper, FormControlLabel, Checkbox } from '@mui/material';
import Loader from '@/components/Loader';
import CustomDialog from '@/components/CustomDialog';
import RecallStatuses from '@/components/RecallStatuses';
//Icons
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
//libs
import { addDonation } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import { uploadImages } from '@/api/firebase-images';
import { loginAnonymousUser, signOutUser } from '@/api/firebase-users';
//Constants
import { donationDisclaimer } from '@/data/agreements';
//styles
import '@/styles/globalStyles.css';
import styles from './Donate.module.css';
//Types
import { DonationFormData, DonationBody } from '@/types/DonationTypes';
import donationsSubmitted from '@/email-templates/donationSubmitted';
import sendMail from '@/api/nodemailer';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Donate() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donorName, setDonorName] = useState<string>('');
    const [isValidName, setIsValidName] = useState<boolean>(true);
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [confirmEmail, setConfirmEmail] = useState<string>('');
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [emailsDoNotMatch, setEmailsDoNotMatch] = useState<boolean>(false);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [hasAgreed, setHasAgreed] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const { currentUser } = useUserContext();
    const { pendingDonations, removePendingDonation, clearPendingDonations, pendingDonorEmail, setPendingDonorEmail, pendingDonorName, setPendingDonorName } =
        usePendingDonationsContext();
    const router = useRouter();

    const isDisabled = emailsDoNotMatch || donorName.length === 0;

    const handleClose = () => {
        signOutUser();
        router.push('/');
        setIsDialogOpen(false);
    };

    const handleEditName = () => {
        setPendingDonorEmail('');
        setPendingDonorName('');
        localStorage.removeItem('donorEmail');
        localStorage.removeItem('donorName');
    };

    const handleSave = () => {
        localStorage.setItem('donorName', donorName);
        localStorage.setItem('donorEmail', donorEmail);
        setPendingDonorName(donorName);
        setPendingDonorEmail(donorEmail);
        //Dont open the donation form unless saving name for first time
        if (pendingDonations.length === 0) setShowForm(true);
    };

    const handleCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHasAgreed(event.target.checked);
    };

    useEffect(() => {
        getDonorFromLocalStorage();
    }, []);

    useEffect(() => {
        if (pendingDonations.length === 0 && pendingDonorEmail.length > 0) {
            setShowForm(true);
        }
    }, [pendingDonations, pendingDonorEmail]);

    function getDonorFromLocalStorage() {
        const donorNameFromLocalStorage = localStorage.getItem('donorName');
        if (donorNameFromLocalStorage) {
            setDonorName(donorNameFromLocalStorage);
            setPendingDonorName(donorNameFromLocalStorage);
        }
        const donorEmailFromLocalStorage = localStorage.getItem('donorEmail');
        if (donorEmailFromLocalStorage) {
            setDonorEmail(donorEmailFromLocalStorage);
            setConfirmEmail(donorEmailFromLocalStorage);
            setPendingDonorEmail(donorEmailFromLocalStorage);
        }
    }

    function validateEmail(email: string): void {
        if (email.length === 0 || !emailRegex.test(email)) {
            setIsInvalidEmail(true);
        } else {
            setIsInvalidEmail(false);
        }
    }

    function handleEmailInput(event: React.ChangeEvent<HTMLInputElement>): void {
        setDonorEmail(event.target.value);
        validateEmail(donorEmail);
    }

    function handleConfirmEmail(event: React.ChangeEvent<HTMLInputElement>): void {
        setConfirmEmail(event.target.value);
        if (confirmEmail.length !== 0 && event.target.value !== donorEmail) {
            setEmailsDoNotMatch(true);
        } else {
            setEmailsDoNotMatch(false);
        }
    }

    async function convertPendingDonations(pendingDonations: DonationFormData[]): Promise<DonationBody[]> {
        let bulkDonations: DonationBody[] = [];
        let anonymousUser;
        try {
            //create anonymous user if not loged in
            if (!currentUser) {
                anonymousUser = await loginAnonymousUser();
            }
            for (const donation of pendingDonations) {
                let imageURLs: string[] = [];
                if (donation.images) {
                    imageURLs = await uploadImages(donation.images);
                }
                const newDonation = {
                    donorName: donorName,
                    donorEmail: donorEmail,
                    donorId: currentUser ? currentUser.uid : anonymousUser ? anonymousUser.uid : '',
                    brand: donation.brand ?? '',
                    category: donation.category ?? '',
                    model: donation.model ?? '',
                    description: donation.description ?? '',
                    images: imageURLs
                };
                bulkDonations.push(newDonation);
            }
            return bulkDonations;
        } catch (error) {
            addErrorEvent('convertPendingDonations', error);
        }
        return Promise.reject();
    }

    //Use this to handle passing form data to the database on submission
    async function handleFormSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const donationsToUpload: DonationBody[] = await convertPendingDonations(pendingDonations);
            await addDonation(donationsToUpload, donationDisclaimer);
            clearPendingDonations();
            setPendingDonorEmail('');
            setPendingDonorName('');
            localStorage.clear();
            const emailMsg = donationsSubmitted(donorEmail, donorName, donationsToUpload);
            await sendMail(emailMsg);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting donation', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <div className="page--header">
                <Typography variant="h4" sx={{ marginTop: '1em' }}>
                    Donate
                </Typography>
            </div>
            {isLoading ? (
                <Loader />
            ) : (
                <div className={styles['donate--container']}>
                    <Typography variant="body1">
                        For a list of currently accepted items, please see our <a href="/about">about page</a>.
                    </Typography>
                    {pendingDonorEmail.length > 0 && pendingDonorName.length > 0 && (
                        <Typography variant="h6" sx={{ marginTop: '2em' }}>
                            {`Donor name: ${pendingDonorName} (${pendingDonorEmail}):`}{' '}
                            <Button variant="text" onClick={handleEditName}>
                                Edit
                            </Button>
                        </Typography>
                    )}

                    {pendingDonorName.length === 0 && pendingDonorEmail.length === 0 && (
                        <div className="content--container">
                            <Box className="form--container" component="form" gap={3} display={'flex'} flexDirection={'column'} name="">
                                <TextField
                                    type="text"
                                    label="Name"
                                    name="donorName"
                                    id="donorName"
                                    placeholder="Your name"
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                        setDonorName(event.target.value);
                                    }}
                                    onBlur={() => setIsValidName(donorName.length > 0)}
                                    error={!isValidName}
                                    helperText={!isValidName && 'Name is required'}
                                    value={donorName}
                                    required
                                />
                                <TextField
                                    type="text"
                                    label="Email"
                                    name="email"
                                    id="email"
                                    placeholder="Your email"
                                    autoComplete="email"
                                    value={donorEmail}
                                    error={isInvalidEmail}
                                    helperText={isInvalidEmail && 'Please enter a valid email address'}
                                    required
                                    onChange={handleEmailInput}
                                    onBlur={() => validateEmail(donorEmail)}
                                />
                                <TextField
                                    type="text"
                                    label="Confirm Email"
                                    name="confirmEmail"
                                    id="confirmEmail"
                                    placeholder="Confirm Email"
                                    value={confirmEmail}
                                    error={emailsDoNotMatch}
                                    helperText={emailsDoNotMatch ? 'Emails do not match.' : undefined}
                                    required
                                    onChange={handleConfirmEmail}
                                    onBlur={() => handleConfirmEmail}
                                />
                                <Button type="button" variant="contained" onClick={handleSave} disabled={isDisabled} sx={{ marginTop: '1em' }}>
                                    Save
                                </Button>
                            </Box>
                        </div>
                    )}

                    {showForm && <DonationForm setShowForm={setShowForm} />}

                    <hr />
                    {pendingDonations.length > 0 && <PendingDonations />}
                    <div className={styles['btn--group']}>
                        {!showForm && pendingDonations.length > 0 && (
                            <>
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
                                    Add another item
                                </Button>
                                <Paper variant="outlined" sx={{ marginTop: '1em', padding: '4px' }}>
                                    <Typography variant="body1">
                                        <b>{donationDisclaimer}</b>
                                    </Typography>
                                    <FormControlLabel control={<Checkbox checked={hasAgreed} onChange={handleCheck} />} label="I Agree" />
                                </Paper>
                                <Button
                                    variant="contained"
                                    size="medium"
                                    type="submit"
                                    endIcon={<UploadOutlinedIcon />}
                                    onClick={handleFormSubmit}
                                    disabled={!hasAgreed}
                                >
                                    {pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                                </Button>
                            </>
                        )}
                    </div>
                    <div className={styles['info']}>
                        <Typography variant="body2">
                            Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we
                            do not accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps). We ask that
                            donors only offer items that are clean, in good working order, and not subject to recall.
                        </Typography>
                        <RecallStatuses />
                    </div>
                </div>
            )}
            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Donation submitted"
                content={`Your donation request has been submitted, and a confirmation email has been sent to ${donorEmail}.`}
            />
        </>
    );
}
