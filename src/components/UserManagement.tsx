'use client';
// Components
import { Button, List } from '@mui/material';
import SearchBar from './SearchBar';
import Filter from './Filter';
import Loader from './Loader';
import UserCard from './UserCard';
// Hooks
import React, { useEffect, useState } from 'react';
// Types
import { UserCardProps } from '@/types/post-data';
// Icons
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Libs
import { getAllUsers } from '../api/firebase';
import { getAllUserAccounts } from '@/api/firebase-users';
// Styles
import styles from './Browse.module.css';
import NewUserDialog from './NewUserDialog';
import { UserRecord } from 'firebase-admin/auth';

export default function UserManagement() {
    const [users, setUsers] = useState<UserCardProps[]>([]);
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

    useEffect(() => {
        (async () => {
            try {
                const allUsers: UserCardProps[] = await getAllUsers();
                setUsers(allUsers);
                setIsLoading(false);
            } catch (error) {
                //eslint-disable-line no-empty
            }
        })();
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
                    {users.map((userRecord: UserCardProps) => {
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
