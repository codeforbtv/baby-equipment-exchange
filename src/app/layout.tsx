//Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
//Fonts
import { montserrat, garamond } from '../styles/fonts';

//Providers
//import { UserProvider } from '@/contexts/UserContext';
//Styles
import '../styles/globalStyles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${montserrat.variable} ${garamond.variable}`}>
            <body className="body--wrapper">
                {/*<UserProvider>*/}
                    <Header />
                    <div className="page--wrapper">{children}</div>
                    <Footer />
                {/*</UserProvider>*/}
            </body>
        </html>
    );
}
