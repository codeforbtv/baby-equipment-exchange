'use client';

//Hooks
import { SetStateAction, useState, Dispatch, useMemo } from 'react';
//Components
import { Button, ImageList, Chip, Autocomplete, TextField, Stack, Typography, Box, InputAdornment } from '@mui/material';
import DonationCard from '@/components/DonationCard';
import DonationDetails from '@/components/DonationDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AdminCreateDonation from '@/components/AdminCreateDonation';
//Constants
import { categories } from '@/data/html';
//Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation, DonationStatuses, donationStatuses } from '@/models/donation';

type DonationsProps = {
    donations: Donation[];
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const statusSelectOptions = Object.keys(donationStatuses);

const Donations = (props: DonationsProps) => {
    const { donations, setDonationsUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string[] | undefined>([]);
    const [statusFilter, setStatusFilter] = useState<string[] | undefined>([]);

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
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

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setDonationsUpdated={setDonationsUpdated} />}
            {showForm && <AdminCreateDonation setShowForm={setShowForm} setDonationsUpdated={setDonationsUpdated} />}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h5">Donations</Typography>
                        <Button startIcon={<AddIcon />} variant="contained" type="button" onClick={handleShowForm}>
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
                        <ImageList className={styles['browse__grid']} rowHeight={300} gap={4}>
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
