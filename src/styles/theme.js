'use client';
import { createTheme } from '@mui/material';
import { garamond, montserrat } from '@/styles/fonts';

const theme = createTheme({
    palette: {
        primary: {
            main: '#3d9991'
        }
    },
    typography: {
        fontFamily: montserrat.style.fontFamily,
        h1: {
            fontFamily: montserrat.style.fontFamily
        },
        h2: {
            fontFamily: montserrat.style.fontFamily
        },
        h3: {
            fontFamily: montserrat.style.fontFamily
        },
        h4: {
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 600
        },
        h5: {
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 600,
            '@media (max-width:600px)': {
                fontSize: '1.2rem'
            }
        },
        h6: {
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 600,
            color: '#5e5e5e',
            '@media (max-width:600px)': {
                fontSize: '1rem'
            }
        },
        body1: {
            fontFamily: montserrat.style.fontFamily,
            fontWeight: 500
        },
        body2: {
            fontFamily: garamond.style.fontFamily,
            fontStyle: 'italic'
        },
        subtitle1: {
            fontWeight: 500,
            '@media (max-width:600px)': {
                fontSize: '0.8rem'
            }
        }
    }
});

export default theme;
