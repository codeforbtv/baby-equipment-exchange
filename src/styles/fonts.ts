import { Montserrat, EB_Garamond } from 'next/font/google';

export const montserrat = Montserrat({
    weight: 'variable',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat'
});

export const garamond = EB_Garamond({
    weight: 'variable',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-garamond'
});
