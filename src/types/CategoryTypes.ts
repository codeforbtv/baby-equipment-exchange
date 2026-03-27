export type CategoryType = {
    name: string;
    tagPrefix: string;
    tagCount: number;
    active: boolean;
    description?: string;
};

export type categoryBody = {
    name: string;
    tagPrefix: string;
    description?: string;
};
