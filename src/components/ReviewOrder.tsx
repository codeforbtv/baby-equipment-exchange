'use client';

//Hooks
import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
//Components
import Loader from './Loader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import DonationCardMed from './DonationCardMed';
import DonationDetails from './DonationDetails';
import { Box, Button, IconButton } from '@mui/material';
import SchedulePickup from './SchedulePickup';
import CancelOrder from './CancelOrder';
import CustomDialog from './CustomDialog';
import { RefreshNotificationsContext } from './Notifications';
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
};

const ReviewOrder = (props: ReviewOrderProps) => {
    const { order, setIdToDisplay, id } = props;
    const refreshNotifications = useContext(RefreshNotificationsContext);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'review' | 'schedule' | 'cancel'>('review');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const setShowScheduler: Dispatch<SetStateAction<boolean>> = (val) => {
        const willShow = typeof val === 'function' ? val(activeView === 'schedule') : val;
        setActiveView(willShow ? 'schedule' : 'review');
    };

    const setShowCancelOrder: Dispatch<SetStateAction<boolean>> = (val) => {
        const willShow = typeof val === 'function' ? val(activeView === 'cancel') : val;
        setActiveView(willShow ? 'cancel' : 'review');
    };

    useEffect(() => {
        const fetchOrder = async (orderId: string): Promise<void> => {
            setIsLoading(true);
            try {
                const orderResult = await getOrderById(orderId);
                setCurrentOrder(orderResult);
            } catch (error) {
                addErrorEvent('Fetch order by id', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchOrder(id);
        }
    }, [id]);

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
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error removing donation from order', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async (): Promise<void> => {
        setIsDialogOpen(false);
        refreshNotifications();
    };

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && currentOrder && (
                <DonationDetails
                    id={donationIdToDisplay}
                    donation={currentOrder?.items.find((i) => i.id === donationIdToDisplay)}
                    setIdToDisplay={setDonationIdToDisplay}
                />
            )}
            {activeView === 'schedule' && currentOrder && <SchedulePickup order={currentOrder} setShowScheduler={setShowScheduler} />}
            {activeView === 'cancel' && currentOrder && <CancelOrder order={currentOrder} shouldShow={setShowCancelOrder} />}
            {activeView === 'review' && !donationIdToDisplay && (
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
                                            orderId={item.id}
                                            donation={item}
                                            setIdToDisplay={setDonationIdToDisplay}
                                            handleRemoveFromOrder={handleRemoveFromOrder}
                                        />
                                    ))}
                                </>
                            )}
                            <Box sx={{ marginTop: '2em' }} display={'flex'} gap={2}>
                                {currentOrder && currentOrder.items.length > 0 && (
                                    <Button variant="contained" onClick={() => setShowScheduler(true)}>
                                        Schedule Pickup
                                    </Button>
                                )}
                                <Button color="error" variant="contained" onClick={() => setShowCancelOrder(true)}>
                                    Cancel Order
                                </Button>
                            </Box>
                        </div>
                    )}
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Order Updated" content="Donation successfully removed from order" />{' '}
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
