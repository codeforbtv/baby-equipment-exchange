'use client';
import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#3d9991'
        }
    },
    typography: {
        fontFamily: ['var(--font-montserrat)', 'var(--font-garamond)'].join(','),
        h1: {
            fontFamily: 'var(--font-montserrat)'
        },
        h2: {
            fontFamily: 'var(--font-montserrat)'
        },
        h3: {
            fontFamily: 'var(--font-montserrat)'
        },
        h4: {
            fontFamily: 'var(--font-montserrat)'
        },
        body1: {
            fontFamily: 'var(--font-garamond)'
        },
        body2: {
            fontFamily: 'var(--font-garamond)',
            fontStyle: 'italic'
        }
    }
});

export default theme;
