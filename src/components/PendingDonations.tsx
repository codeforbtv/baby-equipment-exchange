'use client';

import { DonationFormData } from '@/app/donate/page';
import ImageThumbnail from './ImageThumbnail';
import { removeImageFromState } from '@/controllers/images';
import { Key } from '@mui/icons-material';

type pendingDonationProps = {
    pendingDonations: DonationFormData[];
    removeHandler: (index: number) => void;
};

export default function PendingDontions(props: pendingDonationProps) {
    return (
        <div>
            <p>Pending Donations</p>
            <div>
                {props.pendingDonations.map((donation, i) => {
                    if (donation.images)
                        return (
                            <div key={i}>
                                <ImageThumbnail removeFunction={() => {}} file={donation.images[0]} width={'32%'} margin={'.66%'} />
                                <ul>
                                    <li>{donation.brand}</li>
                                    <li>{donation.category}</li>
                                    <li>{donation.description}</li>
                                    <li>{donation.model}</li>
                                </ul>
                                <button type="button" onClick={() => props.removeHandler(i)}>
                                    X
                                </button>
                            </div>
                        );
                })}
            </div>
        </div>
    );
}
