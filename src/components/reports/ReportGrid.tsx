'use client';

import { Autocomplete, Box, Button, Checkbox, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
    DataGrid,
    GridColumnVisibilityModel,
    GridPaginationModel,
    GridSortModel,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarQuickFilter,
    gridFilteredTopLevelRowCountSelector,
    useGridApiContext,
    useGridApiRef,
    useGridSelector
} from '@mui/x-data-grid';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { allStatuses, buildColumnVisibilityModel, dateFilterFields, ReportPreset, ReportRow, ReportType, reportGridColumns } from './reportGridColumns';
import { exportGridXlsx, reportFileName } from './reportExport';
import { columnsPanelSx, filterListboxProps } from './reportGridStyles';
import { clearViewState, loadViewState, saveViewState } from './reportViewState';
import { getStatusChipProps } from '@/utils/statusChipProps';

declare module '@mui/x-data-grid' {
    interface ToolbarPropsOverrides {
        onExportCsv: () => void;
        onExportXlsx: () => void;
        onResetView: () => void;
        columnsButtonRef: (el: HTMLButtonElement | null) => void;
    }
}

interface ReportToolbarProps {
    onExportCsv: () => void;
    onExportXlsx: () => void;
    onResetView: () => void;
    columnsButtonRef: (el: HTMLButtonElement | null) => void;
}

function ReportToolbar({ onExportCsv, onExportXlsx, onResetView, columnsButtonRef }: ReportToolbarProps) {
    const apiRef = useGridApiContext();
    const rowCount = useGridSelector(apiRef, gridFilteredTopLevelRowCountSelector);

    return (
        <GridToolbarContainer sx={{ px: 1.5, py: 0.75, gap: 1, borderBottom: '1px solid #f0f0f0' }}>
            <GridToolbarQuickFilter debounceMs={300} />
            <Box sx={{ flexGrow: 1 }} />
            <GridToolbarColumnsButton ref={columnsButtonRef} />
            <Button size="small" startIcon={<DownloadIcon />} onClick={onExportCsv} sx={{ textTransform: 'none' }}>
                Export CSV
            </Button>
            <Button size="small" startIcon={<DownloadIcon />} onClick={onExportXlsx} sx={{ textTransform: 'none' }}>
                Export XLSX
            </Button>
            <Button size="small" startIcon={<RestartAltIcon />} onClick={onResetView} sx={{ textTransform: 'none' }}>
                Reset view
            </Button>
            <Typography variant="caption" sx={{ ml: 1, color: '#999', whiteSpace: 'nowrap' }}>
                {rowCount} row{rowCount !== 1 ? 's' : ''}
            </Typography>
        </GridToolbarContainer>
    );
}

function NoRowsOverlay() {
    return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: '#999', gap: 1 }}>
            <TableChartIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="body1" sx={{ color: '#999' }}>
                No data matches your filters.
            </Typography>
            <Typography variant="caption" sx={{ color: '#bbb' }}>
                Try broadening your selection criteria.
            </Typography>
        </Stack>
    );
}

type ReportGridProps = {
    preset: ReportPreset;
    reportType: ReportType;
    rows: ReportRow[];
    organizations: { id: string; name: string }[];
    requestors: { id: string; name: string; email: string }[];
    isLoading: boolean;
};

