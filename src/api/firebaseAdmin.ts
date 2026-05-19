import 'server-only';

import fs from 'fs';
import path from 'path';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

import { convertToString } from '@/utils/utils';
import { AuthUserRecord } from '@/types/UserTypes';

export const EVENTS_COLLECTION = 'Event';
export const USERS_COLLECTION = 'Users';
export const DONATIONS_COLLECTION = 'Donations';
export const ORGANIZATIONS_COLLECTION = 'Organizations';
export const ORDERS_COLLECTION = 'Orders';

export async function initAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    return initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

const app = await initAdmin();
export const auth = getAuth(app);
export const db = getFirestore(app);

export function findPaths(fileNames: string[]): string[] {
    const filePaths = [];
    const directoryPath = process.env.IMPORT_DIRECTORY
        ? process.env.IMPORT_DIRECTORY
        : '';
    const files = fs.readdirSync(directoryPath, { withFileTypes: true });
    for (const file of files) {
        const filePath = path.join(directoryPath, file.name);
        if (fileNames && fileNames.includes(file.name))
            filePaths.push(filePath);
    }
    return filePaths;
}

export async function getAuthUserById(uid: string): Promise<AuthUserRecord> {
    try {
        const user = await auth.getUser(uid);
        const authUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            disabled: user.disabled,
            metadata: user.metadata,
            customClaims: user.customClaims
        };
        return JSON.parse(JSON.stringify(authUser));
    } catch (error) {
        console.log(error);
    }
    return Promise.reject();
}

export async function addErrorEvent(
    location: string,
    error: any
): Promise<void> {
    try {
        const currentTime = new Date().toDateString();
        await db.collection(EVENTS_COLLECTION).add({
            type: '',
            note: JSON.stringify({ location, error: convertToString(error) }),
            createdBy: 'system',
            createdAt: currentTime,
            modifiedAt: currentTime
        });
    } catch (err) {
        console.error(err);
    }
}
