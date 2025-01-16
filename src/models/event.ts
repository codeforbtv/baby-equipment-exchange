import { DocumentReference } from 'firebase/firestore';

export interface IEvent {
    type: string;
    note: string;
    createdBy: DocumentReference | string;
    createdAt: string;
    modifiedAt: string;
}

export class Event implements IEvent {
    type: string;
    note: string;
    createdBy: DocumentReference | string;
    createdAt: string;
    modifiedAt: string;

    constructor(args: IEvent) {
        this.type = args.type;
        this.note = args.note;
        this.createdBy = args.createdBy;
        this.createdAt = args.createdAt;
        this.modifiedAt = args.modifiedAt;
    }

    getType(): string {
        return this.type;
    }

    getNote(): string {
        return this.note;
    }

    getCreatedBy(): DocumentReference | string {
        return this.createdBy;
    }

    getCreatedAt(): string {
        return this.createdAt;
    }

    getModifiedAt(): string {
        return this.modifiedAt;
    }
}
