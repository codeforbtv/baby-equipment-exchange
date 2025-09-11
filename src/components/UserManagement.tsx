'use client';
// Components
import { Button, List } from '@mui/material';
import SearchBar from './SearchBar';
import Filter from './Filter';
import Loader from './Loader';
import UserCard from './UserCard';
import NewUserDialog from './NewUserDialog';
// Hooks
import React, { useEffect, useState } from 'react';

// Icons
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Libs
import { addErrorEvent, callListAllUsers } from '../api/firebase';
// Styles
import styles from './Browse.module.css';
// Types
import { AuthUserRecord } from '@/types/UserTypes';

export default function UserManagement() {
    const [users, setUsers] = useState<AuthUserRecord[]>([]);
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [isNewUserDialogVisible, setIsNewUserDialogVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    function closeNewUserDialog() {
        setIsNewUserDialogVisible(false);
    }

    function openNewUserDialog() {
        setIsNewUserDialogVisible(true);
    }

    function toggleSearchBar() {
        setIsSearchVisible((prev: any) => !prev);
    }

    function toggleFilters() {
        setIsFilterVisible((prev: any) => !prev);
    }

    const fetchAllUsers = async (): Promise<void> => {
        try {
            const allUsers: AuthUserRecord[] = await callListAllUsers();
            setUsers(allUsers);
            setIsLoading(false);
        } catch (error) {
            addErrorEvent('Fetch all user', error);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    return isLoading ? (
        <Loader />
    ) : (
        <>
            <div>
                <div className={styles['browse__header']}>
                    <div>
                        <Button onClick={openNewUserDialog}>New User</Button>
                    </div>
                    <div className={styles['header__icons']}>
                        <div onClick={toggleSearchBar}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </div>
                        <div onClick={toggleFilters}>
                            <FontAwesomeIcon icon={faFilter} />
                        </div>
                    </div>
                </div>
                {isSearchVisible && <SearchBar />}
                {isFilterVisible && <Filter />}
                <NewUserDialog initialParameters={{ initAsOpen: isNewUserDialogVisible }} controllers={{ closeController: closeNewUserDialog }} />
                <List className={styles['browse__grid']}>
                    {users.map((userRecord: AuthUserRecord) => {
                        const uid = userRecord.uid;
                        if (uid != null) {
                            return <UserCard key={userRecord.uid} {...userRecord} />;
                        }
                    })}
                </List>
            </div>
        </>
    );
}
