//Components
import Header from '@/components/Header'
import Footer from '@/components/Footer'

//Providers
import { UserProvider } from '@/contexts/UserContext'
//Styles
import globalStyles from '@/styles/globalStyles.module.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={globalStyles['body--wrapper']}>
                <UserProvider>
                    <Header />
                    <div className={globalStyles['page--wrapper']}>{children}</div>
                    <Footer />
                </UserProvider>
            </body>
        </html>
    )
}
