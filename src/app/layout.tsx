import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { montserrat, garamond } from '../styles/fonts';
import Providers from './providers';
import '../styles/globalStyles.css';

const fontClassNames = [montserrat, garamond].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={fontClassNames}>
            <body className="body--wrapper">
                <Providers>
                    <Header />
                    <div className="page--wrapper">{children}</div>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
