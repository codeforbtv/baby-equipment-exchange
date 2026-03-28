import { Dispatch, SetStateAction, useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Typography } from '@mui/material';
import NotificationCard from '@/components/NotificationCard';
import styles from '@/components/NotificationCard.module.css';
import PlaceIcon from '@mui/icons-material/Place';
import { Donation } from '@/models/donation';
import { Storage } from '@/models/storage';
import { updateBulkDonationStorage, getStorageDocRef } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';

interface Props {
    donations: Donation[][];
    activeStorageLocations: Storage[];
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    setNotificationsUpdated?: Dispatch<SetStateAction<boolean>>;
}

const PendingStorageAssignmentSection = ({ donations, activeStorageLocations, setIdToDisplay, setNotificationsUpdated }: Props) => {
    const [selectedStorage, setSelectedStorage] = useState<Record<number, string>>({});
    const [assignedGroups, setAssignedGroups] = useState<Set<number>>(new Set());

    // Filter groups to only show donations without a storage reference
    const unassignedGroups = donations.filter((group) => group.some((donation) => !donation.storage));

    if (unassignedGroups.length === 0) return null;

    const handleStorageChange = (groupIndex: number, event: SelectChangeEvent<string>) => {
        setSelectedStorage((prev) => ({ ...prev, [groupIndex]: event.target.value }));
    };

    const handleAssignStorage = async (groupIndex: number, donationArray: Donation[]) => {
        const storageId = selectedStorage[groupIndex];
        if (!storageId) return;

        try {
            const storageRef = getStorageDocRef(storageId);
            const donationIds = donationArray.map((d) => d.id);
            // Optimistic update
            setAssignedGroups((prev) => new Set(prev).add(groupIndex));
            await updateBulkDonationStorage(donationIds, storageRef);
            if (setNotificationsUpdated) setNotificationsUpdated(true);
        } catch (error) {
            // Roll back optimistic update
            setAssignedGroups((prev) => {
                const next = new Set(prev);
                next.delete(groupIndex);
                return next;
            });
            addErrorEvent('Error assigning storage to donation group', error);
        }
    };

    return (
        <div className={styles['notification-section']}>
            <Typography sx={{ marginTop: '1rem', marginBottom: '0.5rem' }} variant="h6">
                Awaiting storage assignment
            </Typography>
            {unassignedGroups.map((donationArray, i) => {
                if (assignedGroups.has(i)) return null;

                return (
                    <Paper className={styles['notification-card--container']} key={i} elevation={0}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <PlaceIcon sx={{ color: '#bdbdbd' }} />
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel id={`storage-select-label-${i}`}>Assign storage</InputLabel>
                                <Select
                                    labelId={`storage-select-label-${i}`}
                                    id={`storage-select-${i}`}
                                    value={selectedStorage[i] ?? ''}
                                    label="Assign storage"
                                    onChange={(e) => handleStorageChange(i, e)}
                                >
                                    {activeStorageLocations.map((loc) => (
                                        <MenuItem key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button variant="contained" size="small" disabled={!selectedStorage[i]} onClick={() => handleAssignStorage(i, donationArray)}>
                                Assign
                            </Button>
                        </div>
                        {donationArray.map((donation) => (
                            <NotificationCard
                                key={donation.id}
                                donation={donation}
                                type="pending-donation"
                                setIdToDisplay={setIdToDisplay}
                                setNotificationsUpdated={setNotificationsUpdated}
                                activeStorageLocations={activeStorageLocations}
                            />
                        ))}
                    </Paper>
                );
            })}
        </div>
    );
};

export default PendingStorageAssignmentSection;
