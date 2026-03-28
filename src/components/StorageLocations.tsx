'use client';

//Hooks
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
//Components
import ProtectedAdminRoute from './ProtectedAdminRoute';
import { Button, InputAdornment, List, ListItem, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';
import Loader from './Loader';
import StorageLocationDetails from './StorageLocationDetails';
import StorageLocationForm from './StorageLocationForm';
//Icons
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
//Styles
import '@/styles/globalStyles.css';
//Types
import { Storage } from '@/models/storage';

type StorageLocationsProps = {
    storageLocations: Storage[];
    setStorageUpdated?: Dispatch<SetStateAction<boolean>>;
};

const StorageLocations = (props: StorageLocationsProps) => {
    const { storageLocations, setStorageUpdated } = props;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const [filteredLocations, setFilteredLocations] = useState<Storage[] | null>(storageLocations);

    const handleShowForm = () => {
        setIdToDisplay(null);
        setShowForm(true);
    };

    useEffect(() => {
        setFilteredLocations(
            storageLocations.filter((location) =>
                Object.values(location).some((value) => String(value).toLowerCase().includes(searchInput.toLowerCase()))
            )
        );
    }, [searchInput]);

    return (
        <ProtectedAdminRoute>
            {idToDisplay && (
                <StorageLocationDetails
                    id={idToDisplay}
                    storageLocation={storageLocations.find((s) => s.id === idToDisplay)}
                    setIdToDisplay={setIdToDisplay}
                    setStorageUpdated={setStorageUpdated}
                />
            )}
            {showForm && <StorageLocationForm setShowForm={setShowForm} setStorageUpdated={setStorageUpdated} />}
            {!idToDisplay && !showForm && (
                <>
                    <div className="page--header">
                        <Typography variant="h5">Storage Locations</Typography>
                    </div>
                    <Button variant="contained" type="button" onClick={handleShowForm}>
                        Add New
                    </Button>
                    <TextField
                        label="Search"
                        id="storage-search-field"
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
                        {!isLoading && filteredLocations && (
                            <List>
                                {filteredLocations.map((location) => (
                                    <ListItem key={location.id}>
                                        <ListItemButton
                                            sx={{
                                                backgroundColor: '#fafafa',
                                                border: '1px solid #eaeaea',
                                                borderRadius: '12px',
                                                '&:hover': { backgroundColor: '#f0f0f0' }
                                            }}
                                            component="a"
                                            onClick={() => setIdToDisplay(location.id)}
                                        >
                                            <PlaceIcon sx={{ mr: 1, color: location.active ? '#1976d2' : '#bdbdbd' }} />
                                            <ListItemText
                                                primary={location.name}
                                                secondary={
                                                    location.address
                                                        ? `${location.address.city ?? ''}, ${location.address.state ?? ''}`
                                                        : 'No address'
                                                }
                                                sx={{ color: location.active ? 'black' : 'gray' }}
                                            />
                                            {!location.active && (
                                                <Typography variant="caption" sx={{ color: '#bdbdbd', ml: 1 }}>
                                                    Inactive
                                                </Typography>
                                            )}
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

export default StorageLocations;
