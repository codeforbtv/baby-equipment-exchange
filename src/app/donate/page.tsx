'use client';

//components
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PendingDontions from '@/components/PendingDonations';
import DonationForm from '@/components/DonationForm';
import { Button, Box, TextField } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
import Loader from '@/components/Loader';
//libs
import { addBulkDonation, addDonation } from '@/api/firebase-donations';
import { DocumentReference, arrayUnion, doc } from 'firebase/firestore';
import { USERS_COLLECTION } from '@/api/firebase-users';
import { addErrorEvent, db } from '@/api/firebase';
import { DonationBody } from '@/types/post-data';
import { uploadImages } from '@/api/firebase-images';

//styles
import '../../styles/globalStyles.css';
import styles from './Donate.module.css';

export type DonationFormData = {
    category: string | null;
    brand: string | null;
    model: string | null;
    description: string | null;
    images: File[] | null | undefined;
};

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
    const [isInvalidEmail, setIsInvalidEmail] = useState<boolean>(false);
    const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [pendingDonations, setPendingDonations] = useState<DonationFormData[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const { currentUser } = useUserContext();
    const router = useRouter();

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

    function handleShowForm(event: React.SyntheticEvent) {
        if (donorEmail.length === 0 || isInvalidEmail || donorName.length === 0) {
            alert('Name and email are required to add donations.');
            return;
        } else {
            setShowForm(true);
        }
    }

    function removePendingDonation(index: number) {
        setPendingDonations(pendingDonations.filter((donation, i) => index !== i));
    }

    async function convertPendingDonations(pendingDonations: DonationFormData[]): Promise<DonationBody[]> {
        let bulkDonations: DonationBody[] = [];
        try {
            for (const donation of pendingDonations) {
                let imageURLs: string[] = [];
                if (donation.images) {
                    imageURLs = await uploadImages(donation.images);
                }
                console.log(imageURLs);
                const newDonation = {
                    donorName: donorName,
                    donorEmail: donorEmail,
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
            donationsToUpload.length > 1 ? await addBulkDonation(donationsToUpload) : await addDonation(donationsToUpload[0]);
            setPendingDonations([]);
            setSubmitState('idle');
            router.push('/');
        } catch (error) {
            setSubmitState('error');
            addErrorEvent('Bulk donation', error);
        }
    }

    return (
        <ProtectedRoute>
            {submitState === 'submitting' && <Loader />}
            {(submitState === 'idle' || submitState === 'error') && (
                <>
                    <div className="page--header">
                        <h1>Donate</h1>
                        <p>
                            Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we
                            do not accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps) or that could
                            be subject to recall (such as cribs). We ask that donors only offer items that are clean, in good working order, and not subject to
                            recall.
                        </p>
                        <p>Please reference the following web pages if you have any questions about safety/recall status of these items:</p>
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
                        </Box>
                        {pendingDonations.length > 0 && <PendingDontions pendingDonations={pendingDonations} removeHandler={removePendingDonation} />}
                    </div>
                    <div className={styles['btn--group']}>
                        {!showForm && (
                            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={handleShowForm}>
                                {pendingDonations.length > 0 ? 'Add another item' : 'Add item'}
                            </Button>
                        )}

                        {showForm && <DonationForm setPendingDonations={setPendingDonations} setShowForm={setShowForm} />}

                        {!showForm && pendingDonations.length > 0 && (
                            <Button variant="contained" size="medium" type="submit" endIcon={<UploadOutlinedIcon />} onClick={handleFormSubmit}>
                                {pendingDonations.length > 1 ? 'Submit Donations' : 'Submit Donation'}
                            </Button>
                        )}
                    </div>
                </>
            )}
        </ProtectedRoute>
    );
}
