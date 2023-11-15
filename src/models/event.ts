import { DocumentReference, Timestamp } from "firebase/firestore";

export interface IEvent {
    type: string
    note: string
    createdBy: DocumentReference
    createdAt: Timestamp
    modifiedAt: Timestamp
}

export class Event implements IEvent {
    type: string
    note: string
    createdBy: DocumentReference
    createdAt: Timestamp
    modifiedAt: Timestamp

    constructor(args: IEvent) {
        this.type = args.type
        this.note = args.note
        this.createdBy = args.createdBy
        this.createdAt = args.createdAt
        this.modifiedAt = args.modifiedAt
    }

    getType(): string {
        return this.type
    }

    getNote(): string {
        return this.note
    }

    getCreatedBy(): DocumentReference {
        return this.createdBy
    }

    getCreatedAt(): Timestamp {
        return this.createdAt
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt
    }
}