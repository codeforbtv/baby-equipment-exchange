'use client';

//Hooks
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import { addErrorEvent } from '@/api/firebase';

//Utils
import { base64ObjToFile, fileToBase64 } from '@/utils/utils';

//Types
import { DonationFormData, base64ImageObj } from '@/types/DonationTypes';

type PendingDonationsContextType = {
    pendingDonations: DonationFormData[];
    addPendingDonation: (pendingDonation: DonationFormData) => void;
    removePendingDonation: (index: number) => void;
    clearPendingDonations: () => void;
    getPendingDonationsFromLocalStorage: () => void;
    pendingDonorName: string;
    pendingDonorEmail: string;
    setPendingDonorName: Dispatch<SetStateAction<string>>;
    setPendingDonorEmail: Dispatch<SetStateAction<string>>;
};

type Props = {
    children: ReactNode;
};

const defaultPendingDonations: DonationFormData[] = [];

export const PendingDonationsContext = createContext<PendingDonationsContextType>({
    pendingDonations: [],
    addPendingDonation: (pendingDonation: DonationFormData) => {},
    removePendingDonation: (index: number) => {},
    clearPendingDonations: () => {},
    getPendingDonationsFromLocalStorage: () => {},
    pendingDonorName: '',
    pendingDonorEmail: '',
    setPendingDonorName: () => {},
    setPendingDonorEmail: () => {}
});

export const PendingDonationsProvider = ({ children }: Props) => {
    const [pendingDonations, setPendingDonations] = useState<DonationFormData[]>(defaultPendingDonations);
    const [pendingDonorName, setPendingDonorName] = useState<string>('');
    const [pendingDonorEmail, setPendingDonorEmail] = useState<string>('');

    const addPendingDonation = (pendingDonation: DonationFormData) => {
        setPendingDonations((prev) => [...prev, pendingDonation]);
    };

    const removePendingDonation = (index: number) => {
        setPendingDonations(pendingDonations.filter((_, i) => index !== i));
    };
    const clearPendingDonations = () => {
        setPendingDonations([]);
    };

    const addPendingDonationsToLocalStorage = async (pendingDonations: DonationFormData[]): Promise<void> => {
        const toLocalStorageArray: DonationFormData[] = [];
        for (let pendingDonation of pendingDonations) {
            const toLocalStorageItem: DonationFormData = {
                category: pendingDonation.category,
                brand: pendingDonation.brand,
                model: pendingDonation.model,
                description: pendingDonation.description,
                images: null,
                base64Images: []
            };
            if (pendingDonation.images) {
                for (let image of pendingDonation.images) {
                    const extension = /[^\.]*$/.exec(image.name)![0];
                    const base64Image = await fileToBase64(image);
                    const base64Obj: base64ImageObj = {
                        base64Image: base64Image,
                        base64ImageName: image.name,
                        base64ImageType: `image/${extension}`
                    };
                    toLocalStorageItem.base64Images?.push(base64Obj);
                }
            }

            toLocalStorageArray.push(toLocalStorageItem);
        }
        localStorage.setItem('pendingDonations', JSON.stringify(toLocalStorageArray));
    };

    const getPendingDonationsFromLocalStorage = async (): Promise<void> => {
        try {
            const existingPendingDonations = localStorage.getItem('pendingDonations');
            if (existingPendingDonations) {
                let fromLocalStorageArray: DonationFormData[] = [];
                const existingDonations = JSON.parse(existingPendingDonations) as DonationFormData[];
                for (let existingDonation of existingDonations) {
                    const fromLocalStorageItem: DonationFormData = {
                        category: existingDonation.category,
                        brand: existingDonation.brand,
                        model: existingDonation.model,
                        description: existingDonation.description,
                        images: []
                    };
                    if (existingDonation.base64Images) {
                        for (let base64image of existingDonation.base64Images) {
                            const image = await base64ObjToFile(base64image);
                            fromLocalStorageItem.images?.push(image);
                        }
                    }
                    fromLocalStorageArray.push(fromLocalStorageItem);
                }
                setPendingDonations(fromLocalStorageArray);
            }
        } catch (error) {
            addErrorEvent('Get pending donations from local storage', error);
        }
        return Promise.reject();
    };

    const value = {
        pendingDonations,
        addPendingDonation,
        removePendingDonation,
        clearPendingDonations,
        getPendingDonationsFromLocalStorage,
        pendingDonorEmail,
        setPendingDonorEmail,
        pendingDonorName,
        setPendingDonorName
    };

    useEffect(() => {
        getPendingDonationsFromLocalStorage();
    }, []);

    useEffect(() => {
        if (pendingDonations != defaultPendingDonations) {
            addPendingDonationsToLocalStorage(pendingDonations);
        }
    }, [pendingDonations]);

    return <PendingDonationsContext.Provider value={value}>{children}</PendingDonationsContext.Provider>;
};

export const usePendingDonationsContext = () => useContext(PendingDonationsContext);