const ReportGrid = (props: ReportGridProps) => {
    const { preset, reportType, rows, organizations, requestors, isLoading } = props;
    const apiRef = useGridApiRef();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [panelAnchorEl, setPanelAnchorEl] = useState<HTMLButtonElement | null>(null);

    const [savedView] = useState(() => loadViewState(reportType));

    const [statusFilter, setStatusFilter] = useState<string[]>(savedView?.statusFilter ?? preset.defaultStatuses);
    const [orgFilter, setOrgFilter] = useState<string[]>(savedView?.orgFilter ?? []);
    const [requestorFilter, setRequestorFilter] = useState<{ id: string; name: string; email: string }[]>(savedView?.requestorFilter ?? []);
    const [dateField, setDateField] = useState<string>(savedView?.dateField ?? 'createdAt');
    const [dateFrom, setDateFrom] = useState<Dayjs | null>(savedView?.dateFrom ? dayjs(savedView.dateFrom) : null);
    const [dateTo, setDateTo] = useState<Dayjs | null>(savedView?.dateTo ? dayjs(savedView.dateTo) : null);

    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => {
        // Merge over preset defaults so columns added after a view was saved keep their
        // preset visibility instead of DataGrid's absent-means-visible default.
        const base = buildColumnVisibilityModel(preset.visibleColumns);
        return savedView?.columnVisibilityModel ? { ...base, ...savedView.columnVisibilityModel } : base;
    });
    const [sortModel, setSortModel] = useState<GridSortModel>(savedView?.sortModel ?? preset.sortModel);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: savedView?.pageSize ?? 100 });

    useEffect(() => {
        const handle = setTimeout(() => {
            saveViewState(reportType, {
                statusFilter,
                orgFilter,
                requestorFilter,
                dateField,
                dateFrom: dateFrom ? dateFrom.toISOString() : null,
                dateTo: dateTo ? dateTo.toISOString() : null,
                columnVisibilityModel,
                sortModel,
                pageSize: paginationModel.pageSize
            });
        }, 300);
        return () => clearTimeout(handle);
    }, [reportType, statusFilter, orgFilter, requestorFilter, dateField, dateFrom, dateTo, columnVisibilityModel, sortModel, paginationModel.pageSize]);

    const handleResetView = () => {
        clearViewState(reportType);
        setStatusFilter(preset.defaultStatuses);
        setOrgFilter([]);
        setRequestorFilter([]);
        setDateField('createdAt');
        setDateFrom(null);
        setDateTo(null);
        setColumnVisibilityModel(buildColumnVisibilityModel(preset.visibleColumns));
        setSortModel(preset.sortModel);
        setPaginationModel({ page: 0, pageSize: 100 });
    };

    const [cardHeight, setCardHeight] = useState<string>('calc(100vh - 320px)');
    useEffect(() => {
        const update = () => {
            const el = cardRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            setCardHeight(`calc(100vh - ${Math.round(top)}px - 16px)`);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Several orgs exist as duplicate docs under the same name; filtering is by name, so
    // the dropdown would otherwise show the same option twice.
    const orgOptions = useMemo(() => [...new Set(organizations.map((org) => org.name))], [organizations]);

    const filteredRows = useMemo(() => {
        const fromDate = dateFrom ? dateFrom.startOf('day').toDate() : null;
        const toDate = dateTo ? dateTo.endOf('day').toDate() : null;
        return rows.filter((row) => {
            if (preset.requireRequestor && !row.requestorId) return false;
            if (statusFilter.length > 0 && !statusFilter.includes(row.status)) return false;
            if (orgFilter.length > 0 && !orgFilter.includes(row.orgName)) return false;
            if (requestorFilter.length > 0 && !requestorFilter.some((r) => r.id === row.requestorId)) return false;
            if (fromDate || toDate) {
                const value = row[dateField as keyof ReportRow] as Date | null;
                if (!value) return false;
                if (fromDate && value < fromDate) return false;
                if (toDate && value > toDate) return false;
            }
            return true;
        });
    }, [rows, preset.requireRequestor, statusFilter, orgFilter, requestorFilter, dateField, dateFrom, dateTo]);

    const handleExportCsv = () => {
        apiRef.current.exportDataAsCsv({ fileName: reportFileName(preset.fileName) });
    };

    const handleExportXlsx = () => {
        exportGridXlsx(apiRef, reportFileName(preset.fileName));
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
                ref={cardRef}
                sx={{
                    width: 0,
                    minWidth: '100%',
                    height: cardHeight,
                    minHeight: 480,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #eaeaea',
                    borderRadius: 2,
                    bgcolor: '#fff',
                    overflow: 'hidden'
                }}
            >
                <Stack
                    sx={{
                        gap: 2,
                        px: 1.5,
                        py: 1.5,
                        bgcolor: '#fafafa',
                        borderBottom: '1px solid #eaeaea',
                        '& .MuiInputBase-root': { bgcolor: '#fff' }
                    }}
                >
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
                        <Autocomplete
                            sx={{ width: 680, maxWidth: '100%', flexShrink: 0 }}
                            multiple
                            size="small"
                            limitTags={5}
                            disableCloseOnSelect
                            id="report-status-filter"
                            ListboxProps={filterListboxProps}
                            options={allStatuses}
                            getOptionLabel={(option) => getStatusChipProps(option).label}
                            value={statusFilter}
                            onChange={(event, newValue) => setStatusFilter(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Status"
                                    placeholder={statusFilter.length === 0 ? 'All statuses' : ''}
                                    InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                                />
                            )}
                            renderOption={(optionProps, option, { selected }) => {
                                const { key, ...rest } = optionProps;
                                return (
                                    <li key={key} {...rest}>
                                        <Checkbox size="small" checked={selected} sx={{ mr: 1, py: 0 }} />
                                        <Chip size="small" {...getStatusChipProps(option)} />
                                    </li>
                                );
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return <Chip key={key} size="small" {...getStatusChipProps(option)} {...tagProps} />;
                                })
                            }
                        />

                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ ml: { md: 'auto' }, flexShrink: 0, flexWrap: { xs: 'wrap', sm: 'nowrap' }, rowGap: 1.5 }}
                        >
                            <FormControl size="small" sx={{ width: 185 }}>
                                <InputLabel id="report-date-field-label">Date field</InputLabel>
                                <Select
                                    labelId="report-date-field-label"
                                    id="report-date-field"
                                    value={dateField}
                                    label="Date field"
                                    onChange={(event) => setDateField(event.target.value)}
                                >
                                    {dateFilterFields.map((option) => (
                                        <MenuItem key={option.field} value={option.field}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <DatePicker
                                label="From"
                                value={dateFrom}
                                onChange={(newValue) => setDateFrom(newValue)}
                                disableFuture
                                maxDate={dateTo ?? undefined}
                                slotProps={{
                                    textField: { size: 'small', sx: { width: 185 }, InputLabelProps: { shrink: true } },
                                    field: { clearable: true },
                                    clearButton: { size: 'small', sx: { p: 0.25, bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } } },
                                    clearIcon: { fontSize: 'small' },
                                    openPickerButton: { size: 'small', sx: { p: 0.25 } },
                                    openPickerIcon: { fontSize: 'small' }
                                }}
                            />
                            <DatePicker
                                label="To"
                                value={dateTo}
                                onChange={(newValue) => setDateTo(newValue)}
                                disableFuture
                                minDate={dateFrom ?? undefined}
                                slotProps={{
                                    textField: { size: 'small', sx: { width: 185 }, InputLabelProps: { shrink: true } },
                                    field: { clearable: true },
                                    clearButton: { size: 'small', sx: { p: 0.25, bgcolor: 'transparent', '&:hover': { bgcolor: 'transparent' } } },
                                    clearIcon: { fontSize: 'small' },
                                    openPickerButton: { size: 'small', sx: { p: 0.25 } },
                                    openPickerIcon: { fontSize: 'small' }
                                }}
                            />
                        </Stack>
                    </Stack>

                    {preset.filterWidget === 'organization' && (
                        <Autocomplete
                            sx={{ width: 680, maxWidth: '100%', flexShrink: 0 }}
                            multiple
                            size="small"
                            limitTags={2}
                            disableCloseOnSelect
                            id="report-org-filter"
                            ListboxProps={filterListboxProps}
                            options={orgOptions}
                            value={orgFilter}
                            onChange={(event, newValue) => setOrgFilter(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Organization"
                                    placeholder={orgFilter.length === 0 ? 'All organizations' : ''}
                                    InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                                />
                            )}
                            renderOption={(optionProps, option, { selected }) => {
                                const { key, ...rest } = optionProps;
                                return (
                                    <li key={key} {...rest}>
                                        <Checkbox size="small" checked={selected} sx={{ mr: 1, py: 0 }} />
                                        {option}
                                    </li>
                                );
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return <Chip key={key} size="small" label={option} {...tagProps} />;
                                })
                            }
                        />
                    )}

                    {preset.filterWidget === 'requestor' && (
                        <Autocomplete
                            sx={{ width: 680, maxWidth: '100%', flexShrink: 0 }}
                            multiple
                            size="small"
                            limitTags={2}
                            disableCloseOnSelect
                            id="report-requestor-filter"
                            ListboxProps={filterListboxProps}
                            options={requestors}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={requestorFilter}
                            onChange={(event, newValue) => setRequestorFilter(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Requestor"
                                    placeholder={requestorFilter.length === 0 ? 'All requestors' : ''}
                                    InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                                />
                            )}
                            renderOption={(optionProps, option, { selected }) => {
                                const { key, ...rest } = optionProps;
                                return (
                                    <li key={key} {...rest}>
                                        <Checkbox size="small" checked={selected} sx={{ mr: 1, py: 0 }} />
                                        {option.name}
                                    </li>
                                );
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return <Chip key={key} size="small" label={option.name} {...tagProps} />;
                                })
                            }
                        />
                    )}
                </Stack>

                <Box sx={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%' }}>
                    <DataGrid
                        apiRef={apiRef}
                        rows={filteredRows}
                        columns={reportGridColumns}
                        loading={isLoading}
                        density="compact"
                        disableRowSelectionOnClick
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={setColumnVisibilityModel}
                        sortModel={sortModel}
                        onSortModelChange={setSortModel}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[25, 50, 100]}
                        sx={{ border: 'none' }}
                        slots={{ toolbar: ReportToolbar, noRowsOverlay: NoRowsOverlay }}
                        slotProps={{
                            toolbar: {
                                onExportCsv: handleExportCsv,
                                onExportXlsx: handleExportXlsx,
                                onResetView: handleResetView,
                                columnsButtonRef: setPanelAnchorEl
                            },
                            loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
                            panel: {
                                anchorEl: panelAnchorEl ?? undefined,
                                placement: 'bottom-end',
                                sx: columnsPanelSx
                            }
                        }}
                    />
                </Box>
            </Box>
        </LocalizationProvider>
    );
};

export default ReportGrid;
