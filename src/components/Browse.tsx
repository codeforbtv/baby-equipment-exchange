'use client'
//Classes
import { Donation } from '@/models/donation'
//Components
import DonationCard from './DonationCard'
import SearchBar from './SearchBar'
import Filter from './Filter'
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
//Hooks
import React, { useEffect, useState } from 'react'
//Libs
import { getAllDonations, getDonations } from '@/api/firebase-donations'
//Styles
import styles from './Browse.module.css'
import { canReadDonations, getUserId } from '@/api/firebase'

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
            const uid = await getUserId();
            let donations = []
            if (hasReadDonationsPermission === true) {
                donations = await getAllDonations()
            } else {
                donations = await getDonations()
            }
            console.log(donations)
            setDonations(donations)
        }).catch((error) => {
            console.log(error)
            // eslint-disable-line no-empty
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
            <div className={styles['browse__grid']}>
                {donations.map((donation) => {
                    // An active donation must have at least one photo for display.
                    return (
                        <DonationCard
                                key={donation.images[0]}
                                category={donation.category}
                                brand={donation.brand}
                                model={donation.model}
                                description={donation.description}
                                active={donation.active}
                                images={donation.images}
                                createdAt={donation.createdAt.toDate()}
                                modifiedAt={donation.modifiedAt.toDate()}
                            />
                    )
                })}
            </div>
        </>
    )
}

export default Browse
