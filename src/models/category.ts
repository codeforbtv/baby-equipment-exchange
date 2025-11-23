import { Timestamp } from 'firebase/firestore';

export interface ICategory {
    [key: string]:
        | boolean
        | string
        | string
        | undefined
        | Timestamp
        | number
        | (() => string)
        | (() => boolean)
        | (() => string | undefined)
        | (() => Timestamp)
        | (() => number);
    id: string;
    active: boolean;
    name: string;
    description?: string;
    modifiedAt: Timestamp;
    tagCount: number;
    tagPrefix: string;
}

export class Category implements ICategory {
    [key: string]:
        | boolean
        | string
        | string
        | undefined
        | Timestamp
        | number
        | (() => string)
        | (() => boolean)
        | (() => string | undefined)
        | (() => Timestamp)
        | (() => number);
    id: string;
    active: boolean;
    name: string;
    description?: string;
    modifiedAt: Timestamp;
    tagCount: number;
    tagPrefix: string;

    constructor(args: ICategory) {
        ((this.id = args.id),
            (this.active = args.active),
            (this.name = args.name),
            (this.description = args.description),
            (this.modifiedAt = args.modifiedAt),
            (this.tagCount = args.tagCount),
            (this.tagPrefix = args.tagPrefix));
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string | undefined {
        return this.description;
    }

    getModifiedAt(): Timestamp {
        return this.modifiedAt;
    }

    getTagCount(): number {
        return this.tagCount;
    }

    getTagPrefix(): string {
        return this.tagPrefix;
    }
}
