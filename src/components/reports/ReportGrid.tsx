'use client';

import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    FormControl,
    InputLabel,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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
import {
    allStatuses,
    buildColumnVisibilityModel,
    dateFilterFields,
    pageSizeOptionsFor,
    ReportPreset,
    ReportRow,
    ReportType,
    reportGridColumns
} from './reportGridColumns';
import ColumnOrderDialog from './ColumnOrderDialog';
import ReportColumnsPanel from './ReportColumnsPanel';
import { exportGridXlsx, reportFileName } from './reportExport';
import { columnsPanelSx, dateFieldMenuPaperSx, filterListboxProps, toolbarMenuPaperSx } from './reportGridStyles';
import { clearDefaultViewState, loadDefaultViewState, loadViewState, ReportViewState, saveDefaultViewState, saveViewState } from './reportViewState';
import { getStatusChipProps } from '@/utils/statusChipProps';

declare module '@mui/x-data-grid' {
    interface ToolbarPropsOverrides {
        onExportCsv: () => void;
        onExportXlsx: () => void;
        onResetView: () => void;
        onSaveDefault: () => void;
        columnsButtonRef: (el: HTMLButtonElement | null) => void;
        // Optional: the Users tab reuses this toolbar contract without a reorder or status control.
        onReorder?: () => void;
        statusFilter?: string[];
        onStatusFilterChange?: (next: string[]) => void;
    }
}

interface ReportToolbarProps {
    onExportCsv: () => void;
    onExportXlsx: () => void;
    onResetView: () => void;
    onSaveDefault: () => void;
    onReorder?: () => void;
    statusFilter?: string[];
    onStatusFilterChange?: (next: string[]) => void;
    columnsButtonRef: (el: HTMLButtonElement | null) => void;
}

