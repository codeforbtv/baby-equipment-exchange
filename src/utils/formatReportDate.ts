import dayjs from 'dayjs';

// One date shape for every report surface — grid cells, CSV, XLSX and the per-donation export.
export function formatReportDate(value: Date | null | undefined): string {
    return value ? dayjs(value).format('MM/DD/YYYY') : '';
}
