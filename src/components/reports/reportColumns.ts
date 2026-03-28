/**
 * Report column definitions grouped by source collection.
 * Each column has a key, label, collection, and whether it's selected by default.
 */

export interface ReportColumn {
    key: string;
    label: string;
    collection: 'donation' | 'organization' | 'storage' | 'requestor';
    defaultSelected: boolean;
}

// Donation Fields
export const donationColumns: ReportColumn[] = [
    { key: 'tagNumber', label: 'Tag #', collection: 'donation', defaultSelected: true },
    { key: 'brand', label: 'Brand', collection: 'donation', defaultSelected: true },
    { key: 'model', label: 'Model', collection: 'donation', defaultSelected: true },
    { key: 'category', label: 'Category', collection: 'donation', defaultSelected: true },
    { key: 'status', label: 'Status', collection: 'donation', defaultSelected: true },
    { key: 'donorName', label: 'Donor', collection: 'donation', defaultSelected: true },
    { key: 'donorEmail', label: 'Donor Email', collection: 'donation', defaultSelected: false },
    { key: 'createdAt', label: 'Donation Date', collection: 'donation', defaultSelected: true },
    { key: 'dateAccepted', label: 'Date Accepted', collection: 'donation', defaultSelected: false },
    { key: 'dateReceived', label: 'Date Received', collection: 'donation', defaultSelected: false },
    { key: 'dateRequested', label: 'Date Requested', collection: 'donation', defaultSelected: true },
    { key: 'dateDistributed', label: 'Date Distributed', collection: 'donation', defaultSelected: false },
    { key: 'daysInStorage', label: 'Days in Storage', collection: 'donation', defaultSelected: false },
    { key: 'description', label: 'Description', collection: 'donation', defaultSelected: false },
    { key: 'notes', label: 'Notes', collection: 'donation', defaultSelected: false },
    { key: 'bulkCollection', label: 'Collection Group', collection: 'donation', defaultSelected: false }
];

// Organization Fields
export const organizationColumns: ReportColumn[] = [
    { key: 'orgName', label: 'Organization', collection: 'organization', defaultSelected: true },
    { key: 'orgCounty', label: 'County', collection: 'organization', defaultSelected: false },
    { key: 'orgPhone', label: 'Phone', collection: 'organization', defaultSelected: false },
    { key: 'orgTags', label: 'Tags', collection: 'organization', defaultSelected: false }
];

// Storage Fields
export const storageColumns: ReportColumn[] = [
    { key: 'storageName', label: 'Storage Location', collection: 'storage', defaultSelected: false },
    { key: 'storageDate', label: 'Storage Date', collection: 'storage', defaultSelected: false }
];

// Requestor / Distributor Fields
export const requestorColumns: ReportColumn[] = [
    { key: 'requestorName', label: 'Requestor', collection: 'requestor', defaultSelected: true },
    { key: 'requestorEmail', label: 'Requestor Email', collection: 'requestor', defaultSelected: false },
    { key: 'distributorName', label: 'Distributor', collection: 'requestor', defaultSelected: false },
    { key: 'distributorEmail', label: 'Distributor Email', collection: 'requestor', defaultSelected: false },
    { key: 'distributorOrg', label: 'Distributor Org', collection: 'requestor', defaultSelected: false }
];

// All columns combined
export const allColumns: ReportColumn[] = [...donationColumns, ...organizationColumns, ...storageColumns, ...requestorColumns];

/**
 * Returns the default selected column keys for a given report type.
 */
export function getDefaultSelectedKeys(reportType: 'lifecycle' | 'organization' | 'requestor'): string[] {
    let columns: ReportColumn[] = [...donationColumns, ...storageColumns, ...requestorColumns];

    if (reportType === 'organization') {
        columns = [...columns, ...organizationColumns];
    }

    return columns.filter((col) => col.defaultSelected).map((col) => col.key);
}

/**
 * Returns all available columns for a given report type.
 */
export function getAvailableColumns(reportType: 'lifecycle' | 'organization' | 'requestor'): ReportColumn[] {
    let columns: ReportColumn[] = [...donationColumns, ...storageColumns, ...requestorColumns];

    if (reportType === 'organization') {
        columns = [...columns, ...organizationColumns];
    }

    return columns;
}

/**
 * Lifecycle status values considered "active".
 */
export const activeStatuses = ['in processing', 'pending delivery', 'available', 'reserved', 'requested'];

/**
 * All lifecycle status values.
 */
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

/**
 * Status labels for display in the UI.
 */
export const statusLabels: Record<string, string> = {
    'in processing': 'Pending Approval',
    'pending delivery': 'Pending Delivery',
    available: 'Available',
    reserved: 'Reserved',
    requested: 'Requested',
    distributed: 'Distributed',
    rejected: 'Rejected',
    unavailable: 'Unavailable',
    'not-received': 'Not Received'
};
