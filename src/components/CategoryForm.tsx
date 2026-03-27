'use client';

//Hooks
import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import CustomDialog from './CustomDialog';
import Loader from './Loader';
//API
import { addCategory } from '@/api/firebase-categories';
import { addErrorEvent } from '@/api/firebase';
//Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { categoryBody } from '@/types/CategoryTypes';

type CategoryFormProps = {
    setShowForm?: Dispatch<SetStateAction<boolean>>;
    setCategoriesUpdated?: Dispatch<SetStateAction<boolean>>;
};

const CategoryForm = (props: CategoryFormProps) => {
    const { setShowForm, setCategoriesUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>('');
    const [tagPrefix, setTagPrefix] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const router = useRouter();

    const handleClose = () => {
        if (setCategoriesUpdated) setCategoriesUpdated(true);
        if (setShowForm) {
            setIsDialogOpen(false);
            setShowForm(false);
        } else {
            setIsDialogOpen(false);
            router.push('/categories');
        }
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const categoryToCreate: categoryBody = {
                name: name,
                tagPrefix: tagPrefix,
                description: description
            };
            await addCategory(categoryToCreate);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error submitting new category: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            <div className="page--header">
                <Typography variant="h5">Create Category</Typography>
                {setShowForm && (
                    <IconButton onClick={() => setShowForm(false)}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
            </div>

            {isLoading && <Loader />}
            {!isLoading && (
                <div className="content--container">
                    <Box component="form" display={'flex'} flexDirection={'column'} gap={4} className="form--container" onSubmit={handleSubmit}>
                        <TextField
                            type="text"
                            label="Name"
                            name="name"
                            id="name"
                            placeholder="Category Name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            required
                        />
                        <TextField
                            type="text"
                            label="Tag Number Prefix"
                            name="Tag Number Prefix"
                            id="tag-prefix"
                            placeholder="Prefix for Tag Numbers"
                            onChange={(e) => setTagPrefix(e.target.value)}
                            value={tagPrefix}
                            required
                        />
                        <TextField
                            type="text"
                            label="Description"
                            name="Description"
                            id="description"
                            placeholder="Description"
                            onChange={(e) => setDescription(e.target.value)}
                            value={description}
                        />
                        <Button variant="contained" type="submit" disabled={name.length === 0 || tagPrefix.length === 0}>
                            Create Category
                        </Button>
                        {setShowForm && (
                            <Button variant="outlined" type="button" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                    <CustomDialog
                        isOpen={isDialogOpen}
                        onClose={handleClose}
                        title="Cateory created"
                        content={`The category "${name}" has been successfuly created`}
                    />
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default CategoryForm;
