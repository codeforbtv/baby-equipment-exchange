'use client';

import ReviewOrder from '@/components/ReviewOrder';

const ReviewOrderPage = ({ params }: { params: { id: string } }) => {
    return <ReviewOrder id={params.id} />;
};

export default ReviewOrderPage;
