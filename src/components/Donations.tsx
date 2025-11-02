'use client';

//Hooks
import { SetStateAction, useState, Dispatch } from 'react';
//Components
import { Button, ImageList, Chip, Autocomplete, TextField, Stack, Typography } from '@mui/material';
import DonationCard from '@/components/DonationCard';
import DonationDetails from '@/components/DonationDetails';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AdminCreateDonation from '@/components/AdminCreateDonation';
//API
import { categories } from '@/data/html';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Browse.module.css';
//Types
import { Donation } from '@/models/donation';

type DonationsProps = {
    donations: Donation[];
    setDonationsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Donations = (props: DonationsProps) => {
    const { donations, setDonationsUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
    };

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <DonationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setDonationsUpdated={setDonationsUpdated} />}
            {showForm && <AdminCreateDonation setShowForm={setShowForm} setDonationsUpdated={setDonationsUpdated} />}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header">
                        <Typography variant="h5">Donations</Typography>
                    </div>
                    <Button variant="contained" type="button" onClick={handleShowForm}>
                        Add donation
                    </Button>
                    <Autocomplete
                        multiple
                        id="category-filter"
                        options={categories.map((category) => category.name)}
                        renderInput={(params) => <TextField {...params} variant="standard" label="Filter by category" placeholder="Category" />}
                        renderTags={(value, getTagProps) => value.map((option, index) => <Chip label={option} {...getTagProps({ index })} />)}
                    />

                    <ImageList className={styles['browse__grid']} rowHeight={300} gap={4}>
                        {donations.map((donation) => (
                            <DonationCard key={donation.id} donation={donation} setIdToDisplay={setIdToDisplay} />
                        ))}
                    </ImageList>
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Donations;
