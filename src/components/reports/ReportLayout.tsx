'use client';

//Hookes
import { useEffect, useState } from 'react';
//Components
import { Collapse, Button, IconButton, Tooltip } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Loader from '@/components/Loader';
import ReportPreview from './ReportPreview';
//Types
import { ReportData } from './reportUtils';
import { ExportFormat } from './ReportConfigPanel';
//Styles
import styles from './Reports.module.css';

interface ReportLayoutProps {
    children: React.ReactNode; // The ReportConfigPanel
    reportData: ReportData | null;
    exportFormat: ExportFormat;
    reportName: string;
    isLoading: boolean;
}

/**
 * Shared layout wrapper for all report pages.
 * Handles config panel collapse/expand, loading state, and preview rendering.
 */
const ReportLayout = (props: ReportLayoutProps) => {
    const { children, reportData, exportFormat, reportName, isLoading } = props;
    const [configOpen, setConfigOpen] = useState(true);

    // Auto-collapse when report data is generated
    const hasReport = !isLoading && reportData !== null;

    useEffect(() => {
        if (isLoading === false) {
            setConfigOpen(false);
        }
    }, [isLoading]);

    return (
        <div className={styles['report-layout']}>
            {/* Config toggle button — visible when panel is collapsed */}
            {hasReport && !configOpen && (
                <>
                    <div className={styles['config-toggle-bar']}>
                        <Tooltip title="Show report settings">
                            <Button
                                size="small"
                                startIcon={<TuneIcon />}
                                onClick={() => setConfigOpen(true)}
                                sx={{ textTransform: 'none', color: '#666', fontSize: '0.8125rem' }}
                            >
                                Report Settings
                            </Button>
                        </Tooltip>
                        <Tooltip title="Expand settings">
                            <IconButton size="large" onClick={() => setConfigOpen(true)} sx={{ color: '#999' }}>
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Tooltip>
                    </div>
                </>
            )}

            {/* Collapsible config panel */}
            <Collapse in={!hasReport || configOpen} timeout={300}>
                <div style={{ position: 'relative' }}>
                    {children}
                    {/* Collapse button — visible when report is shown and panel is open */}
                    {hasReport && configOpen && (
                        <div className={styles['config-collapse-btn']}>
                            <Tooltip title="Collapse settings">
                                <IconButton size="large" onClick={() => setConfigOpen(false)} sx={{ color: '#999' }}>
                                    <KeyboardArrowUpIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </Collapse>

            {/* Loading state */}
            {isLoading && <Loader />}

            {/* Preview — fills remaining viewport */}
            {hasReport && <ReportPreview data={reportData.data} headerValues={reportData.headerValues} exportFormat={exportFormat} reportName={reportName} />}
        </div>
    );
};

export default ReportLayout;
