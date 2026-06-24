'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
//Components
import Loader from './Loader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import DonationCardMed from './DonationCardMed';
import DonationCardSmall from './DonationCardSmall';
import DonationDetails from './DonationDetails';
import { Button, IconButton } from '@mui/material';
import SchedulePickup from './SchedulePickup';
import CustomDialog from './CustomDialog';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//Api
import { getOrderById, removeDonationFromOrder } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';
import sendMail from '@/api/nodemailer';
import reservedForUser from '@/email-templates/reservedForUser';
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

const ReviewOrder = (props: ReviewOrderProps) => {
    const { setIdToDisplay, id, setNotificationsUpdated } = props;
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);
    const [showScheduler, setShowScheduler] = useState<boolean>(false);
    const [showCancelOrder, setShowCancelOrder] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>('Donation successfully removed from order');

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

    const handleRemoveFromOrder = async (orderId: string, donation: Donation, resolution: OrderItemRejectionResolution): Promise<void> => {
        setIsLoading(true);
        try {
            await removeDonationFromOrder(orderId, donation, resolution);

            let reservedEmailFailed = false;
            if (resolution.action === 'requested') {
                const itemHtml = renderToString(<DonationCardSmall donation={donation} />);
                const sent = await sendMail(reservedForUser(resolution.requestor.email, resolution.requestor.name, itemHtml));
                reservedEmailFailed = !sent;
            }

            const updatedOrder = await getOrderById(orderId);
            setCurrentOrder(updatedOrder);
            setNotificationsUpdated?.(true);
            if (updatedOrder.items.length === 0) {
                setShowCancelOrder(true);
            } else {
                setDialogContent(
                    resolution.action === 'available'
                        ? 'Donation returned to available inventory.'
                        : resolution.action === 'requested'
                          ? reservedEmailFailed
                              ? `Reserved for ${resolution.requestor.name}, but the email failed to send — notify them manually.`
                              : `Reserved for ${resolution.requestor.name} — they've been emailed.`
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

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    useEffect(() => {
        fetchOrder(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const donationToDisplay =
        donationIdToDisplay && currentOrder
            ? (currentOrder.items.find((i) => i.id === donationIdToDisplay) ?? currentOrder.rejectedItems?.find((i) => i.id === donationIdToDisplay))
            : undefined;

    return (
        <ProtectedAdminRoute>
            {donationIdToDisplay && currentOrder && (
                <DonationDetails
                    id={donationIdToDisplay}
                    donation={donationToDisplay}
                    setIdToDisplay={setDonationIdToDisplay}
                />
            )}
            {showScheduler && currentOrder && (
                <SchedulePickup
                    order={currentOrder}
                    setShowScheduler={setShowScheduler}
                    setNotificationsUpdated={setNotificationsUpdated}
                    onComplete={() => {
                        setNotificationsUpdated?.(true);
                        if (setIdToDisplay) setIdToDisplay(null);
                        else setShowScheduler(false);
                    }}
                />
            )}

            {!showScheduler && !donationIdToDisplay && (
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
                                            showRemoveButton={false}
                                            rejection={currentOrder.rejections?.[item.id]}
                                        />
                                    ))}
                                </>
                            )}
                            <Button variant="contained" onClick={() => setShowScheduler(true)}>
                                {currentOrder.items.length > 0 ? 'Send Pickup Email' : 'Send Rejection Email'}
                            </Button>
                        </div>
                    )}
                </>
            )}
            <CustomDialog isOpen={isDialogOpen} onClose={handleClose} title="Order Updated" content={dialogContent} />
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
