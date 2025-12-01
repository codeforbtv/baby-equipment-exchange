'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import Loader from './Loader';
import EditCategory from './EditCategory';
//Api
import { updateCategory, getCategoryById } from '@/api/firebase-categories';
import { addErrorEvent } from '@/api/firebase';
//icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
//Styles
import '@/styles/globalStyles.css';
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
    const [categoryDetailsUpdated, setCategoryDetailsUpdated] = useState<boolean>(false);

    //If category has been updated, fetch latest changes from db

    const [categoryDetails, setCategoryDetails] = useState<Category | undefined>(category);

    const fetchCategory = async (id: string): Promise<void> => {
        setIsLoading(true);
        try {
            const categoryResult = await getCategoryById(id);
            setCategoryDetails(categoryResult);
            setCategoryDetailsUpdated(false);
        } catch (error) {
            addErrorEvent('Error fetching category: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (categoryDetails?.active) {
                await updateCategory(id, {
                    active: false
                });
            } else if (!categoryDetails?.active) {
                await updateCategory(id, {
                    active: true
                });
            }
            setCategoryDetailsUpdated(true);
        } catch (error) {
            addErrorEvent('Error toggling category active status: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!categoryDetails || categoryDetailsUpdated) fetchCategory(id);
    }, [categoryDetailsUpdated]);

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
            {!isLoading && !categoryDetails && !isEditMode && <Typography variant="body1">Category not found</Typography>}
            {!isLoading && categoryDetails && !isEditMode && (
                <div className="content--container">
                    <Typography variant="h5">{categoryDetails.name}</Typography>
                    <Typography variant="caption">Status</Typography>
                    {categoryDetails.active ? (
                        <Stack direction="row" spacing={2}>
                            <Typography variant="h6">Active</Typography>
                            <Button variant="text" onClick={handleToggleActive}>
                                Make inactive
                            </Button>
                        </Stack>
                    ) : (
                        <Stack direction="row">
                            <Typography variant="h6">Inactive</Typography>
                            <Button variant="text" onClick={handleToggleActive}>
                                Make Active
                            </Button>
                        </Stack>
                    )}
                    {categoryDetails.description && categoryDetails.description.length > 0 && (
                        <Typography variant="body1">
                            <b>Description: </b>
                            {categoryDetails.description}
                        </Typography>
                    )}
                    <Typography variant="body1">
                        <b>Tag Prefix: </b>
                        {categoryDetails.tagPrefix}
                    </Typography>
                    <Typography variant="body1">
                        <b>Tag Counter: </b>
                        {categoryDetails.tagCount}
                    </Typography>
                    <Stack sx={{ marginTop: '2em' }}>
                        <Button variant="contained" type="button" startIcon={<EditIcon />} onClick={() => setIsEditMode(true)}>
                            Edit Category
                        </Button>
                    </Stack>
                </div>
            )}
            {!isLoading && categoryDetails && isEditMode && (
                <EditCategory category={categoryDetails} setIsEditMode={setIsEditMode} setCategoryDetailsUpdated={setCategoryDetailsUpdated} />
            )}
        </ProtectedAdminRoute>
    );
};

export default CategoryDetails;
