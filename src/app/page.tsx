import Browse from '@/components/Browse'
import React from 'react'

import { UserContext } from '@/contexts/UserContext'
import { useContext } from 'react'

export default function Home() {
    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Browse />
        </div>
    )
}
