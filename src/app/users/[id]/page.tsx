'use client';

import { addErrorEvent } from '@/api/firebase';
import { getUserDetails } from '@/api/firebase-users';
import type { UserDetails } from '@/types/UserTypes';
import { useEffect, useState } from 'react';

import '../../HomeStyles.module.css';
import Loader from '@/components/Loader';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    async function fetchUserDetails(id: string) {
        try {
            const userDetails: UserDetails = await getUserDetails(id);
            setUserDetails(userDetails);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Fetch user details', error);
        }
    }

    useEffect(() => {
        fetchUserDetails(params.id);
    }, []);

    useEffect(() => {
        console.log(userDetails);
    }, [userDetails]);

    return (
        <div className="page--header">
            <h1>User Details</h1>
            {isLoading ? <Loader /> : <div className="content--container">content</div>}
        </div>
    );
}
