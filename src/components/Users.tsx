'use client';

// Hooks
import React, { Dispatch, SetStateAction, useState } from 'react';
// Components
import { IconButton, List } from '@mui/material';
import SearchBar from '@/components/SearchBar';
import Filter from '@/components/Filter';
import UserCard from '@/components/UserCard';
import UserDetails from '@/components/UserDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
// Icons
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RefreshIcon from '@mui/icons-material/Refresh';
// Styles
import styles from '@/components/Browse.module.css';
import '@/styles/globalStyles.css';
// Types
import { IUser } from '@/models/user';

type UserListProps = {
    users: IUser[];
    setUsersUpdated?: Dispatch<SetStateAction<boolean>>;
    handleRefresh?: () => void;
};

export default function Users(props: UserListProps) {
    const { users, setUsersUpdated, handleRefresh } = props;
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);

    function toggleSearchBar() {
        setIsSearchVisible((prev: any) => !prev);
    }

    function toggleFilters() {
        setIsFilterVisible((prev: any) => !prev);
    }

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <UserDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setUsersUpdated={setUsersUpdated} />}

            {!idToDisplay && (
                <>
                    <div className={'page--header'}>
                        <h1>Users</h1>
                        {handleRefresh && (
                            <IconButton onClick={handleRefresh}>
                                <RefreshIcon />
                            </IconButton>
                        )}
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
                            {users.map((userRecord: IUser) => {
                                return <UserCard key={userRecord.uid} user={userRecord} setIdToDisplay={setIdToDisplay} />;
                            })}
                        </List>
                    </div>
                </>
            )}
        </ProtectedAdminRoute>
    );
}
