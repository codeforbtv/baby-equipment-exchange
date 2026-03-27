'use client';

//Hooks
import { useRouter } from 'next/navigation';
//Components
import { Button, Typography } from '@mui/material';
//Styles
import homeStyles from '@/app/HomeStyles.module.css';
import '@/styles/globalStyles.css';

const HomePage = () => {
    const router = useRouter();
    return (
        <div className={homeStyles['home--wrapper']}>
            <div className={homeStyles['home--header']}>
                <h2>Welcome to the Baby Product Exchange!</h2>
                <p>If you’d like to <b>donate gear</b>, you don’t need to create an account—just click “Make A Donation” and upload your item details. Please note that any categories <b>greyed out</b> in the donation field indicate items we’re <b>not currently accepting</b>. Once your donation is approved, we’ll email you a link to schedule your drop-off.</p>
                <p><b>Social service workers</b> should create an account to access inventory and request items for clients. Click “Join,” and our team will review your request within 24 hours. Once approved, you can place your first order</p>
            </div>
            <Button variant="contained" size="large" type="button" aria-label="Make a Donation" onClick={() => router.push('/donate')}>
                Make a Donation
            </Button>
            <Typography variant="body2">No account required!</Typography>
            <div className={homeStyles['info--box']}>
                <p>Are you an existing partner? </p>
                <div className={homeStyles['btn--group']}>
                    <Button variant="text" onClick={() => router.push('/login')}>
                        Login
                    </Button>
                    <Typography variant="body2">or</Typography>
                    <Button variant="text" onClick={() => router.push('/join')}>
                        Join
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
