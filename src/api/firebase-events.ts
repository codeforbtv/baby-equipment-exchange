// Modules
import { DocumentData, DocumentReference, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import * as admin from 'firebase-admin';
// import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FieldValue, getFirestore } from 'firebase/firestore';
//import { App, applicationDefault } from 'firebase-admin/app';
//import { App, applicationDefault } from 'firebase/';
import { firebaseConfig } from './config';
// Models
import { IEvent, Event } from '@/models/event';

export const EVENTS_COLLECTION = 'Event';

// const app: App = admin.initializeApp({
//     credential: applicationDefault(),
//     ...firebaseConfig
// });

import { app } from '@/api/firebase';

export async function addEvent(object: any) {
    try {
        const db = getFirestore(app);
        const currentTime = new Date();
        const currentTimeString = currentTime.toDateString();
        const eventParams: IEvent = {
            type: '',
            note: JSON.stringify(object),
            createdBy: 'system',
            createdAt: currentTimeString,
            modifiedAt: currentTimeString
        };
        await db.collection(EVENTS_COLLECTION).add(eventParams);
    } catch (error) {
        console.log(error);
    }
}

const eventConverter = {
    toFirestore(event: Event): DocumentData {
        const eventData: IEvent = {
            type: event.getType(),
            note: event.getNote(),
            createdBy: event.getCreatedBy(),
            createdAt: event.getCreatedAt(),
            modifiedAt: event.getModifiedAt()
        };
        return eventData;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Event {
        const data = snapshot.data(options);
        const eventData: IEvent = {
            type: data.type,
            note: data.note,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        };
        return new Event(eventData);
    }
};
