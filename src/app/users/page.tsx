'use client';

// Hooks
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
// Components
import { Button, List } from '@mui/material';
import SearchBar from '@/components/SearchBar';
import Filter from '@/components/Filter';
import Loader from '@/components/Loader';
import UserCard from '@/components/UserCard';
import NewUserDialog from '@/components/NewUserDialog';
import UserDetails from '@/components/UserDetails';
// Icons
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Libs
import { addErrorEvent, callListAllUsers } from '@/api/firebase';
// Styles
import styles from '@/components/Browse.module.css';
import '@/styles/globalStyles.css';
// Types
import { AuthUserRecord } from '@/types/UserTypes';
import { UserDetail } from '@/models/user-detail';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
type UserListProps = {
    users: AuthUserRecord[];
    setUsersUpdated: Dispatch<SetStateAction<boolean>>;
};

export default function Users(props: UserListProps) {
    const { users, setUsersUpdated } = props;
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);

    function toggleSearchBar() {
        setIsSearchVisible((prev: any) => !prev);
    }

    function toggleFilters() {
        setIsFilterVisible((prev: any) => !prev);
    }

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <UserDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setUsersUpdated={setUsersUpdated} />}

            {!idToDisplay && !showForm && (
                <>
                    <div className={'page--header'}>
                        <h1>Users</h1>
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
                    <div className="content--container">
                        <List className={styles['browse__grid']}>
                            {users.map((userRecord: AuthUserRecord) => {
                                return <UserCard key={userRecord.uid} authUser={userRecord} setIdToDisplay={setIdToDisplay} />;
                            })}
                        </List>
                    </div>
                </>
            )}
        </ProtectedAdminRoute>
    );
}
