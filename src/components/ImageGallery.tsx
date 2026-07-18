'use client';

import { useState } from 'react';
import { Box, Chip, Dialog, DialogActions, Button, Stack } from '@mui/material';

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
                            component="img"
                            src={image}
                            alt={`${alt} thumbnail ${index + 1}`}
                            onClick={() => setSelectedIndex(index)}
                            sx={{
                                width: 72,
                                height: 72,
                                flexShrink: 0,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: index === selectedIndex ? '2.5px solid' : '2.5px solid transparent',
                                borderColor: index === selectedIndex ? 'primary.main' : 'transparent'
                            }}
                        />
                    ))}
                </Stack>
            )}

            <Dialog open={isLightboxOpen} onClose={() => setIsLightboxOpen(false)}>
                <img src={selectedImage} alt={alt} style={{ maxWidth: '100%' }} />
                <DialogActions>
                    <Button onClick={() => setIsLightboxOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
