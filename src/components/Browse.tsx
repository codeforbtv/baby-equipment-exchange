'use client'
//Classes
import { Donation } from '@/models/donation'
//Components
import DonationCard from './DonationCard'
import SearchBar from './SearchBar'
import Filter from './Filter'
//Components
import { ImageList } from '@mui/material'
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
//Hooks
import React, { useEffect, useState } from 'react'
//Libs
import { addEvent } from '@/api/firebase-admin'
import { getAllDonations, getDonations } from '@/api/firebase-donations'
import { canReadDonations } from '@/api/firebase'
//Styles
import styles from './Browse.module.css'

const Browse: React.FC = () => {
    const [donations, setDonations] = useState([] as Donation[])
    const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false)
    const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false)

    function toggleSearchBar() {
        setIsSearchVisible((prev: any) => !prev)
    }
    function toggleFilters() {
        setIsFilterVisible((prev: any) => !prev)
    }

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */
    useEffect(() => {
        canReadDonations()
        .then(async (hasReadDonationsPermission) => {
            let donations = []
            if (hasReadDonationsPermission === true) {
                donations = await getAllDonations()
            } else {
                donations = await getDonations()
            }
            setDonations(donations)
        }).catch((error) => {
            addEvent({location: 'component/Browse', error: error})
        })
    }, [])

    return (
        <>
            <div className={styles['browse__header']}>
                <div>Tabs</div>
                <div className={styles['header__icons']}>
                    <div onClick={toggleSearchBar}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </div>
                    <div onClick={toggleFilters}>
                        <FontAwesomeIcon icon={faFilter} />
                    </div>
                </div>
            </div>
            {isSearchVisible && <SearchBar />}
            {isFilterVisible && <Filter />}
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
                    )})}
            </ImageList>
        </>
    )
}

export default Browse
