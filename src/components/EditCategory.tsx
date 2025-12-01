'use client';

//hooks
import { Dispatch, SetStateAction, useState } from 'react';
//components
import NumberField from './NumberField';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import Loader from './Loader';
import { Box } from '@mui/system';
import { Button, Checkbox, FormControlLabel, FormGroup, Stack, TextField } from '@mui/material';
import CustomDialog from './CustomDialog';
//Api
import { addErrorEvent } from '@/api/firebase';
import { updateCategory } from '@/api/firebase-categories';
//types
import { Category } from '@/models/category';

type EditCategoryProps = {
    category: Category;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
    setCategoryDetailsUpdated: Dispatch<SetStateAction<boolean>>;
};

const EditCategory = (props: EditCategoryProps) => {
    const { category, setIsEditMode, setCategoryDetailsUpdated } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [newName, setNewName] = useState<string>(category.name);
    const [newActive, setNewActive] = useState<boolean>(category.active);
    const [newTagPrefix, setNewTagPrefix] = useState<string>(category.tagPrefix);
    const [newTagCount, setNewtagCount] = useState<number>(category.tagCount);
    const [newDescription, setNewDescription] = useState<string>(category.description ?? '');
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleCheck = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewActive(event.target.checked);
    };

    const handleClose = () => {
        setIsDialogOpen(false);
        setIsEditMode(false);
        setCategoryDetailsUpdated(true);
    };

    const handleSubmit = async (event: React.FormEvent): Promise<void> => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const updatedCategory = {
                name: newName,
                active: newActive,
                description: newDescription,
                tagPrefix: newTagPrefix,
                tagCount: newTagCount
            };
            await updateCategory(category.id, updatedCategory);
            setIsDialogOpen(true);
        } catch (error) {
            addErrorEvent('Error updating category: ', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedAdminRoute>
            {isLoading && <Loader />}
            {!isLoading && (
                <div className="content--container">
                    <Box component="form" display={'flex'} flexDirection={'column'} gap={4} className="form--container" onSubmit={handleSubmit}>
                        <TextField
                            type="text"
                            label="Name"
                            name="name"
                            id="name"
                            placeholder="Name"
                            onChange={(e) => setNewName(e.target.value)}
                            value={newName}
                            required
                        />
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={newActive} onChange={handleCheck} />} label="Active" />
                        </FormGroup>
                        <TextField
                            type="text"
                            label="Tag Prefix"
                            name="Tag Prefix"
                            id="tag-prefix"
                            placeholder="Tag Prefix"
                            onChange={(e) => setNewTagPrefix(e.target.value)}
                            value={newTagPrefix}
                        />
                        <TextField
                            type="text"
                            label="Description"
                            name="description"
                            id="description"
                            placeholder="Description"
                            onChange={(e) => setNewDescription(e.target.value)}
                        />
                        <NumberField label="Tag Count" value={newTagCount} onValueChange={(e) => setNewtagCount(e ?? 0)} />
                        <Stack direction="column" spacing={2}>
                            <Button variant="contained" type="submit">
                                Save
                            </Button>
                            <Button variant="outlined" type="button" onClick={() => setIsEditMode(false)}>
                                Cancel
                            </Button>
                        </Stack>
                    </Box>
                    <CustomDialog
                        isOpen={isDialogOpen}
                        onClose={handleClose}
                        title={`Category updated`}
                        content={`The category ${newName} has been sucessfully updated.`}
                    />
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default EditCategory;
