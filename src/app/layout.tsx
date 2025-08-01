//Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
//Fonts
import { montserrat, garamond } from '../styles/fonts';

//Providers
import { UserProvider } from '@/contexts/UserContext';
import { PendingDonationsProvider } from '@/contexts/PendingDonationsContext';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
//Styles
import '../styles/globalStyles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${montserrat.variable} ${garamond.variable}`}>
            <body className="body--wrapper">
                <ThemeProviderWrapper>
                    <PendingDonationsProvider>
                        <UserProvider>
                            <Header />
                            <div className="page--wrapper">{children}</div>
                            <Footer />
                        </UserProvider>
                    </PendingDonationsProvider>
                </ThemeProviderWrapper>
            </body>
        </html>
    );
}
