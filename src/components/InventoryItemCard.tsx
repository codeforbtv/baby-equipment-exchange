'use client';

import { Box, Card, CardContent, CardActionArea, CardActions, Typography, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import Image from 'next/image';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { InventoryItem } from '@/models/inventoryItem';

type InventoryItemCardProps = {
    inventoryItem: InventoryItem;
    onSelect: (item: InventoryItem) => void;
    handleRequestInventoryItem: (inventoryItem: InventoryItem) => void;
};

export default function InventoryItemCard({ inventoryItem, onSelect, handleRequestInventoryItem }: InventoryItemCardProps) {
    const images = inventoryItem.images as string[];
    const image = images?.[0] || '';
    const canRequest = inventoryItem.status === 'available';

    return (
        <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardActionArea onClick={() => onSelect(inventoryItem)}>
                <Box sx={{ position: 'relative', aspectRatio: '4/3', bgcolor: '#f5f5f5' }}>
                    {image && (
                        <Image
                            src={image}
                            alt={`${inventoryItem.brand} ${inventoryItem.model}`}
                            fill
                            loading="eager"
                            sizes="(max-width: 599px) 100vw, (max-width: 899px) 50vw, (max-width: 1199px) 33vw, 25vw"
                            style={{ objectFit: 'cover' }}
                        />
                    )}
                </Box>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {inventoryItem.brand} {inventoryItem.model}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        {inventoryItem.tagNumber && (
                            <Chip size="small" label={inventoryItem.tagNumber} sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {inventoryItem.category}
                        </Typography>
                    </Stack>
                </CardContent>
            </CardActionArea>
            <CardActions sx={{ p: 1, pt: 0, justifyContent: 'flex-end' }}>
                <Tooltip title={canRequest ? 'Add to order' : 'Only available items can be added'}>
                    <span>
                        <IconButton
                            size="small"
                            color="primary"
                            disabled={!canRequest}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRequestInventoryItem(inventoryItem);
                            }}
                        >
                            <AddShoppingCartIcon fontSize="small" />
                        </IconButton>
                    </span>
                </Tooltip>
            </CardActions>
        </Card>
    );
}
