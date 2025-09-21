'use client';

//Hooks
import { useRouter } from 'next/navigation';
//Components
import { Button } from '@mui/material';
//Styles
import homeStyles from '@/app/HomeStyles.module.css';

const HomePage = () => {
    const router = useRouter();
    return (
        <div className={homeStyles['home--header']}>
            <h2>Welcome to the Baby Equipment Exchange!</h2>
            <p>A 100% volunteer led initiative to provide durable equipment to families in need through partner referrals and community donations.</p>
            <Button variant="contained" type="button" aria-label="Make a Donation" onClick={() => router.push('/donate')}>
                Make a Donation
            </Button>
        </div>
    );
};

export default HomePage;
