'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import Loader from './Loader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import DonationCardMed from './DonationCardMed';
import DonationDetails from './DonationDetails';
import { Button, IconButton } from '@mui/material';
import SchedulePickup from './SchedulePickup';
import CustomDialog from './CustomDialog';
import CancelOrder from './CancelOrder';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Api
import { getOrderById, removeDonationFromOrder } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Order } from '@/types/OrdersTypes';
import { Donation } from '@/models/donation';

type ReviewOrderProps = {
    id: string;
    order?: Order;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const ReviewOrder = (props: ReviewOrderProps) => {
    const { setIdToDisplay, id, setNotificationsUpdated } = props;
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);
    const [showCancelOrder, setShowCancelOrder] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

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

    const handleRemoveFromOrder = async (orderId: string, donation: Donation): Promise<void> => {
        setIsLoading(true);
        try {
            await removeDonationFromOrder(orderId, donation);
            if (currentOrder) {
                const updatedOrder: Order = {
                    ...currentOrder,
                    items: currentOrder.items.filter((item) => item.id !== donation.id),
                    rejectedItems: !currentOrder.rejectedItems ? [donation] : [...currentOrder.rejectedItems, donation]
                };
                setCurrentOrder(updatedOrder);
                if (updatedOrder.items.length === 0) {
                    setShowCancelOrder(true);
                } else {
                    setIsDialogOpen(true);
                }
            }
        } catch (error) {
            addErrorEvent('Error removing donation from order', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async (): Promise<void> => {
        if (setNotificationsUpdated) setNotificationsUpdated(true);
        setIsDialogOpen(false);
    };

    useEffect(() => {
        fetchOrder(id);
    }, [id]);

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && currentOrder && (
                <DonationDetails
                    id={donationIdToDisplay}
                    donation={currentOrder?.items.find((i) => i.id === donationIdToDisplay)}
                    setIdToDisplay={setDonationIdToDisplay}
                />
            )}
            {showScheduler && currentOrder && (
                <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} setNotificationsUpdated={setNotificationsUpdated} />
            )}
            {showCancelOrder && currentOrder && (
                <CancelOrder
                    order={currentOrder}
                    shouldShow={setShowCancelOrder}
                    setNotificationsUpdated={setNotificationsUpdated}
                    onComplete={() => {
                        if (setIdToDisplay) setIdToDisplay(null);
                    }}
                />
            )}

            {!showScheduler && !showCancelOrder && !donationIdToDisplay && (
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
                            {currentOrder.items && currentOrder.items.length > 0 && (
                                <>
                                    <h4>Items ready for pickup</h4>
                                    {currentOrder.items.map((item) => (
                                        <DonationCardMed
                                            key={item.id}
                                            orderId={id}
                                            donation={item}
                                            setIdToDisplay={setDonationIdToDisplay}
                                            handleRemoveFromOrder={handleRemoveFromOrder}
                                        />
                                    ))}
                                </>
                            )}
                            {currentOrder.rejectedItems && currentOrder.rejectedItems.length > 0 && (
                                <>
                                    <h4>Rejected items</h4>
                                    {currentOrder.rejectedItems.map((item) => (
                                        <DonationCardMed
                                            key={item.id}
                                            orderId={id}
                                            donation={item}
                                            setIdToDisplay={setDonationIdToDisplay}
                                            handleRemoveFromOrder={handleRemoveFromOrder}
                                        />
                                    ))}
                                </>
                            )}
                            {currentOrder.items.length > 0 && (
                                <Button variant="contained" onClick={() => setShowScheduler(true)}>
                                    Schedule Pickup
                                </Button>
                            )}
                            <Button variant="outlined" color="error" onClick={() => setShowCancelOrder(true)} sx={{ marginLeft: '1rem' }}>
                                Cancel Order
                            </Button>
                        </div>
                    )}
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Order Updated" content="Donation successfully removed from order" />
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
