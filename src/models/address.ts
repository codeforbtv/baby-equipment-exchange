interface IAddress {
    line_1: string | null | undefined;
    line_2: string | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    zipcode: string | null | undefined;
    latitude: number | null | undefined;
    longitude: number | null | undefined;
}

export class Address implements IAddress {
    line_1: string | null | undefined;
    line_2: string | null | undefined;
    city: string | null | undefined;
    state: string | null | undefined;
    zipcode: string | null | undefined;
    latitude: number | null | undefined;
    longitude: number | null | undefined;

    constructor(
        line_1: string | null | undefined,
        line_2: string | null | undefined,
        city: string | null | undefined,
        state: string | null | undefined,
        zipcode: string | null | undefined,
        latitude: number | null | undefined,
        longitude: number | null | undefined
    ) {
        this.line_1 = line_1;
        this.line_2 = line_2;
        this.city = city;
        this.state = state;
        this.zipcode = zipcode;
        this.latitude = latitude;
        this.longitude = longitude;
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

    getLatitude(): number | null | undefined {
        return this.latitude;
    }

    getLongitude(): number | null | undefined {
        return this.longitude;
    }
}
