type StatusChipStyle = { label: string; sx: { bgcolor: string; color: string } };

const statusMap: Record<string, StatusChipStyle> = {
    'in processing': { label: 'In Processing', sx: { bgcolor: '#fff3e0', color: '#e65100' } },
    'pending delivery': { label: 'Pending Delivery', sx: { bgcolor: '#fff3e0', color: '#e65100' } },
    available: { label: 'Available', sx: { bgcolor: '#e8f5e9', color: '#2e7d32' } },
    requested: { label: 'Requested', sx: { bgcolor: '#f0f0f0', color: '#616161' } },
    reserved: { label: 'Reserved', sx: { bgcolor: '#e0f2f1', color: '#2e7d72' } },
    distributed: { label: 'Distributed', sx: { bgcolor: '#e8f5e9', color: '#2e7d32' } },
    rejected: { label: 'Rejected', sx: { bgcolor: '#fce4ec', color: '#c62828' } },
    unavailable: { label: 'Unavailable', sx: { bgcolor: '#fce4ec', color: '#c62828' } },
    'not-received': { label: 'Not Received', sx: { bgcolor: '#f0f0f0', color: '#616161' } }
};

const fallback: StatusChipStyle = { label: '', sx: { bgcolor: '#f0f0f0', color: '#616161' } };

export function getStatusChipProps(status: string): StatusChipStyle {
    const entry = statusMap[status];
    if (entry) return entry;
    return { ...fallback, label: status };
}
