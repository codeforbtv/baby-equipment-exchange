'use client';
//Components
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedAidWorkerRoute';
import { Button } from '@mui/material';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
//Hooks
import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
//Models
import { AccountInformation as AccountInfo } from '@/types/post-data';
//Styling
import '../../styles/globalStyles.css';
import styles from './Account.module.css';

// import { getUserAccount } from '@/api/firebase-users';
import Browse from '@/components/Browse';

export default function Account() {
    const [accountType, setAccountType] = useState<string>('');
    const { currentUser } = useUserContext();
    // const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    //     name: '',
    //     contact: {
    //         user: undefined,
    //         name: undefined,
    //         email: undefined,
    //         phone: undefined,
    //         website: undefined,
    //         notes: undefined
    //     },
    //     location: {
    //         line_1: undefined,
    //         line_2: undefined,
    //         city: undefined,
    //         state: undefined,
    //         zipcode: undefined,
    //         latitude: undefined,
    //         longitude: undefined
    //     },
    //     photo: undefined
    // });

    // useEffect(() => {
    //     (async () => {
    //         if (currentUser) {
    //             try {
    //                 const accountInfo = await getUserAccount();
    //                 setAccountInfo(accountInfo);
    //             } catch (error) {
    //                 // eslint-disable-line no-empty
    //             }
    //         }
    //     })();
    // }, []);

    // useEffect(() => {
    //     getAccountType()
    //         .then((acctType) => {
    //             setAccountType(acctType!);
    //         })
    //         .catch((_reason: any) => {
    //             setAccountType('(unavailable)');
    //         });
    // }, []);

    // return (
    //     <ProtectedRoute>
    //         <div className="page--header">
    //             <h1>Account</h1>
    //             {/* <h4>[Page Summary]</h4> */}
    //         </div>
    //         <div className="content--container">
    //             <div className={styles['account__header']}>
    //                 <h2>Account Details</h2>
    //                 <div>
    //                     <Button component={Link} href="/account/edit" variant="contained" endIcon={<PermIdentityOutlinedIcon />}>
    //                         Edit Profile
    //                     </Button>
    //                 </div>
    //             </div>
    //             <h4>Usertype: {accountType}</h4>
    //             <h4>Display name {accountInfo.contact?.name}</h4>
    //             <h4>
    //                 Contact: <br />
    //                 Phone: {accountInfo.contact?.phone}
    //                 <br />
    //                 Email: {accountInfo.contact?.email}
    //             </h4>
    //             <h4>
    //                 Location: <br />
    //                 {accountInfo.location?.line_1}
    //                 <br />
    //                 {accountInfo.location?.city} {accountInfo.location?.state}
    //                 <br />
    //                 {accountInfo.location?.zipcode}
    //                 <br />
    //             </h4>

    //             <h2>Donations:</h2>
    //             <Browse />
    //         </div>
    //     </ProtectedRoute>
    // );
}
