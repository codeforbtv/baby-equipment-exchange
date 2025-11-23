'use client';

//Hoooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Category } from '@/models/category';
import { Button, InputAdornment, List, ListItem, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import Loader from './Loader';
import CategoryDetails from './CategoryDetails';

type CategoryProps = {
    categories: Category[];
    setCategoriesUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Categories = (props: CategoryProps) => {
    const { categories, setCategoriesUpdated } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [idToDisplay, setIdtoDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const [filteredCategories, setFilteredCategories] = useState<Category[] | null>(categories);

    useEffect(() => {
        setFilteredCategories(
            categories.filter((category) => Object.values(category).some((value) => String(value).toLowerCase().includes(searchInput.toLowerCase())))
        );
    }, [searchInput]);

    return (
        <ProtectedAdminRoute>
            {idToDisplay && (
                <CategoryDetails
                    id={idToDisplay}
                    category={categories.find((c) => c.id === idToDisplay)}
                    setIdToDisplay={setIdtoDisplay}
                    setCategoriesUpdated={setCategoriesUpdated}
                />
            )}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header">
                        <Typography variant="h5">Categories</Typography>
                    </div>
                    <Button variant="contained" type="button">
                        Add New
                    </Button>
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
                    <div className="content--container">
                        {isLoading && <Loader />}
                        {!isLoading && filteredCategories && (
                            <List>
                                {filteredCategories.map((category) => (
                                    <ListItem key={category.name}>
                                        <ListItemButton
                                            sx={{ backgroundColor: 'white', border: '1px solid black' }}
                                            component="a"
                                            onClick={() => setIdtoDisplay(category.id)}
                                        >
                                            <ListItemText primary={category.name} sx={{ color: category.active ? 'black' : 'gray' }} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </div>
                </>
            )}
        </ProtectedAdminRoute>
    );
};

export default Categories;
