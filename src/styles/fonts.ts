import { Montserrat, EB_Garamond } from 'next/font/google';

export const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat'
});

export const garamond = EB_Garamond({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-garamond'
});
