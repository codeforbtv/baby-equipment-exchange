'use server'

import admin from 'firebase-admin'
import { App, getApp } from 'firebase-admin/app'
import { getAuth, Auth, UserRecord } from 'firebase-admin/auth'
import { IEvent, Event } from '@/models/event'
import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { getDb } from './firebase'
import { EVENTS_COLLECTION } from './firebase-events'

const app: App = initApp()

function initApp(): App {
    let _app: App
    let tryInitialize = false
    // If an Error is thrown, assume the app has not yet been initialized
    try {
        _app = getApp('admin')
    } catch (error) {
        tryInitialize = true
    }
    if (tryInitialize === true) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs') // Suppress the @typescript-eslint/no-var-requires rule.
        const serviceAccount = fs.existsSync('./serviceAccountKey.json') ? require('../../serviceAccountKey.json') : undefined
        _app = admin.initializeApp(
            {
                credential: admin.credential.cert(serviceAccount)
            },
            'admin'
        )
    }
    return _app!
}

function initAuth(): Auth {
    return getAuth(app)
}

export async function isEmailInUse(email: string): Promise<boolean> {
    try {
        const userRecord: UserRecord = await getAuth(app).getUserByEmail(email)
        if (userRecord !== undefined) {
            return true
        }
    } catch (error) {
        // eslint-disable-line no-empty
    }
    return false
}

export async function setClaimForNewUser(userId: string) {
    await getAuth(app).setCustomUserClaims(userId, {
        donor: true,
        verified: true
    })
}

// Action based claims.
export async function setClaimForDonationReadAccess(userId: string, canReadDonations: boolean) {
    const claimName = 'can-read-donations'
    setClaim(userId, claimName, canReadDonations)
}

export async function toggleCanReadDonations(userId: string) {
    const claimName = 'can-read-donations'
    const currentClaim = await checkClaim(userId, claimName)
    setClaim(userId, claimName, !currentClaim)
}

// Role based claims.

export async function setClaimForAdmin(userId: string, isAdmin: boolean) {
    const claimName = 'admin'
    setClaim(userId, claimName, isAdmin)
}

export async function setClaimForAidWorker(userId: string, isAidWorker:boolean) {
    const claimName = 'aid-worker'
    setClaim(userId, claimName, isAidWorker)
}

export async function setClaimForVerified(userId: string, isVerified: boolean) {
    const claimName = 'verified'
    setClaim(userId, claimName, isVerified)
}

export async function setClaimForVolunteer(userId: string, isVolunteer: boolean) {
    const claimName = 'volunteer'
    setClaim(userId, claimName, isVolunteer)
}

export async function toggleClaimForAdmin(userId: string) {
    const claimName = 'admin'
    toggleClaim(userId, claimName)
}

export async function toggleClaimForAidWorker(userId: string) {
    const claimName = 'aid-worker'
    toggleClaim(userId, claimName)
}

export async function toggleClaimForVerified(userId: string) {
    const claimName = 'verified'
    toggleClaim(userId, claimName)
}

export async function toggleClaimForVolunteer(userId: string) {
    const claimName = 'volunteer'
    toggleClaim(userId, claimName)
}

async function toggleClaim(userId: string, claimName: string) {
    const adminAuth = getAuth(app)
    const claims = (await adminAuth.getUser(userId)).customClaims
    if (claims === undefined || claims === null) {
        return Promise.reject()
    }
    let claimValue = claims[claimName];
    if (claimValue === undefined || claimValue === null) {
        setClaim(userId, claimName, false)
    } else {
        setClaim(userId, claimName, !claimValue)
    }
}

async function setClaim(userId: string, claimName: string, claimValue: any) {
    const adminAuth = getAuth(app)
    const customClaims = (await adminAuth.getUser(userId)).customClaims
    adminAuth.setCustomUserClaims(userId, {
        [claimName]: claimValue,
        ...customClaims
    })
}

async function checkClaim(userId: string, claimName: string): Promise<boolean> {
    const adminAuth = getAuth(app)
    const claims = (await adminAuth.getUser(userId)).customClaims
    if (claims === undefined || claims === null) {
        return Promise.reject()
    }
    let claimValue = claims[claimName];
    return (claimValue !== undefined && claimValue === true) ? true : false
}

export async function addEvent(object: any) {

    const createdBy: string = 'server'

    const eventParams: IEvent = {
        type: '',
        note: JSON.stringify(object),
        createdBy: createdBy,
        createdAt: serverTimestamp() as Timestamp,
        modifiedAt: serverTimestamp() as Timestamp
    }

    const event: Event = new Event(eventParams);
    const eventRef = doc(getDb(), EVENTS_COLLECTION)
    await setDoc(eventRef, event)
}