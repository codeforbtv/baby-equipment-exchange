'use client'

import React, { useEffect, useState } from 'react'
import { getActiveDonations } from '../api/firebase-donations'
import { Donation } from '../models/donation'

const Browse: React.FC = () => {
    const [donations, setDonations] = useState([] as Donation[])

    /**
     * On component render sets the donations state to the active donations retreived from Firebase.
     */
    useEffect(() => {
        getActiveDonations().then((response) => {
            setDonations(response)
        })
    }, [])

    return (
        <div
            className="grid"
            style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}
        >
            {donations.map((donation) => {
                // An active donation must have at least one photo for display.
                const image = "'url(" + donation.images[0] + "')"
                return (
                    <div className="grid-item" key={image} style={{ backgroundImage: image }}>
                        <p className="brand">{donation.brand}</p>
                        <p className="category">{donation.category}</p>
                        <p className="model">{donation.model}</p>
                    </div>
                )
            })}
        </div>
    )
}

export default Browse
