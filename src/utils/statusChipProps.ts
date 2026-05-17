import { ChipProps } from '@mui/material';

const statusMap: Record<string, { color: ChipProps['color']; label: string }> = {
    'in processing': { color: 'warning', label: 'In Processing' },
    'pending delivery': { color: 'warning', label: 'Pending Delivery' },
    available: { color: 'success', label: 'Available' },
    requested: { color: 'primary', label: 'Requested' },
    reserved: { color: 'info', label: 'Reserved' },
    distributed: { color: 'success', label: 'Distributed' },
    rejected: { color: 'error', label: 'Rejected' },
    unavailable: { color: 'error', label: 'Unavailable' },
    'not-received': { color: 'default', label: 'Not Received' }
};

export function getStatusChipProps(status: string): { color: ChipProps['color']; label: string } {
    return statusMap[status] ?? { color: 'default', label: status };
}
