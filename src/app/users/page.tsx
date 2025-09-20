'use client';

// Hooks
import React, { useEffect, useState } from 'react';
// Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import Loader from '@/components/Loader';
import Users from '@/components/Users';
//Api
import { addErrorEvent, callListAllUsers } from '@/api/firebase';
//Styles
import '@/styles/globalStyles.css';
// Types
import { AuthUserRecord } from '@/types/UserTypes';

export default function UsersPage() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<AuthUserRecord[] | null>(null);

    const fetchUsers = async (): Promise<void> => {
        setIsLoading(true);
        try {
            const usersResult = await callListAllUsers();
            setUsers(usersResult);
        } catch (error) {
            addErrorEvent('Error fetching all users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <ProtectedAdminRoute>
            <>
                {isLoading && <Loader />}
                {!isLoading && !users && <p>No users found</p>}
                {!isLoading && users && <Users users={users} />}
            </>
        </ProtectedAdminRoute>
    );
}
