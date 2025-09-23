'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
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

type ReviewOrderProps = {
    id: string;
    order?: Order;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

const ReviewOrder = (props: ReviewOrderProps) => {
    const { order, setIdToDisplay } = props;
    const intialOrder = order ? order : null;
    const [currentOrder, setCurrentOrder] = useState<Order | null>(intialOrder);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [donationIdToDisplay, setDonationIdToDisplay] = useState<string | null>(null);

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
                            <Button variant="contained">Schedule Pickup</Button>
                        </div>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
