'use client';

//Components
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AdminDonationFlow from '@/components/AdminDonationFlow';

export default function AdminDonate() {
    return (
        <ProtectedAdminRoute>
            <AdminDonationFlow />
        </ProtectedAdminRoute>
    );
}
