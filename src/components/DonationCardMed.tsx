'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
//Components
import {
    Alert,
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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
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
    helper: string;
    icon: JSX.Element;
    color: 'success' | 'primary' | 'error';
}[] = [
    {
        action: 'available',
        label: 'Return to inventory',
        helper: 'Status: available',
        icon: <Inventory2Icon />,
        color: 'success'
    },
    {
        action: 'requested',
        label: 'Reserve for a different user',
        helper: 'Status: requested',
        icon: <PersonAddAlt1Icon />,
        color: 'primary'
    },
    {
        action: 'unavailable',
        label: 'Mark as unavailable',
        helper: 'Status: unavailable',
        icon: <ReportProblemIcon />,
        color: 'error'
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
                    <DialogContent>
                        <DialogContentText id="dialog-description" sx={{ mb: 2 }}>
                            Choose what should happen to {donation.brand} - {donation.model}.
                        </DialogContentText>
                        <Alert
                            severity="info"
                            sx={{
                                width: '100%',
                                border: '1px solid',
                                borderColor: 'info.light',
                                backgroundColor: 'rgba(2, 136, 209, 0.08)'
                            }}
                        >
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Rejection reason
                            </Typography>
                            <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                                {rejectionOptions.map((option) => (
                                    <Button
                                        key={option.action}
                                        variant={rejectionAction === option.action ? 'contained' : 'outlined'}
                                        color={option.color}
                                        startIcon={option.icon}
                                        onClick={() => {
                                            setRejectionAction(option.action);
                                            if (option.action !== 'requested') setSelectedUser(null);
                                        }}
                                        sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {option.label}
                                            </Typography>
                                            <Typography variant="caption">{option.helper}</Typography>
                                        </Box>
                                    </Button>
                                ))}
                            </Box>
                            {rejectionAction === 'requested' && (
                                <Autocomplete
                                    sx={{ mt: 2, backgroundColor: 'background.paper' }}
                                    value={selectedUser}
                                    loading={isLoadingUsers}
                                    onChange={(_event: any, newValue: IUser | null) => setSelectedUser(newValue)}
                                    id={`reassign-requestor-${donation.id}`}
                                    options={availableUsers}
                                    getOptionLabel={(user) => `${user.displayName} (${user.email})`}
                                    isOptionEqualToValue={(option, value) => option.uid === value.uid}
                                    renderInput={(params) => <TextField {...params} label="New requestor" />}
                                />
                            )}
                        </Alert>
                        <DialogActions>
                            <Button
                                variant="contained"
                                onClick={() => handleRemove(orderId, donation)}
                                disabled={isSubmitting || (rejectionAction === 'requested' && !selectedUser)}
                            >
                                {isSubmitting ? 'Saving...' : 'Confirm'}
                            </Button>
                            <Button variant="outlined" onClick={() => setShowRemoveDialog(false)}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>
            )}
        </ProtectedAdminRoute>
    );
};

export default DonationCardMed;
