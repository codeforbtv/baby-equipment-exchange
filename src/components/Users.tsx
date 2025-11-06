'use client';

// Hooks
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
// Components
import { InputAdornment, List, TextField, Typography } from '@mui/material';
import SearchBar from '@/components/SearchBar';
import Filter from '@/components/Filter';
import UserCard from '@/components/UserCard';
import UserDetails from '@/components/UserDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
// Icons
import SearchIcon from '@mui/icons-material/Search';
// Styles
import styles from '@/components/Browse.module.css';
import '@/styles/globalStyles.css';
// Types
import { IUser } from '@/models/user';
import { user } from 'firebase-functions/v1/auth';

type UserListProps = {
    users: IUser[];
    setUsersUpdated?: Dispatch<SetStateAction<boolean>>;
};

export default function Users(props: UserListProps) {
    const { users, setUsersUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<IUser[]>(users);

    useEffect(() => {
        setFilteredUsers(users.filter((user) => Object.values(user).some((value) => String(value).toLowerCase().includes(searchInput.toLowerCase()))));
    }, [searchInput]);

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <UserDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setUsersUpdated={setUsersUpdated} />}

            {!idToDisplay && (
                <>
                    <div className={'page--header'}>
                        <Typography variant="h5">Users</Typography>
                    </div>
                    <TextField
                        label="Search"
                        id="search-field"
                        value={searchInput}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setSearchInput(event.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    <div className="content--container">
                        <List className={styles['browse__grid']}>
                            {filteredUsers.map((userRecord: IUser) => {
                                return <UserCard key={userRecord.uid} user={userRecord} setIdToDisplay={setIdToDisplay} />;
                            })}
                        </List>
                    </div>
                </>
            )}
        </ProtectedAdminRoute>
    );
}
