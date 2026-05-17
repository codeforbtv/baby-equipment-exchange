'use client';

import { Card, CardMedia, CardContent, CardActions, Typography, Stack, Chip, Button, CardActionArea } from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { InventoryItem } from '@/models/inventoryItem';

type ItemCardProps = {
    item: InventoryItem;
    onAdd: () => void;
    onOpenDetail: () => void;
};

export default function ItemCard({ item, onAdd, onOpenDetail }: ItemCardProps) {
    const image = typeof item.images[0] === 'string' ? (item.images[0] as string) : '/placeholder.png';

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
            <CardActionArea onClick={onOpenDetail}>
                <CardMedia
                    component="img"
                    image={image}
                    alt={`${item.brand} ${item.model}`}
                    sx={{ aspectRatio: '4/3', objectFit: 'cover' }}
                />
                <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1 } }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {item.brand} {item.model}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        {item.tagNumber && <Chip size="small" label={item.tagNumber} sx={{ height: 20, fontSize: '0.7rem' }} />}
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {item.category}
                        </Typography>
                    </Stack>
                </CardContent>
            </CardActionArea>
            <CardActions sx={{ p: 1.5, pt: 0 }}>
                <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<AddShoppingCartIcon />}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                    }}
                    disabled={item.status !== 'available'}
                >
                    Add to cart
                </Button>
            </CardActions>
        </Card>
    );
}
