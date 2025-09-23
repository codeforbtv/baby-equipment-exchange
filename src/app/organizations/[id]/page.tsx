'use client';

import OrganizationDetails from '@/components/OrganizationDetails';

const OrganizationDetailsPage = ({ params }: { params: { id: string } }) => {
    return <OrganizationDetails id={params.id} />;
};

export default OrganizationDetailsPage;
