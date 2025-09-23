'use client';

import UserDetails from '@/components/UserDetails';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    return <UserDetails id={params.id} />;
}
