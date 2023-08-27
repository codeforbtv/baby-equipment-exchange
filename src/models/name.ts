interface IName {
    first: string | null | undefined;
    last: string | null | undefined;
    honorific: string | null | undefined;
    suffix: string | null | undefined;
}

export class Name implements IName {
    first: string | null | undefined;
    last: string | null | undefined;
    honorific: string | null | undefined;
    suffix: string | null | undefined;

    constructor(first: string | null | undefined, last: string | null | undefined, honorific: string | null | undefined, suffix: string | null | undefined) {
        this.first = first;
        this.last = last;
        this.honorific = honorific;
        this.suffix = suffix;
    }

    getFirst(): string | null | undefined {
        return this.first;
    }

    getLast(): string | null | undefined {
        return this.last;
    }

    getHonorific(): string | null | undefined {
        return this.honorific;
    }

    getSuffix(): string | null | undefined {
        return this.suffix;
    }
}
