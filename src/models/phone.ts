interface IPhone {
    type: string | null | undefined;
    number: string | null | undefined;
    extension: string | null | undefined;
}

export class Phone implements IPhone {
    type: string | null | undefined;
    number: string | null | undefined;
    extension: string | null | undefined;

    constructor(type: string | null | undefined, number: string | null | undefined, extension: string | null | undefined) {
        this.type = type;
        this.number = number;
        this.extension = extension;
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
