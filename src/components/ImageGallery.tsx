'use client';

import { useState } from 'react';
import { Box, Chip, Dialog, DialogActions, Button, Stack } from '@mui/material';
import Image from 'next/image';

type ImageGalleryProps = {
    images: string[];
    alt: string;
};

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    if (!images || images.length === 0) return null;

    const selectedImage = images[Math.min(selectedIndex, images.length - 1)];

    return (
        <>
            <Box
                onClick={() => setIsLightboxOpen(true)}
                sx={{
                    position: 'relative',
                    height: 300,
                    bgcolor: '#0f1917',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer'
                }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element -- full-view image, letterboxed at its natural aspect ratio */}
                <img src={selectedImage} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                <Chip
                    size="small"
                    label={`${Math.min(selectedIndex, images.length - 1) + 1} / ${images.length}`}
                    sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0, 0, 0, 0.6)', color: 'white' }}
                />
            </Box>
            {images.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 0.5 }}>
                    {images.map((image, index) => (
                        <Box
                            key={image}
                            onClick={() => setSelectedIndex(index)}
                            sx={{
                                position: 'relative',
                                width: 72,
                                height: 72,
                                flexShrink: 0,
                                borderRadius: 1,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: index === selectedIndex ? '2.5px solid' : '2.5px solid transparent',
                                borderColor: index === selectedIndex ? 'primary.main' : 'transparent'
                            }}
                        >
                            <Image src={image} alt={`${alt} thumbnail ${index + 1}`} fill sizes="72px" style={{ objectFit: 'cover' }} />
                        </Box>
                    ))}
                </Stack>
            )}

            <Dialog open={isLightboxOpen} onClose={() => setIsLightboxOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary-size lightbox image */}
                <img src={selectedImage} alt={alt} style={{ maxWidth: '100%' }} />
                <DialogActions>
                    <Button onClick={() => setIsLightboxOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
