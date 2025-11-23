'use client';

//components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import Loader from './Loader';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
//Styles
import '@/styles/globalStyles.css';
import { Dispatch, SetStateAction, useState } from 'react';
//types
import { Category } from '@/models/category';

type CategoryDetailsProps = {
    id: string;
    category?: Category;
    setIdToDisplay?: Dispatch<SetStateAction<string | null>>;
    setCategoriesUpdated?: Dispatch<SetStateAction<boolean>>;
};

const CategoryDetails = (props: CategoryDetailsProps) => {
    const { id, category, setIdToDisplay, setCategoriesUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                {!isEditMode ? <Typography variant="h5">Category Details</Typography> : <Typography variant="h5">Edit Category</Typography>}
                {setIdToDisplay && (
                    <IconButton onClick={() => setIdToDisplay(null)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
            </div>

            {isLoading && <Loader />}
            {!isLoading && !category && !isEditMode && <Typography variant="body1">Category not found</Typography>}
            {!isLoading && category && !isEditMode && (
                <div className="content--container">
                    <Typography variant="h5">{category.name}</Typography>
                    <Typography variant="caption">Status</Typography>
                    {category.active ? (
                        <Stack direction="row" spacing={2}>
                            <Typography variant="h6">Active</Typography>
                            <Button variant="text">Make inactive</Button>
                        </Stack>
                    ) : (
                        <Stack direction="row">
                            <Typography variant="h6">Inactive</Typography>
                            <Button variant="text">Make Active</Button>
                        </Stack>
                    )}
                    {category.description && (
                        <Typography variant="body1">
                            <b>Description: </b>
                            {category.description}
                        </Typography>
                    )}
                    <Typography variant="body1">
                        <b>Tag Prefix: </b>
                        {category.tagPrefix}
                    </Typography>
                    <Typography variant="body1">
                        <b>Tag Counter: </b>
                        {category.tagCount}
                    </Typography>
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default CategoryDetails;
