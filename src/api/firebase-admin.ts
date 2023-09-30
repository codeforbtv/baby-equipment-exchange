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
        donor: true
    })
}


export async function setClaimForAdmin(userId: string, isAdmin: boolean) {
    const adminAuth = getAuth(app)
    const customClaims = (await adminAuth.getUser(userId)).customClaims
    await adminAuth.setCustomUserClaims(userId, {
        admin: isAdmin,
        ...customClaims
    })
}

export async function addEvent(object: any) {

    const createdBy: string = 'server'

    let eventParams: IEvent = {
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