'use client';

//Components
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    Button,
    Typography,
    Autocomplete,
    TextField,
    Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
//Hooks
import { useState } from 'react';
//Types
import {
    ReportColumn,
    donationColumns,
    organizationColumns,
    requestorColumns,
    activeStatuses,
    allStatuses,
    statusLabels
} from './reportColumns';
//Styles
import styles from './Reports.module.css';

export type ExportFormat = 'csv' | 'xlsx';

interface ReportConfigPanelProps {
    reportType: 'lifecycle' | 'organization' | 'requestor';
    availableColumns: ReportColumn[];
    selectedColumnKeys: string[];
    onSelectedColumnsChange: (keys: string[]) => void;
    onGenerate: (config: ReportConfig) => void;
    isLoading: boolean;
    // Organization report
    organizations?: { id: string; name: string }[];
    selectedOrgs?: string[];
    onSelectedOrgsChange?: (ids: string[]) => void;
    // Requestor report
    requestors?: { id: string; name: string; email: string }[];
    selectedRequestors?: string[];
    onSelectedRequestorsChange?: (ids: string[]) => void;
}

export interface ReportConfig {
    selectedStatuses: string[];
    exportFormat: ExportFormat;
}

const ReportConfigPanel = (props: ReportConfigPanelProps) => {
    const {
        reportType,
        availableColumns,
        selectedColumnKeys,
        onSelectedColumnsChange,
        onGenerate,
        isLoading,
        organizations,
        selectedOrgs,
        onSelectedOrgsChange,
        requestors,
        selectedRequestors,
        onSelectedRequestorsChange
    } = props;

    const [activeOnly, setActiveOnly] = useState<boolean>(true);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...activeStatuses]);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');

    // Column groups
    const columnGroups: { title: string; columns: ReportColumn[] }[] = [
        { title: 'Donation Fields', columns: donationColumns },
        { title: 'Requestor / Distributor', columns: requestorColumns }
    ];
    if (reportType === 'organization') {
        columnGroups.push({ title: 'Organization Fields', columns: organizationColumns });
    }

    const handleColumnToggle = (key: string) => {
        if (selectedColumnKeys.includes(key)) {
            onSelectedColumnsChange(selectedColumnKeys.filter((k) => k !== key));
        } else {
            onSelectedColumnsChange([...selectedColumnKeys, key]);
        }
    };

    const handleStatusToggle = (status: string) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const handleSelectAllStatuses = () => {
        setSelectedStatuses(selectedStatuses.length === allStatuses.length ? [] : [...allStatuses]);
    };

    const handleActiveToggle = (_: React.MouseEvent<HTMLElement>, value: string | null) => {
        if (value === null) return;
        const isActive = value === 'active';
        setActiveOnly(isActive);
        setSelectedStatuses(isActive ? [...activeStatuses] : [...allStatuses]);
    };

    const handleGenerate = () => {
        onGenerate({ selectedStatuses, exportFormat });
    };

    return (
        <div className={styles['config-panel']}>
            {/* Active / All toggle + Format selector */}
            <div className={styles['config-controls']}>
                <span className={styles['config-controls__label']}>Scope:</span>
                <ToggleButtonGroup
                    value={activeOnly ? 'active' : 'all'}
                    exclusive
                    onChange={handleActiveToggle}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.8125rem', padding: '4px 12px' } }}
                >
                    <ToggleButton value="active">Active</ToggleButton>
                    <ToggleButton value="all">All</ToggleButton>
                </ToggleButtonGroup>

                <span className={styles['config-controls__label']} style={{ marginLeft: 'auto' }}>
                    Format:
                </span>
                <ToggleButtonGroup
                    value={exportFormat}
                    exclusive
                    onChange={(_, v) => v && setExportFormat(v)}
                    size="small"
                    sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.8125rem', padding: '4px 12px' } }}
                >
                    <ToggleButton value="xlsx">XLSX</ToggleButton>
                    <ToggleButton value="csv">CSV</ToggleButton>
                </ToggleButtonGroup>
            </div>

            {/* Lifecycle stage filter */}
            <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 500, mb: 0.5, display: 'block' }}>
                    Lifecycle Stages
                </Typography>
                <div className={styles['status-chips']}>
                    <Chip
                        label="Select All"
                        size="small"
                        variant={selectedStatuses.length === allStatuses.length ? 'filled' : 'outlined'}
                        onClick={handleSelectAllStatuses}
                        sx={{ fontSize: '0.75rem' }}
                    />
                    {allStatuses.map((status) => (
                        <Chip
                            key={status}
                            label={statusLabels[status]}
                            size="small"
                            variant={selectedStatuses.includes(status) ? 'filled' : 'outlined'}
                            color={selectedStatuses.includes(status) ? 'primary' : 'default'}
                            onClick={() => handleStatusToggle(status)}
                            sx={{ fontSize: '0.75rem' }}
                        />
                    ))}
                </div>
            </Box>

            {/* Column selector */}
            {columnGroups.map((group) => (
                <Accordion
                    key={group.title}
                    disableGutters
                    elevation={0}
                    sx={{ '&:before': { display: 'none' }, border: '1px solid #eaeaea', borderRadius: '4px !important' }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { margin: '8px 0' } }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#555' }}>
                            {group.title}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                        <div className={styles['column-grid']}>
                            {group.columns
                                .filter((col) => availableColumns.some((ac) => ac.key === col.key))
                                .map((col) => (
                                    <FormControlLabel
                                        key={col.key}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={selectedColumnKeys.includes(col.key)}
                                                onChange={() => handleColumnToggle(col.key)}
                                            />
                                        }
                                        label={<Typography sx={{ fontSize: '0.8125rem' }}>{col.label}</Typography>}
                                    />
                                ))}
                        </div>
                    </AccordionDetails>
                </Accordion>
            ))}

            {/* Organization filter */}
            {reportType === 'organization' && organizations && onSelectedOrgsChange && (
                <div className={styles['filter-section']}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={organizations}
                        getOptionLabel={(opt) => opt.name}
                        value={organizations.filter((o) => selectedOrgs?.includes(o.id))}
                        onChange={(_, val) => onSelectedOrgsChange(val.map((v) => v.id))}
                        renderInput={(params) => <TextField {...params} label="Filter by Organization" placeholder="All organizations" />}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                    />
                </div>
            )}

            {/* Requestor filter */}
            {reportType === 'requestor' && requestors && onSelectedRequestorsChange && (
                <div className={styles['filter-section']}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={requestors}
                        getOptionLabel={(opt) => `${opt.name} (${opt.email})`}
                        value={requestors.filter((r) => selectedRequestors?.includes(r.id))}
                        onChange={(_, val) => onSelectedRequestorsChange(val.map((v) => v.id))}
                        renderInput={(params) => <TextField {...params} label="Filter by Requestor" placeholder="Search requestors..." />}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                    />
                </div>
            )}

            {/* Generate button */}
            <div className={styles['generate-row']}>
                <Button
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={handleGenerate}
                    disabled={isLoading || selectedStatuses.length === 0 || selectedColumnKeys.length === 0}
                    sx={{ textTransform: 'none' }}
                >
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>
                {selectedColumnKeys.length === 0 && (
                    <Typography variant="caption" color="error">
                        Select at least one column
                    </Typography>
                )}
            </div>
        </div>
    );
};

export default ReportConfigPanel;
