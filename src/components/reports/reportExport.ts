/**
 * Report export helpers — XLSX export driven by current grid state
 * (visible columns, active filters, sort). CSV uses the grid's built-in
 * apiRef.current.exportDataAsCsv, which respects the same state.
 */

//Types
import { GridApi, gridFilteredSortedRowIdsSelector, gridVisibleColumnFieldsSelector } from '@mui/x-data-grid';
import { MutableRefObject } from 'react';
//API
import * as XLSX from '@e965/xlsx';

/**
 * Builds a dated file name: {report}_{YYYY-MM-DD}
 */
export function reportFileName(base: string): string {
    return `${base}_${new Date().toISOString().split('T')[0]}`;
}

/**
 * Exports the grid's current view (visible columns, filtered + sorted rows,
 * formatted values) to an XLSX file and triggers download.
 */
export function exportGridXlsx(apiRef: MutableRefObject<GridApi>, fileName: string): void {
    const api = apiRef.current;
    const fields = gridVisibleColumnFieldsSelector(apiRef);
    const rowIds = gridFilteredSortedRowIdsSelector(apiRef);

    const headers = fields.map((field) => api.getColumn(field).headerName ?? field);
    const aoa: (string | number)[][] = [headers];
    for (const rowId of rowIds) {
        aoa.push(
            fields.map((field) => {
                const value = api.getCellParams(rowId, field).formattedValue;
                if (value === null || value === undefined) return '';
                return typeof value === 'number' ? value : String(value);
            })
        );
    }

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
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
