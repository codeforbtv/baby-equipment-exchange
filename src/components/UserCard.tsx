'use client';
//Hooks
import React, { Dispatch, SetStateAction } from 'react';
//Components
import { ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

//Styles
import '@/styles/globalStyles.css';
//Types
import { IUser } from '@/models/user';

type UserCardProps = {
    user: IUser;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
};

export default function UserCard(props: UserCardProps) {
    const { uid, email, displayName, customClaims, isDisabled, phoneNumber, organization } = props.user;
    const setIdToDisplay = props.setIdToDisplay;

    return (
        <ListItem key={uid!} sx={!isDisabled ? { background: 'white', border: '1px solid black' } : { background: 'white', border: '1px solid red' }}>
            <ListItemButton component="a" onClick={() => setIdToDisplay(uid)} sx={{}}>
                <ListItemText
                    primary={
                        <p>
                            <b>{displayName}</b> ({email})
                        </p>
                    }
                    secondary={
                        <>
                            <i>{organization?.name ?? 'None assigned'}</i>
                        </>
                    }
                    sx={{ color: 'black' }}
                />
                {isDisabled && <ListItemText primary={<p>This user requires approval</p>} sx={{ color: 'red' }}></ListItemText>}
            </ListItemButton>
        </ListItem>
    );
}
