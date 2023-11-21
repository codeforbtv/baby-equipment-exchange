'use client'
import { connectFunctionsEmulator, httpsCallable, Functions, getFunctions } from 'firebase/functions'

import { getApp } from '@/api/firebase'

const functions = initFunctions()

function initFunctions() {
    const _functions: Functions = getFunctions(getApp(), "us-east1")
    if (
        (process?.env?.NODE_ENV === 'test' || process?.env?.NODE_ENV === 'development') &&
        process?.env?.NEXT_PUBLIC_FIREBASE_EMULATORS_IMPORT_DIRECTORY !== undefined
    ) {
        const FIREBASE_EMULATORS_FUNCTIONS_PORT = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_EMULATORS_FUNCTIONS_PORT ?? '5001')
        connectFunctionsEmulator(_functions, '127.0.0.1', FIREBASE_EMULATORS_FUNCTIONS_PORT)
    }
    return _functions
}
// Functions
const callIsEmailInUse = httpsCallable(functions, 'isEmailInUse')
const callSetClaimForDonationReadAccess = httpsCallable(functions, 'setClaimForDonationReadAccess')
const callToggleCanReadDonations = httpsCallable(functions, 'toggleCanReadDonations')
const callSetClaimForAdmin = httpsCallable(functions, 'setClaimForAdmin')
const callSetClaimForAidWorker = httpsCallable(functions, 'setClaimForAidWorker')
const callSetClaimForNewUser = httpsCallable(functions, 'setClaimForNewUser')
const callSetClaimForVerified = httpsCallable(functions, 'setClaimForVerified')
const callSetClaimForVolunteer = httpsCallable(functions, 'setClaimForVolunteer')
const callToggleClaimForAdmin = httpsCallable(functions, 'toggleClaimForAdmin')
const callToggleClaimForAidWorker = httpsCallable(functions, 'toggleClaimForAidWorker')
const callToggleClaimForVerified = httpsCallable(functions, 'toggleClaimForVerified')
const callToggleClaimForVolunteer = httpsCallable(functions, 'toggleClaimForVolunteer')
const callAddEvent = httpsCallable(functions, 'addEvent')
const callGetImageAsSignedUrl = httpsCallable(functions, 'getImageAsSignedUrl')

export async function isEmailInUse(email: string) {
    const response = await callIsEmailInUse({email: email})
    const data: any = response.data
    return data.value
}

export async function setClaimForNewUser(userId: string) {
    callSetClaimForNewUser({userId: userId})
}

// Action based claims.

export async function setClaimForDonationReadAccess(userId: string, canReadDonations: boolean) {
    callSetClaimForDonationReadAccess({userId: userId, canReadDonations: canReadDonations})
}

export async function toggleCanReadDonations(userId: string) {
    callToggleCanReadDonations({userId: userId})
}

// Role based claims.

export async function setClaimForAdmin(userId: string, isAdmin: boolean) {
    callSetClaimForAdmin({userId: userId, isAdmin: isAdmin})
}

export async function setClaimForAidWorker(userId: string, isAidWorker: boolean) {
    callSetClaimForAidWorker({userId: userId, isAidWorker: isAidWorker})
}

export async function setClaimForVerified(userId: string, isVerified: boolean) {
    callSetClaimForVerified({userId: userId, isVerified: isVerified})
}

export async function setClaimForVolunteer(userId: string, isVolunteer: boolean) {
    callSetClaimForVolunteer({userId: userId, isVolunteer: isVolunteer})
}

export async function toggleClaimForAdmin(userId: string) {
    callToggleClaimForAdmin({userId: userId})
}

export async function toggleClaimForAidWorker(userId: string) {
    callToggleClaimForAidWorker({userId: userId})
}

export async function toggleClaimForVerified(userId: string) {
    callToggleClaimForVerified({userId: userId})
}

export async function toggleClaimForVolunteer(userId: string) {
    callToggleClaimForVolunteer({userId: userId})
}

export async function addEvent(object: any) {
    callAddEvent({object: object})
}

export async function getImageAsSignedUrl(url: string) {
    const response = await callGetImageAsSignedUrl({url: url})
    const data: any = response.data
    return data.url
}
