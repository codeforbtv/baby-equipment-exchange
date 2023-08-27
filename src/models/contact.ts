//Plain JavaScript objects
import { Phone } from './phone';

export interface IContact {
    user: string | null | undefined;
    name: string | null | undefined;
    email: string | null | undefined;
    phone: Phone | null | undefined;
    website: string | null | undefined;
    notes: string | null | undefined;
}

export class Contact implements IContact {
    user: string | null | undefined;
    name: string | null | undefined;
    email: string | null | undefined;
    phone: Phone | null | undefined;
    website: string | null | undefined;
    notes: string | null | undefined;

    constructor(args: IContact) {
        this.user = args.user;
        this.name = args.name;
        this.email = args.email;
        this.phone = args.phone;
        this.website = args.website;
        this.notes = args.notes;
    }

    getUser(): string | null | undefined {
        return this.user;
    }

    getName(): string | null | undefined {
        return this.name;
    }

    getEmail(): string | null | undefined {
        return this.email;
    }

    getPhone(): Phone | null | undefined {
        return this.phone;
    }

    getWebsite(): string | null | undefined {
        return this.website;
    }

    getNotes(): string | null | undefined {
        return this.notes;
    }
}
