'use client';

import DonationDetails from '@/components/DonationDetails';

export default function DonationDetailsPage({ params }: { params: { id: string } }) {
    return <DonationDetails id={params.id} />;
}
