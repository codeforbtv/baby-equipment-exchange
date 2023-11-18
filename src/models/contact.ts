import { DocumentReference } from "firebase/firestore"

export interface IContact {
    user: DocumentReference | null | undefined
    name: string | null | undefined
    email: string | null | undefined
    phone: string | null | undefined
    website: string | null | undefined
    notes: string | null | undefined
}

export class Contact implements IContact {
    user: DocumentReference | null | undefined
    name: string | null | undefined
    email: string | null | undefined
    phone: string | null | undefined
    website: string | null | undefined
    notes: string | null | undefined

    constructor(args: IContact) {
        this.user = args.user
        this.name = args.name
        this.email = args.email
        this.phone = args.phone
        this.website = args.website
        this.notes = args.notes
    }

    getUser(): DocumentReference | null | undefined {
        return this.user
    }

    getName(): string | null | undefined {
        return this.name
    }

    getEmail(): string | null | undefined {
        return this.email
    }

    getPhone(): string | null | undefined {
        return this.phone
    }

    getWebsite(): string | null | undefined {
        return this.website
    }

    getNotes(): string | null | undefined {
        return this.notes
    }
}
