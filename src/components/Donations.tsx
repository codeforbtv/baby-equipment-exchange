'use client';

//Hooks
import { SetStateAction, useState, Dispatch, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//Components
import { Box, Button, Chip, Autocomplete, TextField, Stack, Typography, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DonationCard from '@/components/DonationCard';
import DonationDetailsDialog from '@/components/DonationDetailsDialog';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//Api
import { getAllCategories } from '@/api/firebase-categories';

//Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Donation, DonationStatuses, donationStatuses } from '@/models/donation';
import { Category } from '@/models/category';
import { compareDonations, SortKey } from '@/utils/storageTime';
import { addErrorEvent } from '@/api/firebase';

type DonationsProps = {
    donations: Donation[];
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const statusSelectOptions = Object.keys(donationStatuses);

const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'storage-desc', label: 'Longest in storage' },
    { value: 'storage-asc', label: 'Shortest in storage' },
    { value: 'accepted-desc', label: 'Newest accepted' },
    { value: 'accepted-asc', label: 'Oldest accepted' }
];

const Donations = (props: DonationsProps) => {
    const { donations, setDonationsUpdated } = props;
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
    const [searchInput, setSearchInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [statusFilter, setStatusFilter] = useState<string[] | undefined>([]);
    const [sortBy, setSortBy] = useState<SortKey>('accepted-desc');
    const router = useRouter();

    const fetchCategories = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const categoriesResult = await getAllCategories();
            setCategories(categoriesResult);
        } catch (error) {
            addErrorEvent('Error fetching all categories: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    //Updates displayed donations anytimes filters or search field changes
    const donationsToDisplay = useMemo(() => {
        let currentDonations = donations;
        if (searchInput.length > 0) {
            const search = searchInput.toLowerCase();
            currentDonations = currentDonations.filter((donation) => {
                const searchableValues = [
                    donation.tagNumber,
                    donation.status,
                    donation.category,
                    donation.brand,
                    donation.model,
                    donation.description,
                    donation.donorName,
                    donation.donorEmail,
                    donation.requestor?.name,
                    donation.requestor?.email,
                    donation.distributor?.name,
                    donation.distributor?.email
                ];
                return searchableValues.some((value) => String(value ?? '').toLowerCase().includes(search));
            });
        }
        if (categoryFilter && categoryFilter.length > 0) {
            currentDonations = currentDonations.filter((donation) => categoryFilter.includes(donation.category));
        }
        if (statusFilter && statusFilter.length > 0) {
            currentDonations = currentDonations.filter((donation) =>
                statusFilter.some((filter) => donationStatuses[filter as keyof DonationStatuses] === donation.status)
            );
        }
        return [...currentDonations].sort(compareDonations(sortBy));
    }, [donations, categoryFilter, statusFilter, searchInput, sortBy]);

    useEffect(() => {
        if (!categories) fetchCategories();
    }, []);

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
                    id="search-field"
                    placeholder="Search by tag, donor, brand, model, or category"
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
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }} alignItems={{ md: 'flex-end' }} sx={{ width: '100%' }}>
                    {categories && (
                        <Autocomplete
                            sx={{ flex: '1 1 0', minWidth: 0, maxWidth: { xs: '83vw', md: 'none' } }}
                            multiple
                            id="category-filter"
                            options={categories.map((category) => category.name)}
                            value={categoryFilter}
                            onChange={(event, newValue) => setCategoryFilter(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" InputLabelProps={{ shrink: true }} />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return <Chip key={key} label={option} {...tagProps} />;
                                })
                            }
                        />
                    )}

                    <Autocomplete
                        sx={{ flex: '1 1 0', minWidth: 0, maxWidth: { xs: '83vw', md: 'none' } }}
                        multiple
                        id="status-filter"
                        options={statusSelectOptions}
                        value={statusFilter}
                        onChange={(event, newValues) => setStatusFilter(newValues)}
                        renderInput={(params) => (
                            <TextField {...params} variant="standard" label="Filter by status" placeholder="Status" InputLabelProps={{ shrink: true }} />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return <Chip key={key} label={option} {...tagProps} />;
                            })
                        }
                    />

                    <FormControl variant="standard" sx={{ flexShrink: 0, width: { xs: '100%', md: 220 }, maxWidth: '83vw', ml: { md: 'auto' } }}>
                        <InputLabel id="sort-label">Sort</InputLabel>
                        <Select
                            labelId="sort-label"
                            id="sort-select"
                            value={sortBy}
                            label="Sort"
                            onChange={(event) => setSortBy(event.target.value as SortKey)}
                        >
                            {sortOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>
            {donationsToDisplay.length === 0 ? (
                <Typography variant="body1">No donations found.</Typography>
            ) : (
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 2
                    }}
                >
                    {donationsToDisplay.map((donation) => (
                        <DonationCard key={donation.id} donation={donation} onSelect={(d) => setSelectedDonation(d)} />
                    ))}
                </Box>
            )}
            <DonationDetailsDialog
                open={selectedDonation !== null}
                donation={selectedDonation}
                onClose={() => setSelectedDonation(null)}
                onUpdated={() => setDonationsUpdated?.(true)}
            />
        </ProtectedAdminRoute>
    );
};

export default Donations;
