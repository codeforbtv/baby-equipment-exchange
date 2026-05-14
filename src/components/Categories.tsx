'use client';

//Hooks
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import SearchIcon from '@mui/icons-material/Search';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/AdminDirectory.module.css';
//Types
import { Category } from '@/models/category';
import { Box, Button, InputAdornment, List, ListItem, ListItemButton, TextField, Typography } from '@mui/material';
import CategoryDetails from './CategoryDetails';
import CategoryForm from './CategoryForm';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';

type CategoryProps = {
    categories: Category[];
    setCategoriesUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Categories = (props: CategoryProps) => {
    const { categories, setCategoriesUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const normalizedSearch = searchInput.trim().toLowerCase();

    const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories]);
    const filteredCategories = useMemo(() => {
        if (!normalizedSearch) return sortedCategories;

        return sortedCategories.filter((category) =>
            [category.name, category.description, category.tagPrefix, category.active ? 'active' : 'inactive']
                .some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))
        );
    }, [normalizedSearch, sortedCategories]);
    const activeCategories = categories.filter((category) => category.active).length;

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
    };

    return (
        <ProtectedAdminRoute>
            {idToDisplay && (
                <CategoryDetails
                    id={idToDisplay}
                    category={categories.find((c) => c.id === idToDisplay)}
                    setIdToDisplay={setIdToDisplay}
                    setCategoriesUpdated={setCategoriesUpdated}
                />
            )}
            {showForm && <CategoryForm setShowForm={setShowForm} setCategoriesUpdated={setCategoriesUpdated} />}
            {!idToDisplay && !showForm && (
                <div className={styles['directory']}>
                    <div className={styles['header']}>
                        <div className={styles['titleCluster']}>
                            <p className={styles['eyebrow']}>Inventory Setup</p>
                            <div className={styles['titleRow']}>
                                <span className={styles['titleIcon']}>
                                    <CategoryIcon fontSize="small" />
                                </span>
                                <Typography variant="h5">Categories</Typography>
                            </div>
                            <p className={styles['summary']}>Configure item categories, tag prefixes, and active donation intake options.</p>
                        </div>
                        <Button variant="contained" type="button" onClick={handleShowForm} startIcon={<AddIcon />}>
                            Add new
                        </Button>
                    </div>

                    <div className={styles['toolbar']}>
                        <TextField
                            className={styles['searchField']}
                            label="Search categories"
                            id="search-field"
                            size="small"
                            value={searchInput}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>): void => setSearchInput(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                )
                            }}
                        />
                        <div className={styles['metrics']}>
                            <span className={styles['metricText']}>{categories.length} total</span>
                            <span className={styles['metricText']}>{activeCategories} active</span>
                            {normalizedSearch && <span className={styles['metricText']}>{filteredCategories.length} shown</span>}
                        </div>
                    </div>

                    {filteredCategories.length === 0 ? (
                        <Box className={styles['emptyState']}>No categories match this search.</Box>
                    ) : (
                        <List className={styles['list']} aria-label="Categories">
                            {filteredCategories.map((category) => (
                                <ListItem className={styles['row']} key={category.id} disablePadding>
                                    <ListItemButton className={styles['rowButton']} component="button" onClick={() => setIdToDisplay(category.id)}>
                                        <div className={styles['rowMain']}>
                                            <p className={styles['rowTitle']}>{category.name}</p>
                                            <p className={styles['rowSubMeta']}>
                                                {category.active ? 'Active' : 'Inactive'} · {category.tagPrefix}-{category.tagCount ?? 0}
                                            </p>
                                            <p className={styles['rowMeta']}>
                                                {category.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </div>
            )}
        </ProtectedAdminRoute>
    );
};

export default Categories;
