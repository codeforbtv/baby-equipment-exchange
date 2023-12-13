'use client';
// Components
import { Button, ImageList } from '@mui/material';
import SearchBar from './SearchBar';
import Filter from './Filter';
import Loader from './Loader';
import UserCard from './UserCard';
// Hooks
import React, { useEffect, useState } from 'react';
// Types
import { AccountInformation } from '@/types/post-data';
// Icons
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Libs
import { getAllUserAccounts } from '@/api/firebase-users';
// Styles
import styles from './Browse.module.css';

export default function UserManagement() {
    const [currentUser, setCurrentuser] = useState();
    const [users, setUsers] = useState<AccountInformation[]>([]);
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
                const allUsers = await getAllUserAccounts();
                setUsers(allUsers);
                setIsLoading(false);
            } catch (error) {
                //eslint-disable-line no-empty
            }
        })();
    });

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
                <ImageList className={styles['browse__grid']}>
                    {users.map((userAccountInformation: AccountInformation) => {
                        const userId = userAccountInformation.contact?.user?.id;
                        if (userId != null) {
                            return (
                                <UserCard
                                    key={userId}
                                    name={userAccountInformation.name}
                                    contact={userAccountInformation.contact}
                                    location={userAccountInformation.location}
                                    photo={userAccountInformation.photo as string}
                                />
                            );
                        }
                    })}
                </ImageList>
            </div>
        </>
    );
}
