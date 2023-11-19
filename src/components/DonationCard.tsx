//Icons
import InfoIcon from '@mui/icons-material/Info';
//Styles
import styles from './Card.module.css'
import { IconButton, ImageListItem, ImageListItemBar } from '@mui/material'

type DonationCardProps = {
    category: string | null | undefined
    brand: string | null | undefined
    model: string | null | undefined
    description: string | null | undefined
    active: boolean | null | undefined
    images: Array<string>
}

export default function DonationCard({ category, brand, model, description, active, images}: DonationCardProps) {
    const image = images[0]
    return (
        <ImageListItem key={image} className={styles['grid__item']}>
        <img
          src={image}
          style={{width: "100%", height: "100%", objectFit: "fill"}}
          alt={`Brand ${brand} and model ${model} description ${description}`}
        />
        <ImageListItemBar
          title={brand}
          subtitle={model}
          actionIcon={
            <IconButton
              sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
              aria-label={`details about ${brand} ${model}`}
            >
              <InfoIcon />
            </IconButton>
          }
        />
      </ImageListItem>
    )
}
