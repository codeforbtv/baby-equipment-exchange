'use client';

//Hooks
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import Loader from '@/components/Loader';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import ScheduleDropOff from '@/components/ScheduleDropOff';
//Contexts
import { UserContext } from '@/contexts/UserContext';
//Api
import { addErrorEvent } from '@/api/firebase';
import { getDonationById } from '@/api/firebase-donations';
//Styles
import '../../../styles/globalStyles.css';
//Types
import { Donation } from '@/models/donation';

export default function ScheduleDropoff({ params }: { params: { id: string } }) {
    const { isAdmin } = useContext(UserContext);
    const router = useRouter();
    const [donation, setDonation] = useState<Donation | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/');
        }
    }, [isAdmin, router]);

    useEffect(() => {
        if (!isAdmin) return;

        const fetchDonation = async () => {
            setIsLoading(true);
            try {
                const donationResult = await getDonationById(params.id);
                setDonation(donationResult);
            } catch (error) {
                addErrorEvent('Fetch donation for scheduling', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDonation();
    }, [isAdmin, params.id]);

    if (!isAdmin) return null;

    return (
        <ProtectedAdminRoute>
            {isLoading && <Loader />}
            {!isLoading && !donation && <p>Donation not found.</p>}
            {!isLoading && donation && <ScheduleDropOff acceptedDonations={[donation]} setOpenScheduler={() => router.push('/')} />}
        </ProtectedAdminRoute>
    );
}
