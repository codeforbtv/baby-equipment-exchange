'use client';

import { Typography } from '@mui/material';

const RecallStatuses = () => {
    return (
        <div data-unmask="true">
            <Typography variant="body2">
                Recall statuses can be verified at:{' '}
            </Typography>
            <ul style={{ margin: 0 }}>
                <li>
                    <Typography variant="body2">
                        <a
                            href="https://www.cpsc.gov/"
                            target="_blank"
                        >
                            Consumer Product Safety Commission
                        </a>
                    </Typography>
                </li>
                <li>
                    <Typography variant="body2">
                        <a
                            href="https://www.cpsc.gov/s3fs-public/Resellers-Guide-Updated-Final-3-3--21.pdf"
                            target="_blank"
                        >
                            Reseller&apos;s Guide to Selling Safer Products
                        </a>
                    </Typography>
                </li>
                <li>
                    <Typography variant="body2">
                        <a
                            href="https://www.saferproducts.gov/"
                            target="_blank"
                        >
                            SaferProducts.gov
                        </a>
                    </Typography>
                </li>
                <li>
                    <Typography variant="body2">
                        <a
                            href="https://www.recalls.gov/"
                            target="_blank"
                        >
                            Recalls.gov
                        </a>
                    </Typography>
                </li>
                <li>
                    <Typography variant="body2">
                        <a
                            href="https://www.nhtsa.gov/campaign/safercargov?redirect-safercar-sitewide"
                            target="_blank"
                        >
                            Safercar.gov
                        </a>
                    </Typography>
                </li>
            </ul>
        </div>
    );
};

export default RecallStatuses;
