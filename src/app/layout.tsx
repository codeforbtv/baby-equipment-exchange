//Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
//Fonts
import { montserrat, garamond } from '../styles/fonts';

//Providers
import { UserProvider } from '@/contexts/UserContext';
//Styles
import globalStyles from '@/styles/globalStyles.module.scss';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${montserrat.variable} ${garamond.variable}`}>
            <body className={globalStyles['body--wrapper']}>
                <UserProvider>
                    <Header />
                    <div className={globalStyles['page--wrapper']}>{children}</div>
                    <Footer />
                </UserProvider>
            </body>
        </html>
    );
}
