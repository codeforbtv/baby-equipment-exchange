//Types
import { GridColumnVisibilityModel, GridSortModel } from '@mui/x-data-grid';
import { ReportType } from './reportGridColumns';

export interface ReportViewState {
    statusFilter: string[];
    orgFilter: string[];
    requestorFilter: { id: string; name: string; email: string }[];
    dateField: string;
    dateFrom: string | null;
    dateTo: string | null;
    columnVisibilityModel: GridColumnVisibilityModel;
    sortModel: GridSortModel;
    pageSize: number;
}

// Version segment bumped on shape change; unknown/old shapes are discarded by loadViewState.
const KEY_PREFIX = 'bee:reports:view:v1:';

function storageKey(type: ReportType): string {
    return `${KEY_PREFIX}${type}`;
}

/**
 * Loads the saved view config for a report type. Returns null on SSR, missing key,
 * or corrupt/unrecognized data — callers fall back to preset defaults.
 */
export function loadViewState(type: ReportType): ReportViewState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(storageKey(type));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed !== 'object' ||
            !Array.isArray(parsed.statusFilter) ||
            !Array.isArray(parsed.sortModel) ||
            typeof parsed.columnVisibilityModel !== 'object' ||
            typeof parsed.pageSize !== 'number'
        ) {
            return null;
        }
        return parsed as ReportViewState;
    } catch {
        return null;
    }
}

/**
 * Persists the view config for a report type. Best-effort: failures
 * (private mode, quota) are silent — persistence is a convenience, not a requirement.
 */
export function saveViewState(type: ReportType, state: ReportViewState): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(storageKey(type), JSON.stringify(state));
    } catch {
        return;
    }
}

export function clearViewState(type: ReportType): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(storageKey(type));
    } catch {
        return;
    }
}
