'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import Loader from './Loader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import DonationCard from './DonationCard';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Order } from '@/types/OrdersTypes';
import { Button, IconButton } from '@mui/material';
import DonationCardMed from './DonationCardMed';
import DonationDetails from './DonationDetails';
import { getOrderById } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import SchedulePickup from './SchedulePickup';

type ReviewOrderProps = {
    id: string;
    order?: Order;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const ReviewOrder = (props: ReviewOrderProps) => {
    const { order, setIdToDisplay, id, setNotificationsUpdated } = props;
    const intialOrder = order ? order : null;
    const [currentOrder, setCurrentOrder] = useState<Order | null>(intialOrder);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);

    const fetchOrder = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const orderResult = await getOrderById(id);
            setCurrentOrder(orderResult);
        } catch (error) {
            addErrorEvent('Fetch order by id', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!intialOrder) fetchOrder(id);
    }, []);

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay ? (
                <DonationDetails
                    id={donationIdToDisplay}
                    donation={currentOrder?.items.find((i) => i.id === donationIdToDisplay)}
                    setIdToDisplay={setDonationIdToDisplay}
                />
            ) : (
                <>
                    {showScheduler && currentOrder ? (
                        <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} setNotificationsUpdated={setNotificationsUpdated} />
                    ) : (
                        <>
                            <div className="page--header">
                                <h2>Review Order</h2>
                                {setIdToDisplay && (
                                    <IconButton onClick={() => setIdToDisplay(null)}>
                                        <ArrowBackIcon />
                                    </IconButton>
                                )}
                            </div>
                            {isLoading && <Loader />}
                            {!isLoading && !currentOrder && <p>Order not found.</p>}
                            {!isLoading && currentOrder && (
                                <div className="content--container">
                                    <h3>
                                        <b>Requested by:</b> {currentOrder.requestor.name} ({currentOrder.requestor.email})
                                    </h3>
                                    {currentOrder.items.map((item) => (
                                        <DonationCardMed key={item.id} donation={item} setIdToDisplay={setDonationIdToDisplay} />
                                    ))}
                                    <Button variant="contained" onClick={() => setShowScheduler(true)}>
                                        Schedule Pickup
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
