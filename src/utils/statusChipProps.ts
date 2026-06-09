type ChipColor = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

type StatusChipProps = {
    color: ChipColor;
    label: string;
    sx?: Record<string, string | number>;
};

const statusMap: Record<string, StatusChipProps> = {
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

export function getStatusChipProps(status: string): StatusChipProps {
    return statusMap[status] ?? { color: 'default', label: status };
}
