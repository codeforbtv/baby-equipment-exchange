'use client';

import { SetStateAction, useState, Dispatch, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Autocomplete, TextField, Stack, Typography, InputAdornment, Box } from '@mui/material';
import DonationCard from '@/components/DonationCard';
import DonationDetailsDialog from '@/components/DonationDetailsDialog';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import '@/styles/globalStyles.css';
import { Donation, DonationStatuses, donationStatuses } from '@/models/donation';

type DonationsProps = {
    donations: Donation[];
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Donations = (props: DonationsProps) => {
    const { donations, setDonationsUpdated } = props;
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
    const [searchInput, setSearchInput] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const router = useRouter();

    const availableCategories = useMemo(
        () => [...new Set(donations.map((d) => d.category).filter(Boolean))].sort(),
        [donations]
    );

    const availableStatuses = useMemo(() => {
        const statusValues = new Set(donations.map((d) => d.status).filter(Boolean));
        return Object.entries(donationStatuses)
            .filter(([, value]) => statusValues.has(value))
            .map(([key]) => key);
    }, [donations]);

    const donationsToDisplay = useMemo(() => {
        let current = donations;
        if (searchInput.length > 0) {
            const search = searchInput.toLowerCase();
            current = current.filter(
                (donation) =>
                    Object.values(donation).some((value) => String(value).toLowerCase().includes(search)) ||
                    (donation.requestor && Object.values(donation.requestor).some((value) => String(value).toLowerCase().includes(search))) ||
                    (donation.distributor && Object.values(donation.distributor).some((value) => String(value).toLowerCase().includes(search)))
            );
        }
        if (categoryFilter.length > 0) {
            current = current.filter((donation) => categoryFilter.includes(donation.category));
        }
        if (statusFilter.length > 0) {
            current = current.filter((donation) =>
                statusFilter.some((filter) => donationStatuses[filter as keyof DonationStatuses] === donation.status)
            );
        }
        return current;
    }, [donations, categoryFilter, statusFilter, searchInput]);

    return (
        <ProtectedAdminRoute>
            <div className="page--header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h5">Donations</Typography>
                <Button startIcon={<AddIcon />} variant="contained" type="button" onClick={() => router.push('/admin-donate')}>
                    Add New
                </Button>
            </div>
            <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                    label="Search"
                    placeholder="Search by tag, brand, model, category, donor, or recipient"
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
                <Autocomplete
                    multiple
                    id="category-filter"
                    options={availableCategories}
                    value={categoryFilter}
                    onChange={(_event, newValue) => setCategoryFilter(newValue)}
                    renderInput={(params) => <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" />}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return <Chip key={key} label={option} {...tagProps} />;
                        })
                    }
                />
                <Autocomplete
                    multiple
                    id="status-filter"
                    options={availableStatuses}
                    value={statusFilter}
                    onChange={(_event, newValue) => setStatusFilter(newValue)}
                    renderInput={(params) => <TextField {...params} variant="standard" label="Filter by status" placeholder="Status" />}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return <Chip key={key} label={option} {...tagProps} />;
                        })
                    }
                />
            </Stack>
            {donationsToDisplay.length === 0 ? (
                <Typography variant="body1">No donations found.</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(3, 1fr)',
                            md: 'repeat(4, 1fr)',
                            lg: 'repeat(5, 1fr)'
                        },
                        gap: 2
                    }}
                >
                    {donationsToDisplay.map((donation) => (
                        <DonationCard key={donation.id} donation={donation} onSelect={setSelectedDonation} />
                    ))}
                </Box>
            )}

            <DonationDetailsDialog
                open={selectedDonation !== null}
                donation={selectedDonation}
                onClose={() => setSelectedDonation(null)}
                setDonationsUpdated={setDonationsUpdated}
            />
        </ProtectedAdminRoute>
    );
};

export default Donations;
