import { DonationCardProps, donationStatus } from '@/types/DonationTypes';
import { updateDonationStatus } from '@/api/firebase-donations';
import { DonationStatusValues } from '@/models/donation';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    FormControl,
    FormLabel,
    ImageList,
    MenuItem,
    NativeSelect,
    SelectChangeEvent,
    TextField
} from '@mui/material';
import { useContext, useState } from 'react';
import { UserContext } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';

// Styles
import styles from './Browse.module.css';

export default function ExistingDonationDialog({
    initialParameters,
    onClose,
    onDelete
}: {
    initialParameters: { [key: string]: boolean | DonationCardProps };
    onClose: () => void;
    onDelete: () => void;
}) {
    const donation: DonationCardProps = initialParameters.data as DonationCardProps;
    const [donationStatus, setDonationStatus] = useState<DonationStatusValues>(donation.status ?? 'in processing');

    const { isAdmin } = useContext(UserContext);
    const router = useRouter();

    const donationStatusToName: { [key in donationStatus]: string } = {
        'in processing': 'In Processing',
        'pending delivery': 'Pending Delivery',
        available: 'Available',
        requested: 'Requested',
        reserved: 'Reserved',
        distributed: 'Distributed'
    };

    const handleAccept = () => {
        onClose();
        router.push(`/schedule/${donation.id}`);
    };

    const handleReject = async () => {
        onClose();
        router.push(`/reject/${donation.id}`);
    };

    if (!(donation instanceof Object) || !(typeof initialParameters.initAsOpen === 'boolean')) {
        return <></>;
    }
    return (
        <Dialog open={initialParameters.initAsOpen} onClose={onClose}>
            <DialogContent>
                <h3>{`${donation.model} (${donation.brand})`}</h3>
                <FormControl sx={{ display: 'flex', gap: 1 }} component="fieldset">
                    <FormLabel component="legend">Details</FormLabel>
                    <NativeSelect
                        variant="outlined"
                        style={{ padding: '.25rem .5rem' }}
                        name="category"
                        id="category"
                        placeholder="Category"
                        value={donation.category ?? 'undefined'}
                        readOnly
                    />
                    <TextField
                        type="text"
                        label="Brand"
                        name="brand"
                        id="brand"
                        placeholder=" Brand"
                        value={donation.brand ?? 'undefined'}
                        inputProps={{
                            readOnly: true
                        }}
                    />
                    <TextField
                        type="text"
                        label="Model"
                        name="model"
                        id="model"
                        value={donation.model ?? 'undefined'}
                        inputProps={{
                            readOnly: true
                        }}
                    />
                    <TextField
                        multiline={true}
                        name="description"
                        label="Description"
                        rows={12}
                        placeholder="Provide details about the item"
                        id="description"
                        value={donation.description ?? 'undefined'}
                        inputProps={{
                            readOnly: true
                        }}
                    />
                    <TextField
                        name="status"
                        label="Status"
                        select
                        value={donationStatus}
                        SelectProps={{
                            readOnly: !isAdmin,
                            onChange: async (event: SelectChangeEvent<unknown>) => {
                                if (!isAdmin) {
                                    return;
                                }
                                const newStatus = event.target.value as donationStatus;
                                const resultStatus: DonationStatusValues = await updateDonationStatus(donation.id, newStatus);
                                setDonationStatus(resultStatus);
                            }
                        }}
                    >
                        {Object.keys(donationStatusToName).map((status) => (
                            <MenuItem key={status} value={status}>
                                {' '}
                                {donationStatusToName[status as DonationStatusValues]}{' '}
                            </MenuItem>
                        ))}
                    </TextField>
                </FormControl>
                <ImageList className={styles['browse__grid']}>
                    {donation.images &&
                        donation.images.map((image) => {
                            return (
                                <img
                                    key={image}
                                    src={image}
                                    style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                                    alt={`${donation.description ?? 'No description'}`}
                                />
                            );
                        })}
                </ImageList>
            </DialogContent>
            <DialogActions>
                {isAdmin && (
                    <>
                        <Button variant="contained" onClick={handleAccept}>
                            Accept
                        </Button>
                        {/* //TO-DO: Reject should send an automated email with sugestions for other ways to donate uneeded gear. */}
                        <Button variant="outlined" onClick={handleReject}>
                            Reject
                        </Button>
                    </>
                )}
                <Button onClick={onDelete} color="error">
                    delete
                </Button>
                <Button onClick={onClose}>close</Button>
            </DialogActions>
        </Dialog>
    );
}
