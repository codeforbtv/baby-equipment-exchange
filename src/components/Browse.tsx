'use client';
// Models
import { Donation } from '@/models/donation';
// Components
import DonationCard from './DonationCard';
import Filter from './Filter';
import Loader from './Loader';
import SearchBar from './SearchBar';
// Components
import { Button, ImageList } from '@mui/material';
// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
// Hooks
import React, { Suspense, lazy, useEffect, useState } from 'react';
// Libs
import { getAllDonations, getDonations } from '@/api/firebase-donations';
import { addEvent, canReadDonations, isAdmin } from '@/api/firebase';
// Styles
import styles from './Browse.module.css';

const NewDonationDialog = lazy(() => import('@/components/NewDonationDialog'));

const Browse: React.FC = () => {
    const [donations, setDonations] = useState<Donation[] | null>();
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
    const [isDialogActive, setIsDialogActive] = useState<boolean>(false);
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    function openDialog() {
        setIsDialogActive(true);
    }

    function closeDialog() {
        setIsDialogActive(false);
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

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */
    useEffect(() => {
        (async () => {
            try {
                const hasReadDonationsPermission = await canReadDonations();
                let donations = [];
                if (hasReadDonationsPermission === true) {
                    donations = await getAllDonations();
                } else {
                    donations = await getDonations();
                }
                setDonations(donations);
                setIsLoading(false);
            } catch (error: any) {
                const keys: any[] = [];
                for (const key in error) {
                    keys.push(key);
                }
                addEvent({ location: 'component/Browse', keys: keys });
            }
        })();
    }, []);

    return isLoading || donations == null ? (
        <Loader />
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
                    <>{isSearchVisible && <SearchBar />}</>
                    <>{isFilterVisible && <Filter />}</>
                    <ImageList className={styles['browse__grid']}>
                        {donations.map((donation) => {
                            // An active donation must have at least one photo for display.
                            return (
                                <DonationCard
                                    key={donation.images[0] as string}
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
