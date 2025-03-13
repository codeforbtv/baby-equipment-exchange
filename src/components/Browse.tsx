'use client';
// Models
import { Donation } from '@/models/donation';
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
import React, { Suspense, lazy, useEffect, useState } from 'react';
// Libs
import { getDonations } from '@/api/firebase-donations';
import { addErrorEvent } from '@/api/firebase';

import algoliasearch from 'algoliasearch/lite';
import { InstantSearch } from 'react-instantsearch';
// Styles
import '../styles/globalStyles.css';
import styles from './Browse.module.css';

const NewDonationDialog = lazy(() => import('@/components/NewDonationDialog'));

const Browse: React.FC = () => {
    const [donations, setDonations] = useState<Donation[] | null>();
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [showHits, setShowHits] = useState<boolean>(false);
    const [isDialogActive, setIsDialogActive] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

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
        try {
            const donations = await getDonations(null);
            setDonations(donations);
            setIsLoading(false);
        } catch (error: any) {
            addErrorEvent('fetchDonations', error);
        }
    }

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */
    useEffect(() => {
        (async () => {
            fetchDonations();
        })();
    }, []);

    const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY;

    if (isLoading) return <Loader />;

    return donations == null ? (
        'No donations found.'
    ) : (
        <>
            <div className={styles['browse__header']}>
                <div>
                    <Button onClick={handleNewDonation}>New Donation</Button>
                    <Suspense fallback={<Loader />}>
                        <NewDonationDialog initialParameters={{ initAsOpen: isDialogActive }} controllers={{ closeController: closeDialog }} />
                    </Suspense>
                </div>
            </div>
            {donations.length == 0 ? (
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
                            .sort((a, b) => b.modifiedAt.toDate().getTime() - a.modifiedAt.toDate().getTime())
                            .map((donation) => {
                                // An active donation must have at least one photo for display.
                                return (
                                    <DonationCard
                                        key={donation.id}
                                        id={donation.id}
                                        category={donation.category}
                                        brand={donation.brand}
                                        model={donation.model}
                                        description={donation.description}
                                        active={donation.active}
                                        images={donation.images as string[]}
                                    />
                                );
                            })}
                    </ImageList>
                </>
            )}
        </>
    );
};

export default Browse;