function ReportToolbar({
    onExportCsv,
    onExportXlsx,
    onResetView,
    onSaveDefault,
    onReorder,
    statusFilter,
    onStatusFilterChange,
    columnsButtonRef
}: ReportToolbarProps) {
    const apiRef = useGridApiContext();
    const rowCount = useGridSelector(apiRef, gridFilteredTopLevelRowCountSelector);
    const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);
    const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

    const selectedCount = statusFilter?.length ?? 0;
    // Zero selected means no filter at all; an unadorned "Status" there reads as a broken control.
    const statusLabel = selectedCount === 0 ? 'Status (all)' : selectedCount === allStatuses.length ? 'Status' : `Status (${selectedCount})`;

    const toggleStatus = (status: string) => {
        if (!statusFilter || !onStatusFilterChange) return;
        onStatusFilterChange(statusFilter.includes(status) ? statusFilter.filter((value) => value !== status) : [...statusFilter, status]);
    };

    const runExport = (exporter: () => void) => {
        setExportAnchorEl(null);
        exporter();
    };

    return (
        <GridToolbarContainer sx={{ px: 1.5, py: 0.75, gap: 1, borderBottom: '1px solid #f0f0f0' }}>
            <GridToolbarQuickFilter debounceMs={300} />
            <Box sx={{ flexGrow: 1 }} />
            <GridToolbarColumnsButton ref={columnsButtonRef} />
            {statusFilter && onStatusFilterChange && (
                <>
                    <Button size="small" startIcon={<FilterListIcon />} onClick={(event) => setStatusAnchorEl(event.currentTarget)}>
                        {statusLabel}
                    </Button>
                    <Menu
                        anchorEl={statusAnchorEl}
                        open={Boolean(statusAnchorEl)}
                        onClose={() => setStatusAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        slotProps={{ paper: { sx: toolbarMenuPaperSx } }}
                        MenuListProps={{ dense: true }}
                    >
                        {allStatuses.map((status) => (
                            <MenuItem key={status} onClick={() => toggleStatus(status)} sx={{ py: 0.25 }}>
                                <Checkbox size="small" readOnly checked={statusFilter.includes(status)} sx={{ mr: 1, py: 0 }} />
                                <Chip size="small" {...getStatusChipProps(status)} />
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            )}
            {onReorder && (
                <Button size="small" startIcon={<SwapHorizIcon />} onClick={onReorder}>
                    Reorder
                </Button>
            )}
            <Button size="small" startIcon={<DownloadIcon />} onClick={(event) => setExportAnchorEl(event.currentTarget)}>
                Export
            </Button>
            <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                MenuListProps={{ dense: true }}
            >
                <MenuItem onClick={() => runExport(onExportCsv)}>CSV</MenuItem>
                <MenuItem onClick={() => runExport(onExportXlsx)}>Excel (XLSX)</MenuItem>
            </Menu>
            <Button size="small" startIcon={<BookmarkBorderIcon />} onClick={onSaveDefault}>
                Save as default
            </Button>
            <Button size="small" startIcon={<RestartAltIcon />} onClick={onResetView}>
                Reset to default
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
    donors: { name: string; email: string }[];
    isLoading: boolean;
};

const ReportGrid = (props: ReportGridProps) => {
    const { preset, reportType, rows, organizations, requestors, donors, isLoading } = props;
    const apiRef = useGridApiRef();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [panelAnchorEl, setPanelAnchorEl] = useState<HTMLButtonElement | null>(null);

    // Live view wins, then the user's saved default, then the preset.
    const [savedView] = useState(() => loadViewState(reportType) ?? loadDefaultViewState(reportType));
    const [defaultSavedOpen, setDefaultSavedOpen] = useState(false);
    const [previousDefault, setPreviousDefault] = useState<ReportViewState | null>(null);

    const [statusFilter, setStatusFilter] = useState<string[]>(savedView?.statusFilter ?? preset.defaultStatuses);
    const [orgFilter, setOrgFilter] = useState<string[]>(savedView?.orgFilter ?? []);
    const [requestorFilter, setRequestorFilter] = useState<{ id: string; name: string; email: string }[]>(savedView?.requestorFilter ?? []);
    const [donorFilter, setDonorFilter] = useState<{ name: string; email: string }[]>(savedView?.donorFilter ?? []);
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
    const [columnOrder, setColumnOrder] = useState<string[] | null>(savedView?.columnOrder ?? null);
    const [isReorderOpen, setIsReorderOpen] = useState<boolean>(false);

    const viewState = useMemo<ReportViewState>(
        () => ({
            statusFilter,
            orgFilter,
            requestorFilter,
            donorFilter,
            dateField,
            dateFrom: dateFrom ? dateFrom.toISOString() : null,
            dateTo: dateTo ? dateTo.toISOString() : null,
            columnVisibilityModel,
            sortModel,
            pageSize: paginationModel.pageSize,
            columnOrder: columnOrder ?? undefined
        }),
        [
            statusFilter,
            orgFilter,
            requestorFilter,
            donorFilter,
            dateField,
            dateFrom,
            dateTo,
            columnVisibilityModel,
            sortModel,
            paginationModel.pageSize,
            columnOrder
        ]
    );

    useEffect(() => {
        const handle = setTimeout(() => saveViewState(reportType, viewState), 300);
        return () => clearTimeout(handle);
    }, [reportType, viewState]);

    const applyViewState = (state: ReportViewState) => {
        setStatusFilter(state.statusFilter ?? preset.defaultStatuses);
        setOrgFilter(state.orgFilter ?? []);
        setRequestorFilter(state.requestorFilter ?? []);
        setDonorFilter(state.donorFilter ?? []);
        setDateField(state.dateField ?? 'createdAt');
        setDateFrom(state.dateFrom ? dayjs(state.dateFrom) : null);
        setDateTo(state.dateTo ? dayjs(state.dateTo) : null);
        setColumnVisibilityModel({ ...buildColumnVisibilityModel(preset.visibleColumns), ...state.columnVisibilityModel });
        setSortModel(state.sortModel ?? preset.sortModel);
        setPaginationModel({ page: 0, pageSize: state.pageSize ?? 100 });
        setColumnOrder(state.columnOrder ?? null);
    };

    const handleSaveDefault = () => {
        setPreviousDefault(loadDefaultViewState(reportType));
        saveDefaultViewState(reportType, viewState);
        setDefaultSavedOpen(true);
    };

    const handleUndoDefault = () => {
        if (previousDefault) {
            saveDefaultViewState(reportType, previousDefault);
        } else {
            clearDefaultViewState(reportType);
        }
        setDefaultSavedOpen(false);
    };

    // "The default" is the user's saved one when it exists, the preset otherwise —
    // Reset to default always returns to whichever that is. The live view key is not cleared:
    // the debounced save re-seeds it from the state set below anyway.
    const handleResetView = () => {
        const saved = loadDefaultViewState(reportType);
        if (saved) {
            applyViewState(saved);
            return;
        }
        setStatusFilter(preset.defaultStatuses);
        setOrgFilter([]);
        setRequestorFilter([]);
        setDonorFilter([]);
        setDateField('createdAt');
        setDateFrom(null);
        setDateTo(null);
        setColumnVisibilityModel(buildColumnVisibilityModel(preset.visibleColumns));
        setSortModel(preset.sortModel);
        setPaginationModel({ page: 0, pageSize: 100 });
        setColumnOrder(null);
    };

    const orderedColumns = useMemo(() => {
        if (!columnOrder) return reportGridColumns;
        const rank = new Map(columnOrder.map((field, i) => [field, i]));
        // Columns added after the order was saved keep their natural position at the end.
        return [...reportGridColumns].sort(
            (a, b) => (rank.get(a.field) ?? rank.size + reportGridColumns.indexOf(a)) - (rank.get(b.field) ?? rank.size + reportGridColumns.indexOf(b))
        );
    }, [columnOrder]);

    const reorderableColumns = useMemo(
        () => orderedColumns.filter((col) => columnVisibilityModel[col.field] !== false),
        [orderedColumns, columnVisibilityModel]
    );

    const handleSaveColumnOrder = (order: string[]) => {
        setColumnOrder(order);
        setIsReorderOpen(false);
    };

    const handleResetColumnOrder = () => {
        setColumnOrder(null);
        setIsReorderOpen(false);
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
            if (donorFilter.length > 0 && !donorFilter.some((d) => (d.email ? d.email === row.donorEmail : d.name === row.donorName))) return false;
            if (fromDate || toDate) {
                const value = row[dateField as keyof ReportRow] as Date | null;
                if (!value) return false;
                if (fromDate && value < fromDate) return false;
                if (toDate && value > toDate) return false;
            }
            return true;
        });
    }, [rows, preset.requireRequestor, statusFilter, orgFilter, requestorFilter, donorFilter, dateField, dateFrom, dateTo]);

    const pageSizeOptions = useMemo(() => pageSizeOptionsFor(filteredRows.length), [filteredRows.length]);
    // Kept out of state: a transient row count (empty during the fetch, or a narrow filter)
    // must never rewrite — and persist — the page size the user actually chose.
    const effectivePageSize = Math.min(paginationModel.pageSize, pageSizeOptions[pageSizeOptions.length - 1]);

    const handleDateFieldChange = (value: string) => {
        setDateField(value);
        // Only distributed items carry a distribution date, so picking it against a status
        // set that excludes distributed would empty the grid. Additive only, and never on
        // mount — a saved view with that combination is left alone for the hint to explain.
        if (value === 'dateDistributed' && statusFilter.length > 0 && !statusFilter.includes('distributed')) {
            setStatusFilter([...statusFilter, 'distributed']);
        }
    };

    const handleExportCsv = () => {
        apiRef.current.exportDataAsCsv({ fileName: reportFileName(preset.fileName) });
    };

    const handleExportXlsx = () => {
        exportGridXlsx(apiRef, reportFileName(preset.fileName));
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Paper
                variant="outlined"
                ref={cardRef}
                sx={{
                    width: 0,
                    minWidth: '100%',
                    height: cardHeight,
                    minHeight: 480,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
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
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, rowGap: 1.5 }}>
                        <FormControl size="small" sx={{ width: 185 }}>
                            <InputLabel id="report-date-field-label">Date field</InputLabel>
                            <Select
                                labelId="report-date-field-label"
                                id="report-date-field"
                                value={dateField}
                                label="Date field"
                                onChange={(event) => handleDateFieldChange(event.target.value)}
                                renderValue={(value) => dateFilterFields.find((option) => option.field === value)?.label ?? ''}
                                MenuProps={{ slotProps: { paper: { sx: dateFieldMenuPaperSx } } }}
                            >
                                {dateFilterFields.map((option) => (
                                    <MenuItem key={option.field} value={option.field} sx={{ display: 'block', py: 0.75 }}>
                                        <Typography variant="body2">{option.label}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: '#777', whiteSpace: 'normal' }}>
                                            {option.description}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <DatePicker
                            label="From"
                            format="MM/DD/YYYY"
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
                            format="MM/DD/YYYY"
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

                    {dateField === 'dateDistributed' && statusFilter.length > 0 && !statusFilter.includes('distributed') && (
                        <Typography variant="caption" sx={{ color: '#b26a00' }}>
                            Only items with status Distributed have a distribution date — add Distributed to the Status filter to see results.
                        </Typography>
                    )}

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

                    {preset.filterWidget === 'donor' && (
                        <Autocomplete
                            sx={{ width: 680, maxWidth: '100%', flexShrink: 0 }}
                            multiple
                            size="small"
                            limitTags={2}
                            disableCloseOnSelect
                            id="report-donor-filter"
                            ListboxProps={filterListboxProps}
                            options={donors}
                            getOptionLabel={(option) => (option.email ? `${option.name} (${option.email})` : option.name)}
                            isOptionEqualToValue={(option, value) => (option.email || option.name) === (value.email || value.name)}
                            value={donorFilter}
                            onChange={(event, newValue) => setDonorFilter(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Donor"
                                    placeholder={donorFilter.length === 0 ? 'All donors' : ''}
                                    InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                                />
                            )}
                            renderOption={(optionProps, option, { selected }) => {
                                const { key, ...rest } = optionProps;
                                return (
                                    <li key={key} {...rest}>
                                        <Checkbox size="small" checked={selected} sx={{ mr: 1, py: 0 }} />
                                        {option.email ? `${option.name} (${option.email})` : option.name}
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
                        columns={orderedColumns}
                        loading={isLoading}
                        density="compact"
                        disableRowSelectionOnClick
                        columnVisibilityModel={columnVisibilityModel}
                        onColumnVisibilityModelChange={setColumnVisibilityModel}
                        sortModel={sortModel}
                        onSortModelChange={setSortModel}
                        paginationModel={{ page: paginationModel.page, pageSize: effectivePageSize }}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={pageSizeOptions}
                        sx={{ border: 'none' }}
                        slots={{ toolbar: ReportToolbar, noRowsOverlay: NoRowsOverlay, columnsManagement: ReportColumnsPanel }}
                        slotProps={{
                            toolbar: {
                                onExportCsv: handleExportCsv,
                                onExportXlsx: handleExportXlsx,
                                onResetView: handleResetView,
                                onSaveDefault: handleSaveDefault,
                                onReorder: () => setIsReorderOpen(true),
                                statusFilter,
                                onStatusFilterChange: setStatusFilter,
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

                <ColumnOrderDialog
                    open={isReorderOpen}
                    columns={reorderableColumns}
                    onClose={() => setIsReorderOpen(false)}
                    onSave={handleSaveColumnOrder}
                    onReset={handleResetColumnOrder}
                />

                <Snackbar
                    open={defaultSavedOpen}
                    autoHideDuration={6000}
                    onClose={() => setDefaultSavedOpen(false)}
                    message="Saved as your default view — Reset to default returns here"
                    action={
                        <>
                            <Button color="inherit" size="small" onClick={handleUndoDefault}>
                                Undo
                            </Button>
                            <IconButton size="small" aria-label="close" color="inherit" onClick={() => setDefaultSavedOpen(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </>
                    }
                />
            </Paper>
        </LocalizationProvider>
    );
};

export default ReportGrid;
