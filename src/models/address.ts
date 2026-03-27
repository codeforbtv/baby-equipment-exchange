export interface IAddress {
    line_1: string | null | undefined;
    line_2: string | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    zipcode: string | null | undefined;
}

export class Address implements IAddress {
    line_1: string | null | undefined;
    line_2: string | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    zipcode: string | null | undefined;

    constructor(args: IAddress) {
        this.line_1 = args.line_1;
        this.line_2 = args.line_2;
        this.city = args.city;
        this.state = args.state;
        this.zipcode = args.zipcode;
    }

    getLine_1(): string | null | undefined {
        return this.line_1;
    }

    getLine_2(): string | null | undefined {
        return this.line_2;
    }

    getCity(): string | null | undefined {
        return this.city;
    }

    getState(): string | null | undefined {
        return this.state;
    }

    getZipcode(): string | null | undefined {
        return this.zipcode;
    }
}
