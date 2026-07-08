import { GridApi, gridFilteredSortedRowIdsSelector, gridVisibleColumnFieldsSelector } from '@mui/x-data-grid';
import { MutableRefObject } from 'react';
import * as XLSX from '@e965/xlsx';

export function reportFileName(base: string): string {
    return `${base}_${new Date().toISOString().split('T')[0]}`;
}

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

    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
        if (worksheet[cellAddr]) {
            worksheet[cellAddr].s = { font: { bold: true } };
        }
    }

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
