'use client';
//Components
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Button, Divider, Paper, TextField } from '@mui/material';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
//Hooks
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
//Lib

// import { getUserAccount, setUserAccount } from '@/api/firebase-users';
//Models
import { AccountInformation as AccountInfo } from '@/types/post-data';
//Styling
import '../../../styles/globalStyles.css';
import styles from './AccountEdit.module.css';

type AccountFormData = {
    name: string | null;
    username: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    locationStreet: string | null;
    locationCity: string | null;
    locationState: string | null;
    locationZip: string | null;
    type: string | null;
};

export default function EditAccount() {
    const [accountType, setAccountType] = useState<string>('');
    const { currentUser } = useUserContext();
    const router = useRouter();

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

    // const [formData, setFormData] = useState<AccountFormData>({
    //     name: accountInfo.name,
    //     username: accountInfo.contact?.email ?? '',
    //     contactEmail: accountInfo.contact?.email ?? '',
    //     contactPhone: accountInfo.contact?.phone ?? '',
    //     locationStreet: accountInfo.location?.line_1 ?? '',
    //     locationCity: accountInfo.location?.city ?? '',
    //     locationState: accountInfo.location?.state ?? '',
    //     locationZip: accountInfo.location?.zipcode ?? '',
    //     type: accountType
    // });

    // useEffect(() => {
    //     (async () => {
    //         if (currentUser) {
    //             try {
    //                 const accountInfo = await getUserAccount();
    //                 setAccountInfo(accountInfo);
    //                 setFormData({
    //                     name: accountInfo.name,
    //                     username: accountInfo.contact?.email ?? '',
    //                     contactEmail: accountInfo.contact?.email ?? '',
    //                     contactPhone: accountInfo.contact?.phone ?? '',
    //                     locationStreet: accountInfo.location?.line_1 ?? '',
    //                     locationCity: accountInfo.location?.city ?? '',
    //                     locationState: accountInfo.location?.state ?? '',
    //                     locationZip: accountInfo.location?.zipcode ?? '',
    //                     type: accountType
    //                 });
    //             } catch (error) {
    //                 // eslint-disable-line no-empty
    //             }
    //         }
    //     })();
    // }, []);

    // function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    //     setFormData((prev) => {
    //         return { ...prev, [e.target.name]: e.target.value };
    //     });
    // }

    // //Use this to handle passing form data to the database on submission
    // function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    //     e.preventDefault();
    //     setUserAccount({
    //         ...accountInfo,
    //         contact: {
    //             name: formData.name,
    //             user: accountInfo.contact?.user,
    //             email: formData.contactEmail,
    //             notes: accountInfo.contact?.notes,
    //             phone: formData.contactPhone,
    //             website: accountInfo.contact?.website
    //         },
    //         location: {
    //             line_1: formData.locationStreet,
    //             line_2: accountInfo.location?.line_2,
    //             city: formData.locationCity,
    //             state: formData.locationState,
    //             zipcode: formData.locationZip,
    //             latitude: accountInfo.location?.latitude,
    //             longitude: accountInfo.location?.longitude
    //         }
    //     }).then(() => router.push('/account'));
    // }

    //     return (
    //         <ProtectedRoute>
    //             <div className="page--header">
    //                 <h1>Edit Account</h1>
    //             </div>
    //             <Box display={'flex'} justifyContent="space-evenly" className="content--container">
    //                 <Paper component={Box} flexDirection={'column'} className={styles['account__header']}>
    //                     <h4>
    //                         {formData.name} ({accountType})
    //                     </h4>
    //                 </Paper>
    //                 <Box component="form" className={styles['form']} id="editAccount" onSubmit={handleFormSubmit}>
    //                     <Box className={styles['form__section--right']} display={'flex'} flexDirection={'column'} gap={3}>
    //                         <Divider textAlign="center">Contact</Divider>
    //                         <TextField
    //                             type="email"
    //                             label="Email"
    //                             placeholder="Input email"
    //                             name="contactEmail"
    //                             id="contactEmail"
    //                             onChange={handleInputChange}
    //                             value={formData.contactEmail ? formData.contactEmail : ''}
    //                             variant="standard"
    //                         />
    //                         <TextField
    //                             type="tel"
    //                             label="Phone Number"
    //                             name="contactPhone"
    //                             id="contactPhone"
    //                             onChange={handleInputChange}
    //                             value={formData.contactPhone ? formData.contactPhone : ''}
    //                             variant="standard"
    //                         />
    //                     </Box>
    //                     <Box className={styles['form__section--left']} display={'flex'} flexDirection={'column'} gap={1}>
    //                         <Divider textAlign="center">Location</Divider>
    //                         <TextField
    //                             type="text"
    //                             placeholder="input address"
    //                             label="Street Address"
    //                             name="locationStreet"
    //                             id="locationStreet"
    //                             onChange={handleInputChange}
    //                             value={formData.locationStreet ? formData.locationStreet : ''}
    //                             variant="standard"
    //                         />
    //                         <TextField
    //                             type="text"
    //                             placeholder="input city"
    //                             label="City"
    //                             name="locationCity"
    //                             id="locationCity"
    //                             onChange={handleInputChange}
    //                             value={formData.locationCity ? formData.locationCity : ''}
    //                             variant="standard"
    //                         />
    //                         <TextField
    //                             label="State"
    //                             placeholder="input state"
    //                             type="text"
    //                             name="locationState"
    //                             id="locationState"
    //                             onChange={handleInputChange}
    //                             value={formData.locationState ? formData.locationState : ''}
    //                             variant="standard"
    //                         />
    //                         <TextField
    //                             label="Zip Code"
    //                             placeholder="input zip code"
    //                             type="text"
    //                             name="locationZip"
    //                             id="locationZip"
    //                             onChange={handleInputChange}
    //                             value={formData.locationZip ? formData.locationZip : ''}
    //                             variant="standard"
    //                         />
    //                     </Box>
    //                     <div className={styles['form__section--button-bottom']}>
    //                         <Button variant="contained" type={'submit'} endIcon={<PermIdentityOutlinedIcon />}>
    //                             Save
    //                         </Button>
    //                     </div>
    //                 </Box>
    //             </Box>
    //         </ProtectedRoute>
    //     );
}
