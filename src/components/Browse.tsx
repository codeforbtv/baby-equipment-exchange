'use client'
//Classes
import { Donation } from '../models/donation'
//Components
import DonationCard from './DonationCard'
//Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faFilter} from '@fortawesome/free-solid-svg-icons'
//Hooks
import React, { useEffect, useState } from 'react'
//Libs
import { getActiveDonations } from '../api/firebase-donations'
//Styles
import styles from './Browse.module.css'

const dummyDonations: Donation[] = [
    new Donation('category', 'brand', 'model', 'description', true, ['img1'], new Date(), new Date()),
    new Donation('category', 'brand', 'model', 'description', true, ['img1'], new Date(), new Date()),
    new Donation('category', 'brand', 'model', 'description', true, ['img1'], new Date(), new Date()),
    new Donation('category', 'brand', 'model', 'description', true, ['img1'], new Date(), new Date()),
    new Donation('category', 'brand', 'model', 'description', true, ['img1'], new Date(), new Date())
]


const Browse: React.FC = () => {
    const [donations, setDonations] = useState([] as Donation[])

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */
    useEffect(() => {
        /*Using dummy data for UI testing*/
         setDonations(dummyDonations)
        
         /*
        getActiveDonations().then((response) => {
            setDonations(response)
        })
        */
    }, [])

    return (
        <>
        <div className={styles['browse__header']}>
            <div>Tabs</div>
            <FontAwesomeIcon icon={faFilter} />
        </div>
        <div className = {styles['browse__grid']}>
            {donations.map((donation) => {
                // An active donation must have at least one photo for display.
                return <DonationCard 
                category={donation.category}
                brand={donation.brand}
                model={donation.model}
                description={donation.description}
                active={donation.active}
                images={donation.images}
                createdAt={donation.createdAt}
                modifiedAt={donation.modifiedAt} />
            })}
        </div>
        </>
    )
}

export default Browse
