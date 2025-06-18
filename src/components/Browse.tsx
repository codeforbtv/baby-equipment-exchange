'use client';
// Models
import { Donation, InventoryItem } from '@/models/donation';
// Components
import DonationCard from './DonationCard';
import Filter from './Filter';
import Loader from './Loader';
import SearchBar from './SearchBar';
import AlgoliaHits from './AlgoliaHits';
import AlgoliaSearchBox from './AlgoliaSearchBox';
import { Button, ImageList } from '@mui/material';
// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
// Hooks
import React, { Suspense, lazy, useEffect, useState, useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';
// Libs
import { getAllDonations, deleteDonationById, getInventory } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch } from 'react-instantsearch';
// Styles
import '../styles/globalStyles.css';
import styles from './Browse.module.css';
import { DonationCardProps } from '@/types/DonationCardProps';

const NewDonationDialog = lazy(() => import('@/components/NewDonationDialog'));

const Browse: React.FC = () => {
    const [donations, setDonations] = useState<Donation[] | null>();
    const [inventory, setInventory] = useState<InventoryItem[] | null>();
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [showHits, setShowHits] = useState<boolean>(false);
    const [isDialogActive, setIsDialogActive] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const currentUser = useContext(UserContext);

    function openDialog() {
        setIsDialogActive(true);
    }

    function closeDialog() {
        setIsDialogActive(false);
        fetchDonations();
    }

    function handleNewDonation() {
        openDialog();
    }

    function toggleSearchBar() {
        setIsSearchVisible((prev: any) => !prev);
    }

    function toggleFilters() {
        setIsFilterVisible((prev: any) => !prev);
    }

    async function fetchDonations() {
        if (currentUser.isAdmin) {
            try {
                setIsLoading(true);
                const donations = await getAllDonations();
                setDonations(donations);
                setIsLoading(false);
            } catch (error: any) {
                addErrorEvent('fetchDonations', error);
            }
        } else if (currentUser.isAidWorker) {
            try {
                setIsLoading(true);
                const inventory = await getInventory();
                setInventory(inventory);
                setIsLoading(false);
            } catch (error) {
                addErrorEvent('Fetch inventory', error);
            }
        } else {
            setIsLoading(false);
            return;
        }
    }

    async function deleteDonation(id: string) {
        if (currentUser.isAdmin) {
            try {
                await deleteDonationById(id);
                fetchDonations();
            } catch (error: any) {
                addErrorEvent('component/Browse', error);
            }
        } else {
            return;
        }
    }

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */

    useEffect(() => {
        fetchDonations();
    }, []);

    const algoliaApiKey = process.env.ALGOLIA_API_KEY;

    if (isLoading) return <Loader />;

    return (
        <>
            <div className={styles['browse__header']}>
                <div>
                    <Button onClick={handleNewDonation}>New Donation</Button>
                    <Suspense fallback={<Loader />}>
                        <NewDonationDialog initialParameters={{ initAsOpen: isDialogActive }} controllers={{ closeController: closeDialog }} />
                    </Suspense>
                </div>
            </div>
            {inventory != undefined && inventory.length > 0 && console.log(inventory)}
            {donations == null || donations.length == 0 ? (
                <p>There are no donations available to view.</p>
            ) : (
                <>
                    <div className={styles['header__icons']}>
                        <div onClick={toggleSearchBar}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </div>
                        <div onClick={toggleFilters}>
                            <FontAwesomeIcon icon={faFilter} />
                        </div>
                    </div>
                    <>
                        {
                            //only show search if an Algolia API Key is set,
                            isSearchVisible &&
                                (algoliaApiKey != undefined ? (
                                    <InstantSearch searchClient={algoliasearch('HIVWVAMJA9', algoliaApiKey)} indexName="donations">
                                        <AlgoliaSearchBox inputHandler={setShowHits} />
                                        {showHits && <AlgoliaHits />}
                                    </InstantSearch>
                                ) : (
                                    <div>Search currently disabled</div>
                                ))
                        }
                    </>
                    <>{isFilterVisible && <Filter />}</>
                    <ImageList className={styles['browse__grid']}>
                        {donations
                            .sort((a, b) => {
                                if (a.modifiedAt && b.modifiedAt) {
                                    return b.modifiedAt.toDate().getTime() - a.modifiedAt.toDate().getTime();
                                }
                                return 0;
                            })
                            .map((donation) => {
                                const props: DonationCardProps = {
                                    ...donation,
                                    images: donation.images as string[]
                                };

                                // An active donation must have at least one photo for display.
                                return <DonationCard key={donation.id} donation={props} onDelete={deleteDonation} />;
                            })}
                    </ImageList>
                </>
            )}
        </>
    );
};

export default Browse;
