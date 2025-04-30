'use client';

import { DonationFormData } from '@/app/donate/page';
import ImageThumbnail from './ImageThumbnail';
import { removeImageFromState } from '@/controllers/images';

type pendingDonationProps = {
    pendingDonations: DonationFormData[];
};

export default function PendingDontions(props: pendingDonationProps) {
    return (
        <div>
            <p>PendingDonations</p>
            <div>
                {props.pendingDonations.map((donation, i) => {
                    if (donation.images)
                        return (
                            <>
                                <ImageThumbnail key={i} removeFunction={() => {}} file={donation.images[0]} width={'32%'} margin={'.66%'} />
                                <ul>
                                    <li>{donation.brand}</li>
                                    <li>{donation.category}</li>
                                    <li>{donation.description}</li>
                                    <li>{donation.model}</li>
                                </ul>
                            </>
                        );
                })}
            </div>
        </div>
    );
}
