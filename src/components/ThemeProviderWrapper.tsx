'use client';

import { ThemeProvider } from '@mui/material';
import theme from '@/styles/theme';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
