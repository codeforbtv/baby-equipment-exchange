//Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
//Fonts
import { montserrat, garamond } from '../styles/fonts';

//Providers
import { UserProvider } from '@/contexts/UserContext';
import { PendingDonationsProvider } from '@/contexts/PendingDonationsContext';
import { RequestedInventoryProvider } from '@/contexts/RequestedInventoryContext';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';
//Styles
import '../styles/globalStyles.css';

const fontClassNames = [montserrat, garamond].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={fontClassNames}>
            <body className="body--wrapper">
                <ThemeProviderWrapper>
                    <PendingDonationsProvider>
                        <UserProvider>
                            <RequestedInventoryProvider>
                                <Header />
                                <div className="page--wrapper">{children}</div>
                                <Footer />
                            </RequestedInventoryProvider>
                        </UserProvider>
                    </PendingDonationsProvider>
                </ThemeProviderWrapper>
            </body>
        </html>
    );
}
