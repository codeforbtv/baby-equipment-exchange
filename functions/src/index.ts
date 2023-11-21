import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'

import * as admin from 'firebase-admin'
import { App } from 'firebase-admin/app'
import { getAuth, UserRecord } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

setGlobalOptions({
    maxInstances: 10,
    region: "us-east1"
})

const EVENTS_COLLECTION = 'Event'

type Event = {
    type: string;
    note: string;
    createdBy: string;
    createdAt: string;
    modifiedAt: string;
}

const app: App = initApp()

function initApp(): App {
    let _app: App
        const firebaseConfig = require('../../firebaseConfig.json') // eslint-disable-line @typescript-eslint/no-var-requires
	const serviceAccount = require('../../serviceAccountKey.json') // eslint-disable-line @typescript-eslint/no-var-requires
        const appConfig = {
            ...firebaseConfig,
            credential: admin.credential.cert(serviceAccount)
        }
        _app = admin.initializeApp(
            appConfig
        )
    return _app!
}

export const isEmailInUse = onCall(async (request: any) => {
    try {
        const email = request.data.email 
        const userRecord: UserRecord = await getAuth(app).getUserByEmail(email)
        if (userRecord !== undefined) {
            return {value: true}
        }
    } catch (error) {
        _addEvent({location: 'isEmailInUse'})
    }
    return {value: false}
})


export const setClaimForNewUser = onCall(async (request: any) => {
    try {
        const userId = request.data.userId 
        await getAuth(app).setCustomUserClaims(userId, {
            donor: true,
            verified: false
        })
    } catch (error) {
        _addEvent({location: 'setClaimForNewUser'})
    }
})

// Action based claims.
export const setClaimForDonationReadAccess = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const canReadDonations = request.data.canReadDonations
        const claimName = 'can-read-donations'
        setClaim(userId, claimName, canReadDonations)
    } catch (error) {
        _addEvent({location: 'setClaimForDonationReadAccess'})
    }
})

export const toggleCanReadDonations = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const claimName = 'can-read-donations'
        const currentClaim = await checkClaim(userId, claimName)
        setClaim(userId, claimName, !currentClaim)
    } catch (error) {
        _addEvent({location: 'toggleCanReadDonations'})
    }
})

// Role based claims.

export const setClaimForAdmin = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const isAdmin = request.data.isAdmin
        const claimName = 'admin'
        setClaim(userId, claimName, isAdmin)
    } catch (error) {
        _addEvent({location: 'setClaimForAdmin'})
    }
})

export const setClaimForAidWorker = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const isAidWorker = request.data.isAidWorker
        const claimName = 'aid-worker'
        setClaim(userId, claimName, isAidWorker)
    } catch (error) {
        _addEvent({location: 'setClaimForAidWorker'})
    }
})

export const setClaimForVerified = onCall(async (request: any) => {
    try {
         const userId = request.data.userId
         const isVerified = request.data.isVerified
         const claimName = 'verified'
        setClaim(userId, claimName, isVerified)
    } catch (error) {
        _addEvent({location: 'setClaimForVerified'})
    }
})

export const setClaimForVolunteer = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const isVolunteer = request.data.isVolunteer
        const claimName = 'volunteer'
        setClaim(userId, claimName, isVolunteer)
    } catch (error) {
        _addEvent({location: 'setClaimForVolunteer'})
    }
})

export const toggleClaimForAdmin = onCall( async (request: any) => {
    try {
        const userId = request.data.userId
        const claimName = 'admin'
        toggleClaim(userId, claimName)
    } catch (error) {
        _addEvent({location: 'toggleClaimForAdmin'})
    }
})

export const toggleClaimForAidWorker = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const claimName = 'aid-worker'
        toggleClaim(userId, claimName)
    } catch (error) {
        _addEvent({location: 'toggleClaimForAidWorker'})
    }
})

export const toggleClaimForVerified = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const claimName = 'verified'
        toggleClaim(userId, claimName)
    } catch (error) {
        _addEvent({location: 'toggleClaimForVerified'})
    }
})

export const toggleClaimForVolunteer = onCall(async (request: any) => {
    try {
        const userId = request.data.userId
        const claimName = 'volunteer'
        toggleClaim(userId, claimName)
    } catch (error) {
        _addEvent({location: 'toggleClaimForVolunteer'})
    }
})

async function toggleClaim(userId: string, claimName: string) {
    try {
        const adminAuth = getAuth(app)
        const claims = (await adminAuth.getUser(userId)).customClaims
        if (claims === undefined || claims === null) {
            return Promise.reject()
        }
        const claimValue = claims[claimName];
        if (claimValue === undefined || claimValue === null) {
            setClaim(userId, claimName, false)
        } else {
            setClaim(userId, claimName, !claimValue)
        }
    } catch (error) {
        _addEvent({location: 'toggleClaim'})
    }
    return Promise.reject()
}

async function setClaim(userId: string, claimName: string, claimValue: any) {
    try {
        const adminAuth = getAuth(app)
        const customClaims = (await adminAuth.getUser(userId)).customClaims
        adminAuth.setCustomUserClaims(userId, {
            [claimName]: claimValue,
            ...customClaims
        })
    } catch (error) {
        _addEvent({location: 'setClaim'})
    }
}

async function checkClaim(userId: string, claimName: string) {
    try {
        const adminAuth = getAuth(app)
        const claims = (await adminAuth.getUser(userId)).customClaims
        if (claims === undefined || claims === null) {
            return Promise.reject()
        }
         const claimValue = claims[claimName];
        return (claimValue !== undefined && claimValue === true) ? true : false
    } catch (error) {
        _addEvent({location: 'checkClaim'})
    }
    return Promise.reject()
}

export const addEvent = onCall(async (request: any) => {
    try {
        const object = request.data.object
        _addEvent(object)
    } catch (error) {
        logger.error(error)
    }
})

async function _addEvent(object: any) {
     logger.error(object)
     try {
        const currentTime = new Date()
        const currentTimeString = currentTime.toDateString()
        const db = getFirestore(app)
        const eventParams: Event = {
            type: '',
            note: JSON.stringify(object),
            createdBy: 'system',
            createdAt: currentTimeString,
            modifiedAt: currentTimeString
	}
        await db
              .collection(EVENTS_COLLECTION)
              .add(eventParams)
    } catch (error) {
        logger.error(error)
    }
}

export const getImageAsSignedUrl = onCall(async (request: any) => {
    try {
        const url = request.data.url
        const fileName = url.split('/')[3]
        const file = getStorage(app).bucket().file(fileName)
        const accessibleAtTime = new Date()
        const expirationTime = new Date()
        expirationTime.setMinutes(expirationTime.getMinutes() + 2)
        const signedUrlResponse = (await file.getSignedUrl(
            {
                version: 'v4',
                action: 'read',
                accessibleAt: accessibleAtTime,
                expires: expirationTime
            }))
        return {url: signedUrlResponse[0]}
    } catch (error) {
        _addEvent({location: 'getImageAsSignedUrl'})
    }
    return  Promise.reject()
})
