'use client';

import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardMedia,
    CardContent,
    FormControl,
    MenuItem,
    Select,
    ToggleButtonGroup,
    ToggleButton,
    Typography
} from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Donation } from '@/models/donation';
import { Category } from '@/models/category';
import { updateDonation } from '@/api/firebase-donations';
import { Dispatch, SetStateAction, useState } from 'react';

import '@/styles/globalStyles.css';

const thumbnailStyles = {
    width: '15%',
    objectFit: 'cover',
    aspectRatio: '1 / 1'
};

type AcceptRejectCardProps = {
    donation: Donation;
    handleAcceptReject: (value: ButtonStatus, id: string) => void;
    setIdToDisplay: Dispatch<SetStateAction<string | null>>;
    categories?: Category[];
    onCategoryFixed?: (donationId: string, newCategory: string) => void;
};

type ButtonStatus = 'accepted' | 'rejected' | null;

const AcceptRejectCard = (props: AcceptRejectCardProps) => {
    const { donation, handleAcceptReject, setIdToDisplay, categories, onCategoryFixed } = props;
    const [status, setStatus] = useState<ButtonStatus>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    const validCategoryNames = categories?.map((c) => c.getName()) || [];
    const hasInvalidCategory = categories && categories.length > 0 && !validCategoryNames.includes(donation.category);

    const handleToggle = (_event: React.MouseEvent<HTMLElement>, value: ButtonStatus) => {
        setStatus(value);
        handleAcceptReject(value, donation.id);
    };

    const handleFixCategory = async () => {
        if (!selectedCategory) return;
        setIsSaving(true);
        try {
            await updateDonation(donation.id, { category: selectedCategory });
            onCategoryFixed?.(donation.id, selectedCategory);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            <Card className="card--container" elevation={3}>
                <CardActions onClick={() => setIdToDisplay(donation.id)} sx={{ cursor: 'pointer' }}>
                    <CardMedia component="img" alt={donation.model} image={donation.images[0]} sx={thumbnailStyles} />
                    <CardContent>
                        <Typography variant="h4">{donation.model}</Typography>
                        <Typography variant="h4">{donation.brand}</Typography>
                    </CardContent>
                </CardActions>
                <CardActions>
                    {hasInvalidCategory ? (
                        <Alert severity="warning" sx={{ width: '100%' }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Unrecognized category: &ldquo;{donation.category}&rdquo;
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value as string)}
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>
                                            Select category
                                        </MenuItem>
                                        {categories!.map((cat) => (
                                            <MenuItem key={cat.getId()} value={cat.getName()}>
                                                {cat.getName()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button variant="contained" size="small" onClick={handleFixCategory} disabled={!selectedCategory || isSaving}>
                                    {isSaving ? 'Saving...' : 'Fix'}
                                </Button>
                            </Box>
                        </Alert>
                    ) : (
                        <ToggleButtonGroup value={status} exclusive onChange={handleToggle}>
                            <ToggleButton value="accepted" aria-label="accept button" color="success">
                                Accept
                            </ToggleButton>
                            <ToggleButton value="rejected" aria-label="reject button" color="error">
                                Reject
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}
                </CardActions>
            </Card>
        </ProtectedAdminRoute>
    );
};

export default AcceptRejectCard;
