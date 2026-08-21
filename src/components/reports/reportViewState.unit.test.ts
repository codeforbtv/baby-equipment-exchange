/**
 * @jest-environment jsdom
 */

import { ReportViewState, loadViewState, saveViewState } from './reportViewState';

const KEY = 'bee:reports:view:v2:organization';

function makeState(overrides: Partial<ReportViewState> = {}): ReportViewState {
    return {
        statusFilter: ['available'],
        orgFilter: ['CVOEO'],
        requestorFilter: [{ id: 'u1', name: 'A', email: 'a@x.org' }],
        dateField: 'createdAt',
        dateFrom: null,
        dateTo: null,
        columnVisibilityModel: { brand: true },
        sortModel: [{ field: 'brand', sort: 'asc' }],
        pageSize: 25,
        columnOrder: ['brand', 'model'],
        donorFilter: [{ name: 'D', email: 'd@x.org' }],
        ...overrides
    };
}

function without(key: keyof ReportViewState): Partial<ReportViewState> {
    const state: Partial<ReportViewState> = makeState();
    delete state[key];
    return state;
}

function writeRaw(value: unknown): void {
    window.localStorage.setItem(KEY, typeof value === 'string' ? value : JSON.stringify(value));
}

beforeEach(() => {
    window.localStorage.clear();
});

describe('reportViewState', () => {
    test('valid state round-trips unchanged', () => {
        const state = makeState();
        saveViewState('organization', state);
        expect(loadViewState('organization')).toEqual(state);
    });

    test('null entries are dropped from orgFilter', () => {
        writeRaw(makeState({ orgFilter: ['CVOEO', null] as unknown as string[] }));
        expect(loadViewState('organization')?.orgFilter).toEqual(['CVOEO']);
    });

    test('requestorFilter keeps only entries with a string id and name', () => {
        const requestorFilter = [{ id: 'u1', name: 'A', email: '' }, null, { id: 'u2' }] as unknown as ReportViewState['requestorFilter'];
        writeRaw(makeState({ requestorFilter }));
        expect(loadViewState('organization')?.requestorFilter).toEqual([{ id: 'u1', name: 'A', email: '' }]);
    });

    test('donorFilter keeps only entries with a string name', () => {
        const donorFilter = [null, { name: 'D', email: '' }] as unknown as ReportViewState['donorFilter'];
        writeRaw(makeState({ donorFilter }));
        expect(loadViewState('organization')?.donorFilter).toEqual([{ name: 'D', email: '' }]);
    });

    test('state missing orgFilter is rejected', () => {
        writeRaw(without('orgFilter'));
        expect(loadViewState('organization')).toBeNull();
    });

    test('state missing requestorFilter is rejected', () => {
        writeRaw(without('requestorFilter'));
        expect(loadViewState('organization')).toBeNull();
    });

    test('malformed JSON is rejected', () => {
        writeRaw('{ not json');
        expect(loadViewState('organization')).toBeNull();
    });

    test('missing key returns null', () => {
        expect(loadViewState('organization')).toBeNull();
    });
});
