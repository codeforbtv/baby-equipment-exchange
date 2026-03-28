/**
 * Report utility functions — data transformation and export helpers.
 */

//Types
import { Donation } from '@/models/donation';
import { Timestamp } from 'firebase/firestore';
import { ReportColumn } from './reportColumns';
//API
import * as XLSX from '@e965/xlsx';
import dayjs from 'dayjs';

// Types

export interface SheetCell {
    value: string | number;
    styles?: Record<string, string>;
}

export interface ReportData {
    data: SheetCell[][];
    headerValues: string[];
}

// Helpers

/**
 * Formats a Firestore Timestamp to YYYY-MM-DD string.
 */
export function formatTimestamp(ts: Timestamp | null | undefined): string {
    if (!ts) return '';
    try {
        return ts.toDate().toISOString().split('T')[0];
    } catch {
        return '';
    }
}

/**
 * Extracts unique requestors from donation data for Autocomplete filters.
 */
export function extractUniqueRequestors(donations: Donation[]): { id: string; name: string; email: string }[] {
    const map = new Map<string, { id: string; name: string; email: string }>();
    for (const d of donations) {
        if (d.requestor && !map.has(d.requestor.id)) {
            map.set(d.requestor.id, { id: d.requestor.id, name: d.requestor.name, email: d.requestor.email });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolves a column key to the cell value for a given donation.
 * Storage names must be pre-resolved and passed as a lookup map.
 */
function resolveCellValue(donation: Donation, key: string, storageMap: Record<string, string>): string {
    switch (key) {
        case 'tagNumber':
            return donation.tagNumber ?? '';
        case 'brand':
            return donation.brand;
        case 'model':
            return donation.model;
        case 'category':
            return donation.category;
        case 'status':
            return donation.status;
        case 'donorName':
            return donation.donorName;
        case 'donorEmail':
            return donation.donorEmail;
        case 'createdAt':
            return formatTimestamp(donation.createdAt);
        case 'dateAccepted':
            return formatTimestamp(donation.dateAccepted);
        case 'dateReceived':
            return formatTimestamp(donation.dateReceived);
        case 'dateRequested':
            return formatTimestamp(donation.dateRequested);
        case 'dateDistributed':
            return formatTimestamp(donation.dateDistributed);
        case 'daysInStorage':
            return donation.dateReceived ? dayjs().diff(donation.dateReceived?.toDate(), 'day').toString() : '';
        case 'description':
            return donation.description ?? '';
        case 'notes':
            return donation.notes?.join('; ') ?? '';
        case 'bulkCollection':
            return donation.bulkCollection;
        case 'images':
            return donation.images?.join(', ') ?? '';
        case 'storageName':
            return donation.storage ? (storageMap[donation.storage.id] ?? '') : '';
        case 'storageDate':
            return formatTimestamp(donation.storageDate);
        case 'requestorName':
            return donation.requestor?.name ?? '';
        case 'requestorEmail':
            return donation.requestor?.email ?? '';
        case 'distributorName':
            return donation.distributor?.name ?? '';
        case 'distributorEmail':
            return donation.distributor?.email ?? '';
        case 'distributorOrg':
            return donation.distributor?.organization ?? '';
        // Organization columns are resolved externally via org lookup
        case 'orgName':
            return donation.distributor?.organization ?? '';
        case 'orgCounty':
            return ''; // Resolved externally if org data is passed
        case 'orgPhone':
            return '';
        case 'orgTags':
            return '';
        default:
            return '';
    }
}

// Core Builder

export interface BuildReportOptions {
    donations: Donation[];
    selectedColumns: ReportColumn[];
    storageMap?: Record<string, string>;
    groupByKey?: 'status' | 'orgName' | 'requestorName';
    orgLookup?: Record<string, { county?: string; phone?: string; tags?: string[] }>;
}

/**
 * Builds report data from donations using the selected columns.
 * Optionally groups rows by a key with styled group headers.
 */
export function buildReport(options: BuildReportOptions): ReportData {
    const { donations, selectedColumns, storageMap = {}, groupByKey, orgLookup = {} } = options;

    const headerValues = selectedColumns.map((col) => col.label);
    const headerRow: SheetCell[] = selectedColumns.map((col) => ({
        value: col.label,
        styles: { fontWeight: 'bold', background: '#e8e8e8', color: '#333' }
    }));

    const data: SheetCell[][] = [headerRow];

    if (!groupByKey) {
        // Flat list — sort by status, then brand, then model
        const sorted = [...donations].sort((a, b) => {
            const statusCmp = a.status.localeCompare(b.status);
            if (statusCmp !== 0) return statusCmp;
            const brandCmp = a.brand.localeCompare(b.brand);
            if (brandCmp !== 0) return brandCmp;
            return a.model.localeCompare(b.model);
        });

        for (const donation of sorted) {
            data.push(buildRow(donation, selectedColumns, storageMap, orgLookup));
        }
    } else {
        // Grouped — insert group header rows
        const groups = groupDonations(donations, groupByKey);
        const sortedGroupKeys = Object.keys(groups).sort();

        for (const groupKey of sortedGroupKeys) {
            const groupLabel = groupKey || '(Unassigned)';
            // Group header row spans all columns
            const groupHeaderRow: SheetCell[] = [
                { value: groupLabel, styles: { fontWeight: 'bold', background: '#d0e8ff', color: '#1a1a1a' } },
                ...Array(selectedColumns.length - 1)
                    .fill(null)
                    .map(() => ({ value: '', styles: { background: '#d0e8ff' } }))
            ];
            data.push(groupHeaderRow);

            const sorted = [...groups[groupKey]].sort((a, b) => a.brand.localeCompare(b.brand));
            for (const donation of sorted) {
                data.push(buildRow(donation, selectedColumns, storageMap, orgLookup));
            }
        }
    }

    return { data, headerValues };
}

function buildRow(
    donation: Donation,
    selectedColumns: ReportColumn[],
    storageMap: Record<string, string>,
    orgLookup: Record<string, { county?: string; phone?: string; tags?: string[] }>
): SheetCell[] {
    return selectedColumns.map((col) => {
        // Handle org-specific lookups for county/phone/tags
        if (['orgCounty', 'orgPhone', 'orgTags'].includes(col.key) && donation.distributor?.organization) {
            const orgData = orgLookup[donation.distributor.organization];
            if (orgData) {
                if (col.key === 'orgCounty') return { value: orgData.county ?? '' };
                if (col.key === 'orgPhone') return { value: orgData.phone ?? '' };
                if (col.key === 'orgTags') return { value: orgData.tags?.join(', ') ?? '' };
            }
            return { value: '' };
        }
        return { value: resolveCellValue(donation, col.key, storageMap) };
    });
}

function groupDonations(donations: Donation[], key: 'status' | 'orgName' | 'requestorName'): Record<string, Donation[]> {
    const groups: Record<string, Donation[]> = {};
    for (const d of donations) {
        let groupValue = '';
        if (key === 'status') groupValue = d.status;
        else if (key === 'orgName') groupValue = d.distributor?.organization ?? '';
        else if (key === 'requestorName') groupValue = d.requestor?.name ?? '';

        if (!groups[groupValue]) groups[groupValue] = [];
        groups[groupValue].push(d);
    }
    return groups;
}

// Export Helpers

/**
 * Exports SheetCell[][] data to an XLSX file and triggers download.
 */
export function exportToXlsx(data: SheetCell[][], fileName: string = 'report.xlsx'): void {
    const aoa = data.map((row) => row.map((cell) => cell.value));
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    // Bold header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
        if (worksheet[cellAddr]) {
            worksheet[cellAddr].s = { font: { bold: true } };
        }
    }

    // Auto column widths
    const colWidths = aoa[0]?.map((_, colIdx) => {
        let maxLen = 10;
        for (const row of aoa) {
            const val = row[colIdx]?.toString() ?? '';
            if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, fileName);
}
