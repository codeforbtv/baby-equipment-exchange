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
    columnOrder?: string[];
    donorFilter?: { name: string; email: string }[];
}

// The live view tracks whatever the tab currently looks like; the default is the snapshot
// the user deliberately saved and can return to.
const KEY_PREFIX = 'bee:reports:view:v2:';
const DEFAULT_KEY_PREFIX = 'bee:reports:default:v1:';

function storageKey(type: ReportType): string {
    return `${KEY_PREFIX}${type}`;
}

function defaultStorageKey(type: ReportType): string {
    return `${DEFAULT_KEY_PREFIX}${type}`;
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function hasStringName(value: unknown): value is { name: string } {
    return !!value && typeof value === 'object' && typeof (value as { name?: unknown }).name === 'string';
}

function isRequestorOption(value: unknown): value is { id: string; name: string; email: string } {
    return hasStringName(value) && typeof (value as { id?: unknown }).id === 'string';
}

function read(key: string): ReportViewState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed !== 'object' ||
            !Array.isArray(parsed.statusFilter) ||
            !Array.isArray(parsed.orgFilter) ||
            !Array.isArray(parsed.requestorFilter) ||
            !Array.isArray(parsed.sortModel) ||
            typeof parsed.columnVisibilityModel !== 'object' ||
            typeof parsed.pageSize !== 'number' ||
            (parsed.columnOrder !== undefined && (!Array.isArray(parsed.columnOrder) || parsed.columnOrder.some((field: unknown) => typeof field !== 'string'))) ||
            (parsed.donorFilter !== undefined && !Array.isArray(parsed.donorFilter))
        ) {
            return null;
        }
        // A pre-fix session could have serialized an undefined option as null; drop
        // anything that isn't a usable option rather than letting Autocomplete throw on it.
        return {
            ...parsed,
            orgFilter: parsed.orgFilter.filter(isString),
            requestorFilter: parsed.requestorFilter.filter(isRequestorOption),
            donorFilter: parsed.donorFilter?.filter(hasStringName)
        } as ReportViewState;
    } catch {
        return null;
    }
}

function write(key: string, state: ReportViewState): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
        return;
    }
}

function remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(key);
    } catch {
        return;
    }
}

export function loadViewState(type: ReportType): ReportViewState | null {
    return read(storageKey(type));
}

export function saveViewState(type: ReportType, state: ReportViewState): void {
    write(storageKey(type), state);
}

export function clearViewState(type: ReportType): void {
    remove(storageKey(type));
}

export function loadDefaultViewState(type: ReportType): ReportViewState | null {
    return read(defaultStorageKey(type));
}

export function saveDefaultViewState(type: ReportType, state: ReportViewState): void {
    write(defaultStorageKey(type), state);
}

export function clearDefaultViewState(type: ReportType): void {
    remove(defaultStorageKey(type));
}
