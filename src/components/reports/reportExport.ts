import { GridApi, gridFilteredSortedRowIdsSelector, gridVisibleColumnFieldsSelector } from '@mui/x-data-grid';
import { MutableRefObject } from 'react';
import * as XLSX from '@e965/xlsx';
import dayjs from 'dayjs';

export function reportFileName(base: string): string {
    return `${base}_${dayjs().format('YYYY-MM-DD')}`;
}

export function exportGridXlsx(apiRef: MutableRefObject<GridApi>, fileName: string): void {
    const api = apiRef.current;
    const fields = gridVisibleColumnFieldsSelector(apiRef);
    const rowIds = gridFilteredSortedRowIdsSelector(apiRef);

    const headers = fields.map((field) => api.getColumn(field).headerName ?? field);
    // Date columns go in as real Date cells so Excel sorts and filters them as dates;
    // everything else falls back to the grid's formatted value.
    const dateFields = new Set(fields.filter((field) => api.getColumn(field).type === 'date'));
    const aoa: (string | number | Date)[][] = [headers];
    for (const rowId of rowIds) {
        aoa.push(
            fields.map((field) => {
                const params = api.getCellParams(rowId, field);
                if (dateFields.has(field) && params.value instanceof Date) return params.value;
                const value = params.formattedValue;
                if (value === null || value === undefined) return '';
                return typeof value === 'number' ? value : String(value);
            })
        );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let c = range.s.c; c <= range.e.c; c++) {
        if (!dateFields.has(fields[c])) continue;
        for (let r = 1; r <= range.e.r; r++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.t === 'd') cell.z = 'mm/dd/yyyy';
        }
    }

    const colWidths = aoa[0]?.map((_, colIdx) => {
        let maxLen = 10;
        for (const row of aoa) {
            const cell = row[colIdx];
            const val = cell instanceof Date ? 'MM/DD/YYYY' : (cell?.toString() ?? '');
            if (val.length > maxLen) maxLen = val.length;
        }
        return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
