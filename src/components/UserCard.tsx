'use client';
//Hooks
import React, { Dispatch, SetStateAction } from 'react';
//Components
import { ListItem, ListItemButton, ListItemText } from '@mui/material';

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
        <ListItem key={uid!} sx={{ background: 'white', border: '1px solid black' }}>
            <ListItemButton component="a" onClick={() => setIdToDisplay(uid)}>
                <ListItemText
                    primary={
                        <p>
                            {displayName} ({email})
                        </p>
                    }
                    secondary={
                        <p>
                            <b>Organization:</b> {organization?.name ?? 'None assigned'}
                        </p>
                    }
                    sx={{ color: 'black' }}
                />
                {isDisabled && <ListItemText primary={'This user requires approval'} sx={{ color: 'red' }}></ListItemText>}
            </ListItemButton>
        </ListItem>
    );
}
