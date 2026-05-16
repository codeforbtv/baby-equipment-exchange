'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
//Components
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Typography
} from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
//Icons
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import BlockIcon from '@mui/icons-material/Block';
//Api
import { addErrorEvent } from '@/api/firebase';
import { getAllActiveDbUsers } from '@/api/firebase-users';
//Styles
import '@/styles/globalStyles.css';
//types
import { Donation } from '@/models/donation';
import { IUser } from '@/models/user';
import type { OrderItemRejectionResolution } from '@/api/firebase-donations';

type DonationCardMedProps = {
    orderId?: string;
    donation: Donation;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    handleRemoveFromOrder?: (orderId: string, donation: Donation, resolution: OrderItemRejectionResolution) => Promise<void>;
};

type RejectionAction = OrderItemRejectionResolution['action'];

const rejectionOptions: {
    action: RejectionAction;
    label: string;
    description: string;
    icon: JSX.Element;
}[] = [
    {
        action: 'available',
        label: 'Return to inventory',
        description: 'Item becomes available for other requests',
        icon: <Inventory2Icon fontSize="small" />
    },
    {
        action: 'requested',
        label: 'Reserve for someone else',
        description: 'Reassign this item to a different user',
        icon: <PersonAddAlt1Icon fontSize="small" />
    },
    {
        action: 'unavailable',
        label: 'Mark as unavailable',
        description: 'Remove item from circulation',
        icon: <BlockIcon fontSize="small" />
    }
];

const DonationCardMed = (props: DonationCardMedProps) => {
    const { orderId, donation, setIdToDisplay, handleRemoveFromOrder } = props;
    const [showRemoveDialog, setShowRemoveDialog] = useState<boolean>(false);
    const [rejectionAction, setRejectionAction] = useState<RejectionAction>('available');
    const [activeUsers, setActiveUsers] = useState<IUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [hasLoadedUsers, setHasLoadedUsers] = useState<boolean>(false);

    const availableUsers = useMemo(() => activeUsers.filter((user) => user.uid !== donation.requestor?.id), [activeUsers, donation.requestor?.id]);

    const handleRemove = async (id: string, donation: Donation) => {
        if (!handleRemoveFromOrder) return;

        let resolution: OrderItemRejectionResolution;
        if (rejectionAction === 'requested') {
            if (!selectedUser) return;
            resolution = {
                action: 'requested',
                requestor: {
                    id: selectedUser.uid,
                    name: selectedUser.displayName,
                    email: selectedUser.email
                }
            };
        } else {
            resolution = { action: rejectionAction };
        }

        setIsSubmitting(true);
        try {
            await handleRemoveFromOrder(id, donation, resolution);
            setShowRemoveDialog(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!showRemoveDialog || hasLoadedUsers || isLoadingUsers) return;

        const fetchActiveUsers = async () => {
            setIsLoadingUsers(true);
            try {
                const users = await getAllActiveDbUsers();
                setActiveUsers(users);
            } catch (error) {
                addErrorEvent('Fetch users for rejected item reassignment', error);
            } finally {
                setHasLoadedUsers(true);
                setIsLoadingUsers(false);
            }
        };

        fetchActiveUsers();
    }, [hasLoadedUsers, isLoadingUsers, showRemoveDialog]);

    return (
        <ProtectedAdminRoute>
            <Card className="card--container" raised>
                <CardActions className="card--container-image" onClick={() => setIdToDisplay(donation.id)}>
                    {donation.images && donation.images.length > 0 && <CardMedia component="img" alt={donation.model} image={donation.images[0]} />}
                </CardActions>
                <CardContent>
                    <Typography variant="h5">
                        {donation.brand} - {donation.model}
                    </Typography>
                    <Typography variant="h6">{donation.tagNumber}</Typography>
                </CardContent>

                {handleRemoveFromOrder && orderId && (
                    <CardActions>
                        <Button variant="contained" startIcon={<RemoveShoppingCartIcon />} color="error" onClick={() => setShowRemoveDialog(true)}>
                            Reject
                        </Button>
                    </CardActions>
                )}
            </Card>
            {handleRemoveFromOrder && orderId && (
                <Dialog
                    open={showRemoveDialog}
                    onClose={() => setShowRemoveDialog(false)}
                    aria-labelledby="dialog-title"
                    aria-describedby="dialog-description"
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle id="dialog-title">Reject Item</DialogTitle>
                    <DialogContent sx={{ pb: 1, overflowX: 'hidden' }}>
                        <DialogContentText id="dialog-description" sx={{ mb: 2.5 }}>
                            What should happen to <strong>{donation.brand} &ndash; {donation.model}</strong>?
                        </DialogContentText>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {rejectionOptions.map((option) => {
                                const selected = rejectionAction === option.action;
                                return (
                                    <Box
                                        key={option.action}
                                        onClick={() => {
                                            setRejectionAction(option.action);
                                            if (option.action !== 'requested') setSelectedUser(null);
                                        }}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1.5,
                                            borderRadius: 1,
                                            border: '2px solid',
                                            borderColor: selected ? 'primary.main' : 'divider',
                                            backgroundColor: selected ? 'primary.50' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                                borderColor: selected ? 'primary.main' : 'action.hover',
                                                backgroundColor: selected ? 'primary.50' : 'action.hover'
                                            }
                                        }}
                                    >
                                        <Box sx={{ color: selected ? 'primary.main' : 'text.secondary', display: 'flex' }}>
                                            {option.icon}
                                        </Box>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={selected ? 600 : 500}>
                                                {option.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                        {rejectionAction === 'requested' && (
                            <Autocomplete
                                sx={{ mt: 2 }}
                                value={selectedUser}
                                loading={isLoadingUsers}
                                onChange={(_event: any, newValue: IUser | null) => setSelectedUser(newValue)}
                                id={`reassign-requestor-${donation.id}`}
                                options={availableUsers}
                                getOptionLabel={(user) => `${user.displayName} (${user.email})`}
                                isOptionEqualToValue={(option, value) => option.uid === value.uid}
                                renderInput={(params) => <TextField {...params} label="Select user" size="small" />}
                            />
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowRemoveDialog(false)}
                            sx={{ textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleRemove(orderId, donation)}
                            disabled={isSubmitting || (rejectionAction === 'requested' && !selectedUser)}
                            sx={{ textTransform: 'none' }}
                        >
                            {isSubmitting ? 'Saving…' : 'Confirm rejection'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </ProtectedAdminRoute>
    );
};

export default DonationCardMed;
