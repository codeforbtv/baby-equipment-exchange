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
import {
    getOrderById,
    removeDonationFromOrder
} from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Order } from '@/types/OrdersTypes';
import { Donation } from '@/models/donation';
import type { OrderItemRejectionResolution } from '@/api/firebase-donations';

type ReviewOrderProps = {
    id: string;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

type ReviewOrderView =
    | { name: 'reviewOrder' }
    | { name: 'donationDetails'; donationId: string }
    | { name: 'schedulePickup' }
    | { name: 'cancelOrder' };

const ReviewOrder = (props: ReviewOrderProps) => {
    const { setIdToDisplay, id, setNotificationsUpdated } = props;
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [view, setView] = useState<ReviewOrderView>({
        name: 'reviewOrder'
    });
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>(
        'Donation successfully removed from order'
    );

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

    const handleRemoveFromOrder = async (
        orderId: string,
        donation: Donation,
        resolution: OrderItemRejectionResolution
    ): Promise<void> => {
        setIsLoading(true);
        try {
            await removeDonationFromOrder(orderId, donation, resolution);
            const updatedOrder = await getOrderById(orderId);
            setCurrentOrder(updatedOrder);
            setNotificationsUpdated?.(true);
            if (updatedOrder.items.length === 0) {
                setView({ name: 'cancelOrder' });
            } else {
                setDialogContent(
                    resolution.action === 'available'
                        ? 'Donation returned to available inventory.'
                        : resolution.action === 'requested'
                          ? `Donation reassigned to ${resolution.requestor.name}.`
                          : 'Donation marked as unavailable.'
                );
                setIsDialogOpen(true);
            }
        } catch (error) {
            addErrorEvent('Error removing donation from order', error);
            setDialogContent('Something went wrong. Please try again.');
            setIsDialogOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async (): Promise<void> => {
        if (setNotificationsUpdated) {
            setNotificationsUpdated(true);
        }
        setIsDialogOpen(false);
    };

    const closeView = (): void => {
        setView({ name: 'reviewOrder' });
    };

    const openDonationDetails = (donationId: string): void => {
        setView({ name: 'donationDetails', donationId });
    };

    useEffect(() => {
        fetchOrder(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        <ProtectedAdminRoute>
            {view.name === 'donationDetails' && currentOrder && (
                <DonationDetails
                    id={view.donationId}
                    donation={[
                        ...currentOrder.items,
                        ...(currentOrder.rejectedItems ?? [])
                    ].find((i) => i.id === view.donationId)}
                    onClose={closeView}
                />
            )}
            {view.name === 'schedulePickup' && currentOrder && (
                <SchedulePickup
                    order={currentOrder}
                    setNotificationsUpdated={setNotificationsUpdated}
                    onClose={closeView}
                />
            )}
            {view.name === 'cancelOrder' && currentOrder && (
                <CancelOrder
                    order={currentOrder}
                    setNotificationsUpdated={setNotificationsUpdated}
                    onClose={closeView}
                    onComplete={() => {
                        if (setIdToDisplay) {
                            setIdToDisplay(null);
                        }
                    }}
                />
            )}

            {view.name === 'reviewOrder' && (
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
                                <b>Requested by:</b>{' '}
                                {currentOrder.requestor.name} (
                                {currentOrder.requestor.email})
                            </h3>
                            {currentOrder.items &&
                                currentOrder.items.length > 0 && (
                                    <>
                                        <h4>Items ready for pickup</h4>
                                        {currentOrder.items.map((item) => (
                                            <DonationCardMed
                                                key={item.id}
                                                orderId={id}
                                                donation={item}
                                                setIdToDisplay={
                                                    openDonationDetails
                                                }
                                                handleRemoveFromOrder={
                                                    handleRemoveFromOrder
                                                }
                                            />
                                        ))}
                                    </>
                                )}
                            {currentOrder.rejectedItems &&
                                currentOrder.rejectedItems.length > 0 && (
                                    <>
                                        <h4>Rejected items</h4>
                                        {currentOrder.rejectedItems.map(
                                            (item) => (
                                                <DonationCardMed
                                                    key={item.id}
                                                    orderId={id}
                                                    donation={item}
                                                    setIdToDisplay={
                                                        openDonationDetails
                                                    }
                                                />
                                            )
                                        )}
                                    </>
                                )}
                            {currentOrder.items.length > 0 && (
                                <Button
                                    variant="contained"
                                    onClick={() =>
                                        setView({ name: 'schedulePickup' })
                                    }
                                >
                                    Schedule Pickup
                                </Button>
                            )}
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setView({ name: 'cancelOrder' })}
                                sx={{ marginLeft: '1rem' }}
                            >
                                Cancel Order
                            </Button>
                        </div>
                    )}
                </>
            )}
            <CustomDialog
                isOpen={isDialogOpen}
                onClose={handleClose}
                title="Order Updated"
                content={dialogContent}
            />
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
