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
import { IconButton } from '@mui/material';

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

    return (
        <ProtectedAdminRoute>
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
                <>
                    <h3>
                        <b>Requested by:</b> {currentOrder.requestor.name} ({currentOrder.requestor.email})
                    </h3>
                    {currentOrder.items.map((item) => (
                        <DonationCard key={item.id} donation={item} setIdToDisplay={setIdToDisplay} />
                    ))}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default ReviewOrder;
