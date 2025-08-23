'use client';

//components
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PendingDontions from '@/components/PendingDonations';
import DonationForm from '@/components/DonationForm';
import { Button, Box, TextField, Typography } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
import Loader from '@/components/Loader';
//libs
import { addBulkDonation } from '@/api/firebase-donations';
import { addErrorEvent, loginAnonymousUser } from '@/api/firebase';
import { DonationBody } from '@/types/post-data';
import { uploadImages } from '@/api/firebase-images';

//styles
import '../../styles/globalStyles.css';
import styles from './Donate.module.css';
import homeStyles from '../HomeStyles.module.css';

//Hooks
import { useUserContext } from '@/contexts/UserContext';
import { usePendingDonationsContext } from '@/contexts/PendingDonationsContext';

//Types
import { DonationFormData } from '@/types/DonationTypes';
import OrganizationForm from '@/components/OrganizationForm';

//This will be initially set from the database if editing an existing donation
const dummyDonationData: DonationFormData = {
    category: 'Option A',
    brand: 'Brand Name',
    model: 'Model Name',
    description: '',
    images: null
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Donate() {
    const [donorName, setDonorName] = useState<string>('');
    const [donorEmail, setDonorEmail] = useState<string>('');
    const [confirmEmail, setConfirmEmail] = useState<string>('');
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [emailsDoNotMatch, setEmailsDoNotMatch] = useState<boolean>(false);
    const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [showForm, setShowForm] = useState<boolean>(false);
    const { currentUser } = useUserContext();
    const { pendingDonations, removePendingDonation, clearPendingDonations, getPendingDonationsFromLocalStorage } = usePendingDonationsContext();
    const router = useRouter();

    useEffect(() => {
        getDonorFromLocalStorage();
    }, []);

    function getDonorFromLocalStorage() {
        const donorNameFromLocalStorage = localStorage.getItem('donorName');
        if (donorNameFromLocalStorage) setDonorName(donorNameFromLocalStorage);
        const donorEmailFromLocalStorage = localStorage.getItem('donorEmail');
        if (donorEmailFromLocalStorage) {
            setDonorEmail(donorEmailFromLocalStorage);
            setConfirmEmail(donorEmailFromLocalStorage);
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

    function handleShowForm(event: React.SyntheticEvent) {
        if (donorEmail.length === 0 || isInvalidEmail || donorName.length === 0) {
            alert('Name and email are required to add donations.');
            return;
        } else if (emailsDoNotMatch) {
            alert('Please confirm your email address before adding donation.');
        } else {
            localStorage.setItem('donorName', donorName);
            localStorage.setItem('donorEmail', donorEmail);
            setShowForm(true);
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
        try {
            setSubmitState('submitting');
            const donationsToUpload: DonationBody[] = await convertPendingDonations(pendingDonations);
            await addBulkDonation(donationsToUpload);
            clearPendingDonations();
            localStorage.clear();
            setSubmitState('idle');
            router.push('/');
        } catch (error) {
            setSubmitState('error');
            addErrorEvent('Bulk donation', error);
        }
    }

    return (
        <>
            {submitState === 'submitting' && <Loader />}
            {(submitState === 'idle' || submitState === 'error') && (
                <>
                    <div className={homeStyles['home--header']}>
                        <h2>Welcome to the Baby Equipment Exchange!</h2>
                    </div>
                    <div className="content--container">
                        <OrganizationForm />
                        <Typography variant="body1">
                            A 100% volunteer led initiative to provide durable equipment to families in need through partner referrals and community donations.
                        </Typography>

                        <Typography variant="body1">
                            Please see our <Link href="/about">about page</Link> for a list of currently accepted items.
                        </Typography>

                        <Typography variant="body1">
                            Are you an existing partner? Please <Link href="/login">log in</Link> or <Link href="/join">create an account</Link>.
                        </Typography>
                    </div>
                    <hr />
                    <Box className={styles['donorForm']} component="form" gap={3} display={'flex'} flexDirection={'column'} name="">
                        <TextField
                            type="text"
                            label="Name"
                            name="donorName"
                            id="donorName"
                            placeholder="Your name"
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                setDonorName(event.target.value);
                            }}
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
                            helperText={isInvalidEmail && 'Please enter a valid email addres'}
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
                    </Box>
                    {pendingDonations.length > 0 && <PendingDontions pendingDonations={pendingDonations} removeHandler={removePendingDonation} />}

                    <div className={styles['btn--group']}>
                        {!showForm && (
                            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={handleShowForm}>
                                {pendingDonations.length > 0 ? 'Add another item' : 'Add item'}
                            </Button>
                        )}

                        {showForm && <DonationForm setShowForm={setShowForm} />}

                        {!showForm && pendingDonations.length > 0 && (
                            <Button variant="contained" size="medium" type="submit" endIcon={<UploadOutlinedIcon />} onClick={handleFormSubmit}>
                                {pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                            </Button>
                        )}
                    </div>
                    <div className="content--container">
                        <Typography variant="body2">
                            Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we
                            do not accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps) or that could
                            be subject to recall (such as cribs). We ask that donors only offer items that are clean, in good working order, and not subject to
                            recall.
                        </Typography>
                        <Typography variant="body2">
                            Please reference the following web pages if you have any questions about safety/recall status of these items:
                        </Typography>
                        <ul className="page--list">
                            <li>
                                Consumer Product Safety Commission (<a href="https://www.cpsc.gov/">cpsc.gov</a>)
                            </li>
                            <li>Reseller&apos;s Guide to Selling Safer Products</li>
                            <li>
                                SaferProducts.gov (<a href="https://www.saferproducts.gov">saferproducts.gov</a>)
                            </li>
                            <li>
                                Recalls.gov (<a href="https://www.recalls.gov/">recalls.gov</a>)
                            </li>
                            <li>
                                Safercar.gov (<a href="https://www.nhtsa.gov/campaign/safercargov?redirect-safercar-sitewide">safercar.gov</a>)
                            </li>
                        </ul>
                    </div>
                </>
            )}
        </>
    );
}
