export interface IPhone {
    type: string | null | undefined;
    number: string | null | undefined;
    extension: string | null | undefined;
}

export class Phone implements IPhone {
    type: string | null | undefined;
    number: string | null | undefined;
    extension: string | null | undefined;

    constructor(args: IPhone) {
        this.type = args.type;
        this.number = args.number;
        this.extension = args.extension;
    }

    getType(): string | null | undefined {
        return this.type;
    }

    getNumber(): string | null | undefined {
        return this.number;
    }

    getExtension(): string | null | undefined {
        return this.extension;
    }
}
