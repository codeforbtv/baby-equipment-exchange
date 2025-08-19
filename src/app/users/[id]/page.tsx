'use client';

import { addErrorEvent } from '@/api/firebase';
import { getUserDetails } from '@/api/firebase-users';
import type { UserDetails } from '@/types/UserTypes';
import { useEffect, useState } from 'react';

import '../../HomeStyles.module.css';
import Loader from '@/components/Loader';
import { FormControl, FormLabel, List, ListItem, TextField, Typography } from '@mui/material';

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    async function fetchUserDetails(id: string): Promise<void> {
        try {
            const userDetails: UserDetails = await getUserDetails(id);
            setUserDetails(userDetails);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
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
            {isLoading && <Loader />}
            {!isLoading && userDetails === null && <p>User not found</p>}
            {!isLoading && userDetails !== null && (
                <div className="content--container">
                    <h3>{userDetails.displayName}</h3>
                    <h4>{userDetails.email}</h4>
                    <p>{userDetails.phoneNumber}</p>
                    <Typography variant="overline">Organization:</Typography>
                    <Typography variant="h4"></Typography>
                    <Typography variant="overline">Notes:</Typography>
                    <List>{userDetails.notes && userDetails.notes.map((note, i) => <ListItem key={i}>{note}</ListItem>)}</List>
                </div>
            )}
        </div>
    );
}
