'use client';

import { useState } from 'react';
import { Box, Button, Dialog, DialogActions } from '@mui/material';
import Image from 'next/image';

type ReportImagesCellProps = {
    value: string;
};

export default function ReportImagesCell({ value }: ReportImagesCellProps) {
    const [openUrl, setOpenUrl] = useState<string | null>(null);
    const urls = value.split(', ').filter(Boolean);
    if (urls.length === 0) return null;

    return (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
            {urls.map((url, i) => (
                <Image
                    key={i}
                    src={url}
                    alt={`Item photo ${i + 1}`}
                    width={28}
                    height={28}
                    loading="lazy"
                    onClick={() => setOpenUrl(url)}
                    style={{ objectFit: 'cover', borderRadius: 2, cursor: 'pointer' }}
                />
            ))}
            <Dialog open={openUrl !== null} onClose={() => setOpenUrl(null)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary-size lightbox image, same as ImageGallery */}
                {openUrl && <img src={openUrl} alt="Item photo" style={{ maxWidth: '100%' }} />}
                <DialogActions>
                    <Button onClick={() => setOpenUrl(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
