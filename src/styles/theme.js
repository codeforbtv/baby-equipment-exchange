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
            fontFamily: montserrat.style.fontFamily
        },
        body1: {
            fontFamily: garamond.style.fontFamily
        },
        body2: {
            fontFamily: garamond.style.fontFamily,
            fontStyle: 'italic'
        }
    }
});

export default theme;
