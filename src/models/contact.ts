import { Name } from './name'
import { Phone } from './phone'

interface IContact {
    user: string | null | undefined
    name: Name | null | undefined
    email: string | null | undefined
    phone: Phone | null | undefined
    website: string | null | undefined
    notes: string | null | undefined
}

export class Contact implements IContact {
    user: string | null | undefined
    name: Name | null | undefined
    email: string | null | undefined
    phone: Phone | null | undefined
    website: string | null | undefined
    notes: string | null | undefined

    constructor(user: string, name: Name | null | undefined, email: string, phone: Phone | null | undefined, website: string, notes: string) {
        this.user = user
        this.name = name
        this.email = email
        this.phone = phone
        this.website = website
        this.notes = notes
    }

    getUser(): string | null | undefined {
        return this.user
    }

    getName(): Name | null | undefined {
        return this.name
    }

    getEmail(): string | null | undefined {
        return this.email
    }

    getPhone(): Phone | null | undefined {
        return this.phone
    }

    getWebsite(): string | null | undefined {
        return this.website
    }

    getNotes(): string | null | undefined {
        return this.notes
    }
}
