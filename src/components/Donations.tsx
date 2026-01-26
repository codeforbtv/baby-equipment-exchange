'use client';

//Hooks
import { SetStateAction, useState, Dispatch, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
//Components
import { Button, ImageList, Chip, Autocomplete, TextField, Stack, Typography, InputAdornment, useMediaQuery } from '@mui/material';
import DonationCard from '@/components/DonationCard';
import DonationDetails from '@/components/DonationDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
//Api
import { getAllCategories } from '@/api/firebase-categories';

//Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation, DonationStatuses, donationStatuses } from '@/models/donation';
import { Category } from '@/models/category';
import { addErrorEvent } from '@/api/firebase';

type DonationsProps = {
    donations: Donation[];
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const statusSelectOptions = Object.keys(donationStatuses);

const Donations = (props: DonationsProps) => {
    const { donations, setDonationsUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [statusFilter, setStatusFilter] = useState<string[] | undefined>([]);
    const router = useRouter();

    //Media query for imagelist grid
    const isMobile = useMediaQuery('(max-width:600px)');

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
            currentDonations = currentDonations.filter((donation) =>
                Object.values(donation).some((value) => String(value).toLowerCase().includes(searchInput.toLowerCase()))
            );
        }
        if (categoryFilter && categoryFilter.length > 0) {
            currentDonations = currentDonations.filter((donation) => categoryFilter.includes(donation.category));
        }
        if (statusFilter && statusFilter.length > 0) {
            currentDonations = currentDonations.filter((donation) =>
                statusFilter.some((filter) => donationStatuses[filter as keyof DonationStatuses] === donation.status)
            );
        }
        return currentDonations;
    }, [categoryFilter, statusFilter, searchInput]);

    useEffect(() => {
        if (!categories) fetchCategories();
    }, []);

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setDonationsUpdated={setDonationsUpdated} />}

            {!idToDisplay && (
                <>
                    <div className="page--header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h5">Donations</Typography>
                        <Button startIcon={<AddIcon />} variant="contained" type="button" onClick={() => router.push('/admin-donate')}>
                            Add New
                        </Button>
                    </div>
                    <Stack spacing={2} sx={{ paddingLeft: '1em' }}>
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
                        {categories && (
                            <Autocomplete
                                sx={{ maxWidth: '83vw' }}
                                multiple
                                id="category-filter"
                                options={categories.map((category) => category.name)}
                                value={categoryFilter}
                                onChange={(event, newValue) => setCategoryFilter(newValue)}
                                renderInput={(params) => <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" />}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return <Chip key={key} label={option} {...tagProps} />;
                                    })
                                }
                            />
                        )}

                        <Autocomplete
                            sx={{ maxWidth: '83vw' }}
                            multiple
                            id="status-filter"
                            options={statusSelectOptions}
                            value={statusFilter}
                            onChange={(event, newValues) => setStatusFilter(newValues)}
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
                        <ImageList className={styles['browse__grid']} rowHeight={300} gap={4} cols={isMobile ? 1 : 2}>
                            {donationsToDisplay.map((donation) => (
                                <DonationCard key={donation.id} donation={donation} setIdToDisplay={setIdToDisplay} />
                            ))}
                        </ImageList>
                    )}
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Donations;
