'use client';

//Hooks
import { useMemo, useState, Dispatch, SetStateAction } from 'react';

//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import OrganizationDetails from '@/components/OrganizationDetails';
import OrganizationForm from '@/components/OrganizationForm';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/AdminDirectory.module.css';
import { Box, Button, Chip, InputAdornment, List, ListItem, ListItemButton, TextField, Typography } from '@mui/material';
//Icons
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
//Types
type OrganizationsProps = {
    orgNamesAndIds: { [key: string]: string };
    setOrgsUpdated?: Dispatch<SetStateAction<boolean>>;
};

const Organizations = (props: OrganizationsProps) => {
    const { orgNamesAndIds, setOrgsUpdated } = props;
    const [idToDisplay, setIdToDisplay] = useState<string | null>(null);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const normalizedSearch = searchInput.trim().toLowerCase();

    const orgNames = useMemo(() => Object.keys(orgNamesAndIds).sort((a, b) => a.localeCompare(b)), [orgNamesAndIds]);
    const filteredOrgNames = useMemo(
        () => orgNames.filter((org) => org.toLowerCase().includes(normalizedSearch)),
        [normalizedSearch, orgNames]
    );

    const handleShowForm = () => {
        //Close details if open
        setIdToDisplay(null);
        setShowForm(true);
    };

    return (
        <ProtectedAdminRoute>
            {idToDisplay && <OrganizationDetails id={idToDisplay} setIdToDisplay={setIdToDisplay} setOrgsUpdated={setOrgsUpdated} />}
            {showForm && <OrganizationForm setShowForm={setShowForm} setOrgsUpdated={setOrgsUpdated} />}
            {!idToDisplay && !showForm && (
                <div className={styles['directory']}>
                    <div className={styles['header']}>
                        <div className={styles['titleCluster']}>
                            <p className={styles['eyebrow']}>Admin Directory</p>
                            <div className={styles['titleRow']}>
                                <span className={styles['titleIcon']}>
                                    <BusinessIcon fontSize="small" />
                                </span>
                                <Typography variant="h5">Organizations</Typography>
                            </div>
                            <p className={styles['summary']}>Manage partner organizations available for user accounts and reporting.</p>
                        </div>
                        <Button variant="contained" type="button" onClick={handleShowForm} startIcon={<AddIcon />}>
                            Create new
                        </Button>
                    </div>

                    <div className={styles['toolbar']}>
                        <TextField
                            className={styles['searchField']}
                            label="Search organizations"
                            id="organization-search"
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
                            <Chip size="small" label={`${orgNames.length} total`} />
                            {normalizedSearch && <Chip size="small" color="primary" variant="outlined" label={`${filteredOrgNames.length} shown`} />}
                        </div>
                    </div>

                    {filteredOrgNames.length === 0 ? (
                        <Box className={styles['emptyState']}>No organizations match this search.</Box>
                    ) : (
                        <List className={styles['list']} aria-label="Organizations">
                            {filteredOrgNames.map((org) => (
                                <ListItem className={styles['row']} key={org} disablePadding>
                                    <ListItemButton className={styles['rowButton']} component="button" onClick={() => setIdToDisplay(orgNamesAndIds[org])}>
                                        <div className={styles['rowMain']}>
                                            <p className={styles['rowTitle']}>{org}</p>
                                            <p className={styles['rowMeta']}>Open organization details</p>
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

export default Organizations;
