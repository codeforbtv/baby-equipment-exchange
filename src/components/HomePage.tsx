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
                <h2>Welcome to the Baby Equipment Exchange!</h2>
                <p>A 100% volunteer led initiative to provide durable equipment to families in need through partner referrals and community donations.</p>
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
                        Create an account
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
