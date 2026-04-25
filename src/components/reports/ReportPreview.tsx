'use client';

//Components
import { Button, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import Sheet, { SheetRef } from 'react-spread-sheet-excel';
//Hooks
import { useRef, useEffect } from 'react';
//Types
import { SheetCell, exportToXlsx } from './reportUtils';
import { ExportFormat } from './ReportConfigPanel';
//Styles
import styles from './Reports.module.css';

interface ReportPreviewProps {
    data: SheetCell[][];
    headerValues: string[];
    exportFormat: ExportFormat;
    reportName: string;
}

const ReportPreview = (props: ReportPreviewProps) => {
    const { data, headerValues, exportFormat, reportName } = props;
    const sheetRef = useRef<SheetRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Trigger a scroll to force the Sheet to render rows.
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (containerRef.current) {
                const scrollContainer = containerRef.current.querySelector('.sheet-table-table-container') as HTMLElement;
                if (scrollContainer) {
                    // Force a scroll to trigger Sheet geometry recount
                    scrollContainer.scrollTop += 1;
                    scrollContainer.dispatchEvent(new Event('scroll'));
                    requestAnimationFrame(() => {
                        if (scrollContainer) scrollContainer.scrollTop -= 1;
                    });
                }
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [data, headerValues]);

    const rowCount = data.length - 1; // Minus header row
    const fileName = `${reportName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;

    const handleExport = () => {
        if (exportFormat === 'csv') {
            sheetRef.current?.exportCsv(fileName, true);
        } else {
            exportToXlsx(data, `${fileName}.xlsx`);
        }
    };

    if (data.length <= 1) {
        return (
            <div className={styles['empty-state']}>
                <TableChartIcon className={styles['empty-state__icon']} />
                <Typography variant="body1" sx={{ color: '#999' }}>
                    No data matches your filters.
                </Typography>
                <Typography variant="caption" sx={{ color: '#bbb' }}>
                    Try broadening your selection criteria.
                </Typography>
            </div>
        );
    }

    return (
        <div className={styles['preview-container']} ref={containerRef}>
            <div className={styles['preview-toolbar']}>
                <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ textTransform: 'none' }}>
                    Export {exportFormat.toUpperCase()}
                </Button>
                <span className={styles['preview-toolbar__count']}>
                    {rowCount} row{rowCount !== 1 ? 's' : ''}
                </span>
            </div>
            <div className={styles['sheet-wrapper']}>
                <Sheet
                    key={`${headerValues.join('-')}-${data.length}`}
                    ref={sheetRef}
                    data={data}
                    headerValues={headerValues}
                    resize
                    hideYAxisHeader={false}
                    hideXAxisHeader={false}
                />
            </div>
        </div>
    );
};

export default ReportPreview;
