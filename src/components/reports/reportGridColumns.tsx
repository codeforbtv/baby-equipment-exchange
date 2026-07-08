import { Chip } from '@mui/material';
import { GridColDef, GridColumnVisibilityModel, GridSortModel } from '@mui/x-data-grid';
import { Timestamp } from 'firebase/firestore';
import { Donation } from '@/models/donation';
import { getStatusChipProps } from '@/utils/statusChipProps';

export interface ReportRow {
    id: string;
    tagNumber: string;
    brand: string;
    model: string;
    category: string;
    status: string;
    donorName: string;
    donorEmail: string;
    createdAt: Date | null;
    dateAccepted: Date | null;
    dateReceived: Date | null;
    dateRequested: Date | null;
    dateDistributed: Date | null;
    daysInStorage: number | null;
    description: string;
    notes: string;
    bulkCollection: string;
    images: string;
    requestorId: string;
    requestorName: string;
    requestorEmail: string;
    distributorName: string;
    distributorEmail: string;
    distributorOrg: string;
    orgName: string;
    orgCounty: string;
    orgPhone: string;
    orgTags: string;
}

export type OrgLookup = Record<string, { county?: string; phone?: string; tags?: string[] }>;

function toDate(ts: Timestamp | null | undefined): Date | null {
    if (!ts) return null;
    try {
        return ts.toDate();
    } catch {
        return null;
    }
}

export function buildRows(donations: Donation[], orgLookup: OrgLookup = {}): ReportRow[] {
    return donations.map((donation) => {
        const orgName = donation.distributor?.organization ?? '';
        const orgData = orgName ? orgLookup[orgName] : undefined;
        return {
            id: donation.id,
            tagNumber: donation.tagNumber ?? '',
            brand: donation.brand,
            model: donation.model,
            category: donation.category,
            status: donation.status,
            donorName: donation.donorName,
            donorEmail: donation.donorEmail,
            createdAt: toDate(donation.createdAt),
            dateAccepted: toDate(donation.dateAccepted),
            dateReceived: toDate(donation.dateReceived),
            dateRequested: toDate(donation.dateRequested),
            dateDistributed: toDate(donation.dateDistributed),
            daysInStorage: donation.getDaysInStorage() ?? null,
            description: donation.description ?? '',
            notes: donation.notes?.join('; ') ?? '',
            bulkCollection: donation.bulkCollection,
            images: donation.images?.join(', ') ?? '',
            requestorId: donation.requestor?.id ?? '',
            requestorName: donation.requestor?.name ?? '',
            requestorEmail: donation.requestor?.email ?? '',
            distributorName: donation.distributor?.name ?? '',
            distributorEmail: donation.distributor?.email ?? '',
            distributorOrg: orgName,
            orgName: orgName,
            orgCounty: orgData?.county ?? '',
            orgPhone: orgData?.phone ?? '',
            orgTags: orgData?.tags?.join(', ') ?? ''
        };
    });
}

