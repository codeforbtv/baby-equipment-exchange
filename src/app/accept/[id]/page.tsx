'use client';

//Hoooks
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import { Button, Dialog, DialogActions, DialogContent, IconButton } from '@mui/material';
import AcceptRejectCard from '@/components/AcceptRejectCard';
import DonationDetails from '@/components/DonationDetails';
import ScheduleDropOff from '@/components/ScheduleDropOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//API
import { addErrorEvent } from '@/api/firebase';
import { getDonationById, getDonationNotifications, getDonationsByBulkId } from '@/api/firebase-donations';
import { getAllCategories } from '@/api/firebase-categories';
//Styles
import '@/styles/globalStyles.css';
//types
import { Donation } from '@/models/donation';
import { Category } from '@/models/category';
import { getNotificationReturnPath } from '@/utils/notificationNavigation';

type ButtonStatus = 'accepted' | 'rejected' | null;
const ALL_PENDING_DONATIONS_ROUTE_ID = 'pending';

const getDonationSignature = (donation: Donation): string =>
    JSON.stringify({
        bulkCollection: donation.bulkCollection,
        donorEmail: donation.donorEmail,
        category: donation.category,
        brand: donation.brand,
        model: donation.model,
        description: donation.description,
        images: donation.images
    });

const AcceptDonation = ({ params }: { params: { id: string } }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donations, setDonations] = useState<Donation[] | null>(null);
    const [accepted, setAccepted] = useState<string[]>([]);
    const [rejected, setRejected] = useState<string[]>([]);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [openSecheduler, setOpenScheduler] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const router = useRouter();

    const hasSelectedDonations = accepted.length + rejected.length > 0;
    const areCategoriesLoaded = categories.length > 0;
    const validCategoryNames = useMemo(() => categories.map((category) => category.getName()), [categories]);
    const selectedDonations = useMemo(
        () => donations?.filter((donation) => accepted.includes(donation.id) || rejected.includes(donation.id)) ?? [],
        [accepted, donations, rejected]
    );
    const selectedDonorEmails = useMemo(() => Array.from(new Set(selectedDonations.map((donation) => donation.donorEmail))), [selectedDonations]);
    const hasMultipleDonorsSelected = selectedDonorEmails.length > 1;
    const quantityDonationIds = useMemo(() => {
        if (!donations) {
            return [];
        }

        const donationsBySignature = donations.reduce<Map<string, Donation[]>>((map, donation) => {
            const signature = getDonationSignature(donation);
            const currentDonations = map.get(signature) ?? [];
            map.set(signature, [...currentDonations, donation]);
            return map;
        }, new Map());

        return Array.from(donationsBySignature.values())
            .filter((donationGroup) => donationGroup.length > 1)
            .flatMap((donationGroup) => donationGroup.map((donation) => donation.id));
    }, [donations]);
    const hasQuantityDonations = quantityDonationIds.length > 1;
    const hasInvalidQuantityDonationCategory = Boolean(
        donations?.some((donation) => quantityDonationIds.includes(donation.id) && areCategoriesLoaded && !validCategoryNames.includes(donation.category))
    );
    const areAllQuantityDonationsAccepted = hasQuantityDonations && quantityDonationIds.every((id) => accepted.includes(id));
    const isAcceptAllDisabled = !areCategoriesLoaded || areAllQuantityDonationsAccepted || hasInvalidQuantityDonationCategory;
    const acceptAllButtonLabel = !areCategoriesLoaded
        ? 'Loading Categories...'
        : hasInvalidQuantityDonationCategory
          ? 'Fix Categories to Accept All'
          : 'Accept All';

    const getDonationsForAcceptId = useCallback(async (id: string): Promise<Donation[]> => {
        if (id === ALL_PENDING_DONATIONS_ROUTE_ID) {
            return getDonationNotifications();
        }

        const bulkDonations = await getDonationsByBulkId(id);
        const referenceDonation = bulkDonations[0] ?? (await getDonationById(id));
        const bulkCollection = referenceDonation.bulkCollection;
        const donorEmail = referenceDonation.donorEmail;
        if (!bulkCollection) {
            return [referenceDonation];
        }

        const donations = bulkDonations.length > 0 ? bulkDonations : await getDonationsByBulkId(bulkCollection);

        return donations.filter((donation) => donation.bulkCollection === bulkCollection && donation.donorEmail === donorEmail);
    }, []);

    const fetchDonationsByBulkId = useCallback(
        async (id: string): Promise<void> => {
            setIsLoading(true);
            try {
                const donationsResult = await getDonationsForAcceptId(id);
                const pendingDonations = donationsResult.filter((donation) => donation.status === 'in processing');

                if (pendingDonations.length === 0) {
                    alert('All items in this donation have already been processed.');
                    router.push(getNotificationReturnPath());
                    return;
                }

                setDonations(pendingDonations);
            } catch (error) {
                addErrorEvent('Fetch donations by bulk id', error);
            } finally {
                setIsLoading(false);
            }
        },
        [getDonationsForAcceptId, router]
    );
    const handleAcceptReject = useCallback((value: ButtonStatus, id: string): void => {
        if (value === 'accepted') {
            setAccepted((prev) => (prev.includes(id) ? prev : [...prev, id]));
            setRejected((prev) => prev.filter((item) => item !== id));
        } else if (value === 'rejected') {
            setRejected((prev) => (prev.includes(id) ? prev : [...prev, id]));
            setAccepted((prev) => prev.filter((item) => item !== id));
        } else if (!value) {
            //if deselected remove from both
            setAccepted((prev) => prev.filter((item) => item !== id));
            setRejected((prev) => prev.filter((item) => item !== id));
        }
    }, []);

    const handleAcceptQuantityDonations = (): void => {
        setAccepted((prev) => Array.from(new Set([...prev, ...quantityDonationIds])));
        setRejected((prev) => prev.filter((id) => !quantityDonationIds.includes(id)));
    };

    const getDonationStatus = (id: string): ButtonStatus => {
        if (accepted.includes(id)) {
            return 'accepted';
        }
        if (rejected.includes(id)) {
            return 'rejected';
        }
        return null;
    };

    const handleCategoryFixed = (donationId: string, newCategory: string) => {
        setDonations((prev) => prev && prev.map((donation) => (donation.id === donationId ? new Donation({ ...donation, category: newCategory }) : donation)));
    };

    const handleBack = (): void => {
        router.push(getNotificationReturnPath('/notifications'));
    };

    useEffect(() => {
        fetchDonationsByBulkId(params.id);
        getAllCategories()
            .then(setCategories)
            .catch((error) => addErrorEvent('Fetch categories', error));
    }, [fetchDonationsByBulkId, params.id]);

    return (
        <ProtectedAdminRoute>
            <div style={{ marginTop: '4em' }}>
                {openSecheduler ? (
                    <ScheduleDropOff
                        acceptedDonations={donations?.filter((d) => accepted.includes(d.id))}
                        rejectedDonations={donations?.filter((d) => rejected.includes(d.id))}
                        setOpenScheduler={setOpenScheduler}
                    />
                ) : (
                    <>
                        <div className="page--header">
                            <h3>Review donation</h3>
                            <IconButton aria-label="Back to notifications" onClick={handleBack}>
                                <ArrowBackIcon />
                            </IconButton>
                        </div>
                        {isLoading && !idToDisplay && <Loader />}
                        {!isLoading && !idToDisplay && !donations && <p>Donation collection not found.</p>}
                        {!isLoading && donations && (
                            <div>
                                <Dialog open={idToDisplay !== null} onClose={() => setIdToDisplay(null)} fullWidth maxWidth="xl">
                                    <DialogContent>
                                        <DonationDetails
                                            id={idToDisplay}
                                            donation={donations.find((donation) => donation.id === idToDisplay)}
                                            setIdToDisplay={setIdToDisplay}
                                        />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button variant="contained" onClick={() => setIdToDisplay(null)}>
                                            Close
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                                {donations.length > 1 && <p>Several items are included in this donation.</p>}
                                {hasQuantityDonations && (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        disabled={isAcceptAllDisabled}
                                        onClick={handleAcceptQuantityDonations}
                                        sx={{ marginBottom: '1em' }}
                                    >
                                        {acceptAllButtonLabel}
                                    </Button>
                                )}
                                {donations.map((donation) => (
                                    <AcceptRejectCard
                                        key={donation.id}
                                        donation={donation}
                                        status={getDonationStatus(donation.id)}
                                        handleAcceptReject={handleAcceptReject}
                                        setIdToDisplay={setIdToDisplay}
                                        categories={categories}
                                        onCategoryFixed={handleCategoryFixed}
                                    />
                                ))}
                                {hasMultipleDonorsSelected && <p>Select items from one donor at a time before sending an email.</p>}
                                <Button
                                    type="button"
                                    variant="contained"
                                    disabled={!hasSelectedDonations || hasMultipleDonorsSelected}
                                    onClick={() => setOpenScheduler(true)}
                                >
                                    {accepted.length === 0 ? 'Send Rejection Email' : ' Send Email'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProtectedAdminRoute>
    );
};

export default AcceptDonation;
