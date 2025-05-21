'use client';

//components
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PendingDontions from '@/components/PendingDonations';
import DonationForm from '@/components/DonationForm';
import { Button } from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import AddIcon from '@mui/icons-material/Add';
import Loader from '@/components/Loader';
//libs
import { addBulkDonation, addDonation } from '@/api/firebase-donations';
import { DocumentReference, doc } from 'firebase/firestore';
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

export default function Donate() {
    const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'error'>('idle');
    const [pendingDonations, setPendingDonations] = useState<DonationFormData[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const { currentUser } = useUserContext();
    const router = useRouter();

    function removePendingDonation(index: number) {
        setPendingDonations(pendingDonations.filter((donation, i) => index !== i));
    }

    async function convertPendingDonations(pendingDonations: DonationFormData[]): Promise<DonationBody[]> {
        if (currentUser == null) {
            throw new Error('Unable to access the user account.');
        }

        const userId = currentUser.uid;
        const userRef = doc(db, `${USERS_COLLECTION}/${userId}`);
        let bulkDonations: DonationBody[] = [];
        try {
            for (const donation of pendingDonations) {
                let imageRefs: DocumentReference[] = [];
                if (donation.images) {
                    imageRefs = await uploadImages(donation.images);
                }
                const newDonation = {
                    user: userRef,
                    brand: donation.brand ?? '',
                    category: donation.category ?? '',
                    model: donation.model ?? '',
                    description: donation.description ?? '',
                    images: imageRefs
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
                        {pendingDonations.length > 0 && <PendingDontions pendingDonations={pendingDonations} removeHandler={removePendingDonation} />}
                    </div>
                    <div className={styles['btn--group']}>
                        {!showForm && (
                            <Button type="button" variant="outlined" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
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
