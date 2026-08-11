type ChipColor = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

type StatusChipProps = {
    color: ChipColor;
    label: string;
    sx: Record<string, string | number>;
};

const statusMap: Record<string, StatusChipProps> = {
    'in processing': { color: 'default', label: 'In Processing', sx: { fontWeight: 600, backgroundColor: '#FEF3C7', color: '#92400E' } },
    'pending delivery': { color: 'default', label: 'Pending Delivery', sx: { fontWeight: 600, backgroundColor: '#FFEDD5', color: '#9A3412' } },
    available: { color: 'default', label: 'Available', sx: { fontWeight: 600, backgroundColor: '#DCFCE7', color: '#166534' } },
    requested: { color: 'default', label: 'Requested', sx: { fontWeight: 600, backgroundColor: '#CCFBF1', color: '#0F766E' } },
    reserved: { color: 'default', label: 'Reserved', sx: { fontWeight: 600, backgroundColor: '#DBEAFE', color: '#1E40AF' } },
    distributed: { color: 'default', label: 'Distributed', sx: { fontWeight: 600, backgroundColor: '#EDE9FE', color: '#6D28D9' } },
    rejected: { color: 'default', label: 'Rejected', sx: { fontWeight: 600, backgroundColor: '#FEE2E2', color: '#B91C1C' } },
    unavailable: { color: 'default', label: 'Unavailable', sx: { fontWeight: 600, backgroundColor: '#FCE7F3', color: '#BE185D' } },
    'not-received': { color: 'default', label: 'Not Received', sx: { fontWeight: 600, backgroundColor: '#E2E8F0', color: '#475569' } },
    active: { color: 'default', label: 'Active', sx: { fontWeight: 600, backgroundColor: '#DCFCE7', color: '#166534' } },
    disabled: { color: 'default', label: 'Disabled', sx: { fontWeight: 600, backgroundColor: '#E2E8F0', color: '#475569' } }
};

export function getStatusChipProps(status: string): StatusChipProps {
    return statusMap[status] ?? { color: 'default', label: status, sx: { fontWeight: 600 } };
}