export function extractUniqueRequestors(donations: Donation[]): { id: string; name: string; email: string }[] {
    const map = new Map<string, { id: string; name: string; email: string }>();
    for (const d of donations) {
        if (d.requestor && !map.has(d.requestor.id)) {
            map.set(d.requestor.id, { id: d.requestor.id, name: d.requestor.name, email: d.requestor.email });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function formatDate(value: Date | null): string {
    return value ? value.toISOString().split('T')[0] : '';
}

function dateColumn(field: string, headerName: string): GridColDef<ReportRow> {
    return {
        field,
        headerName,
        type: 'date',
        width: 130,
        valueFormatter: formatDate
    };
}

export const reportGridColumns: GridColDef<ReportRow>[] = [
    { field: 'tagNumber', headerName: 'Tag #', width: 90 },
    { field: 'brand', headerName: 'Brand', width: 130 },
    { field: 'model', headerName: 'Model', width: 150 },
    { field: 'category', headerName: 'Category', width: 140 },
    {
        field: 'status',
        headerName: 'Status',
        width: 150,
        renderCell: (params) => (params.value ? <Chip size="small" {...getStatusChipProps(params.value)} /> : null),
        valueFormatter: (value: string) => (value ? getStatusChipProps(value).label : '')
    },
    { field: 'donorName', headerName: 'Donor', width: 150 },
    { field: 'donorEmail', headerName: 'Donor Email', width: 200 },
    dateColumn('createdAt', 'Donation Date'),
    dateColumn('dateAccepted', 'Date Accepted'),
    dateColumn('dateReceived', 'Date Received'),
    dateColumn('dateRequested', 'Date Requested'),
    dateColumn('dateDistributed', 'Date Distributed'),
    { field: 'daysInStorage', headerName: 'Days in Storage', type: 'number', width: 130 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'notes', headerName: 'Notes', width: 200 },
    { field: 'bulkCollection', headerName: 'Collection Group', width: 150 },
    { field: 'images', headerName: 'Images', width: 200 },
    { field: 'requestorName', headerName: 'Requestor', width: 150 },
    { field: 'requestorEmail', headerName: 'Requestor Email', width: 200 },
    { field: 'distributorName', headerName: 'Distributor', width: 150 },
    { field: 'distributorEmail', headerName: 'Distributor Email', width: 200 },
    { field: 'distributorOrg', headerName: 'Distributor Org', width: 170 },
    { field: 'orgName', headerName: 'Organization', width: 180 },
    { field: 'orgCounty', headerName: 'County', width: 120 },
    { field: 'orgPhone', headerName: 'Phone', width: 130 },
    { field: 'orgTags', headerName: 'Tags', width: 160 }
];

export const dateFilterFields: { field: keyof ReportRow; label: string }[] = [
    { field: 'createdAt', label: 'Donation Date' },
    { field: 'dateAccepted', label: 'Date Accepted' },
    { field: 'dateReceived', label: 'Date Received' },
    { field: 'dateRequested', label: 'Date Requested' },
    { field: 'dateDistributed', label: 'Date Distributed' }
];

export const activeStatuses = ['in processing', 'pending delivery', 'available', 'reserved', 'requested'];

export const allStatuses = [
    'in processing',
    'pending delivery',
    'available',
    'reserved',
    'requested',
    'distributed',
    'rejected',
    'unavailable',
    'not-received'
];

export type ReportType = 'lifecycle' | 'organization' | 'requestor' | 'raw';

export interface ReportPreset {
    visibleColumns: string[];
    sortModel: GridSortModel;
    defaultStatuses: string[];
    filterWidget: 'none' | 'organization' | 'requestor';
    requireRequestor: boolean;
    fileName: string;
}

const lifecycleVisibleColumns = ['tagNumber', 'brand', 'model', 'category', 'status', 'donorName', 'createdAt', 'dateRequested', 'requestorName'];

export const REPORT_PRESETS: Record<ReportType, ReportPreset> = {
    lifecycle: {
        visibleColumns: lifecycleVisibleColumns,
        sortModel: [{ field: 'status', sort: 'asc' }],
        defaultStatuses: activeStatuses,
        filterWidget: 'none',
        requireRequestor: false,
        fileName: 'product_lifecycle'
    },
    organization: {
        visibleColumns: [...lifecycleVisibleColumns, 'orgName'],
        sortModel: [{ field: 'orgName', sort: 'asc' }],
        defaultStatuses: activeStatuses,
        filterWidget: 'organization',
        requireRequestor: false,
        fileName: 'donations_by_organization'
    },
    requestor: {
        visibleColumns: lifecycleVisibleColumns,
        sortModel: [{ field: 'requestorName', sort: 'asc' }],
        defaultStatuses: activeStatuses,
        filterWidget: 'requestor',
        requireRequestor: true,
        fileName: 'donations_by_requestor'
    },
    raw: {
        visibleColumns: reportGridColumns.map((col) => col.field),
        sortModel: [],
        defaultStatuses: allStatuses,
        filterWidget: 'none',
        requireRequestor: false,
        fileName: 'raw_export'
    }
};

export function buildColumnVisibilityModel(visibleColumns: string[]): GridColumnVisibilityModel {
    const model: GridColumnVisibilityModel = {};
    for (const col of reportGridColumns) {
        model[col.field] = visibleColumns.includes(col.field);
    }
    return model;
}
