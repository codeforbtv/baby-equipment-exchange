'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
//Components
import {
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
    Typography
} from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
//Icons
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
//Styles
import '@/styles/globalStyles.css';
const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};
//types
import { Donation } from '@/models/donation';

type DonationCardMedProps = {
    orderId: string;
    donation: Donation;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    handleRemoveFromOrder: (orderId: string, donation: Donation) => Promise<void>;
};

const DonationCardMed = (props: DonationCardMedProps) => {
    const { orderId, donation, setIdToDisplay, handleRemoveFromOrder } = props;
    const [showRemoveDialog, setShowRemoveDialog] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleRemove = async (id: string, donation: Donation) => {
        await handleRemoveFromOrder(id, donation);
    };

    return (
        <ProtectedAdminRoute>
            <Card className="card--container">
                <CardActions onClick={() => setIdToDisplay(donation.id)}>
                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                    <CardContent>
                        <Typography variant="h3">{donation.model}</Typography>
                        <Typography variant="h4">{donation.brand}</Typography>
                        <Typography variant="h5">Description: {donation.description}</Typography>
                    </CardContent>
                </CardActions>
                <CardActions>
                    <Button variant="contained" startIcon={<RemoveShoppingCartIcon />} color="error" onClick={() => setShowRemoveDialog(true)}>
                        Remove
                    </Button>
                </CardActions>
            </Card>
            {/* confirm remove dialog */}
            <Dialog open={showRemoveDialog} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                <DialogTitle id="dialog-title">Remove Donation?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will remove {donation.model + ' ' + donation.brand} from this order and return it to inventory. Are you sure?
                    </DialogContentText>
                    <DialogActions>
                        <Button variant="contained" onClick={() => handleRemove(orderId, donation)}>
                            Confirm
                        </Button>
                        <Button variant="outlined" onClick={() => setShowRemoveDialog(false)}>
                            Cancel
                        </Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </ProtectedAdminRoute>
    );
};

export default DonationCardMed;
