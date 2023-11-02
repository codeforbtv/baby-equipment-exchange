//Modules
import {
    DocumentData,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from 'firebase/firestore'
//Models
import { IEvent, Event } from '@/models/event'
//Libs
import { getDb } from './firebase'

export const EVENTS_COLLECTION = 'Event'

const eventConverter = {
    toFirestore(event: Event): DocumentData {
        const eventData: IEvent = {
            type: event.getType(),
            note: event.getNote(),
            createdBy: event.getCreatedBy(),
            createdAt: event.getCreatedAt(),
            modifiedAt: event.getModifiedAt()
        }
        return eventData
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Event {
        const data = snapshot.data(options)
        const eventData: IEvent = {
            type: data.type,
            note: data.note,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            modifiedAt: data.modifiedAt
        }
        return new Event(eventData)
    }
}