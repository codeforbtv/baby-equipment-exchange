'use client';

import { Autocomplete, Box, Button, Checkbox, Chip, IconButton, Menu, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildUserColumnVisibilityModel, UserReportRow, userReportColumns, userSortModel, userVisibleColumns } from './userReportColumns';
import { pageSizeOptionsFor } from './reportGridColumns';
import ReportColumnsPanel from './ReportColumnsPanel';
import { exportGridXlsx, reportFileName } from './reportExport';
import { columnsPanelSx, filterListboxProps } from './reportGridStyles';
import { clearDefaultViewState, loadDefaultViewState, loadViewState, ReportViewState, saveDefaultViewState, saveViewState } from './reportViewState';

interface UserReportToolbarProps {
    onExportCsv: () => void;
    onExportXlsx: () => void;
    onResetView: () => void;
    onSaveDefault: () => void;
    columnsButtonRef: (el: HTMLButtonElement | null) => void;
}

function UserReportToolbar({ onExportCsv, onExportXlsx, onResetView, onSaveDefault, columnsButtonRef }: UserReportToolbarProps) {
    const apiRef = useGridApiContext();
    const rowCount = useGridSelector(apiRef, gridFilteredTopLevelRowCountSelector);
    const [exportAnchorEl, setExportAnchorEl] = useState<HTMLElement | null>(null);

    const runExport = (exporter: () => void) => {
        setExportAnchorEl(null);
        exporter();
    };

    return (
        <GridToolbarContainer sx={{ px: 1.5, py: 0.75, gap: 1, borderBottom: '1px solid #f0f0f0' }}>
            <GridToolbarQuickFilter debounceMs={300} />
            <Box sx={{ flexGrow: 1 }} />
            <GridToolbarColumnsButton ref={columnsButtonRef} />
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
                {rowCount} user{rowCount !== 1 ? 's' : ''}
            </Typography>
        </GridToolbarContainer>
    );
}

function NoRowsOverlay() {
    return (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', color: '#999', gap: 1 }}>
            <TableChartIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="body1" sx={{ color: '#999' }}>
                No users match your filters.
            </Typography>
            <Typography variant="caption" sx={{ color: '#bbb' }}>
                Try broadening your selection criteria.
            </Typography>
        </Stack>
    );
}

type UserReportGridProps = {
    rows: UserReportRow[];
    organizations: { id: string; name: string }[];
    isLoading: boolean;
};

const UserReportGrid = ({ rows, organizations, isLoading }: UserReportGridProps) => {
    const apiRef = useGridApiRef();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [panelAnchorEl, setPanelAnchorEl] = useState<HTMLButtonElement | null>(null);

    // Live view wins, then the user's saved default, then the defaults below.
    const [savedView] = useState(() => loadViewState('users') ?? loadDefaultViewState('users'));
    const [defaultSavedOpen, setDefaultSavedOpen] = useState(false);
    const [previousDefault, setPreviousDefault] = useState<ReportViewState | null>(null);

    const [orgFilter, setOrgFilter] = useState<string[]>(savedView?.orgFilter ?? []);
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => {
        // Merge over defaults so columns added after a view was saved keep their
        // default visibility instead of DataGrid's absent-means-visible default.
        const base = buildUserColumnVisibilityModel(userVisibleColumns);
        return savedView?.columnVisibilityModel ? { ...base, ...savedView.columnVisibilityModel } : base;
    });
    const [sortModel, setSortModel] = useState<GridSortModel>(savedView?.sortModel ?? userSortModel);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: savedView?.pageSize ?? 100 });

    const viewState = useMemo<ReportViewState>(
        () => ({
            statusFilter: [],
            orgFilter,
            requestorFilter: [],
            dateField: 'createdAt',
            dateFrom: null,
            dateTo: null,
            columnVisibilityModel,
            sortModel,
            pageSize: paginationModel.pageSize
        }),
        [orgFilter, columnVisibilityModel, sortModel, paginationModel.pageSize]
    );

    useEffect(() => {
        const handle = setTimeout(() => saveViewState('users', viewState), 300);
        return () => clearTimeout(handle);
    }, [viewState]);

    const applyViewState = (state: ReportViewState) => {
        setOrgFilter(state.orgFilter ?? []);
        setColumnVisibilityModel({ ...buildUserColumnVisibilityModel(userVisibleColumns), ...state.columnVisibilityModel });
        setSortModel(state.sortModel ?? userSortModel);
        setPaginationModel({ page: 0, pageSize: state.pageSize ?? 100 });
    };

    const handleSaveDefault = () => {
        setPreviousDefault(loadDefaultViewState('users'));
        saveDefaultViewState('users', viewState);
        setDefaultSavedOpen(true);
    };

    const handleUndoDefault = () => {
        if (previousDefault) {
            saveDefaultViewState('users', previousDefault);
        } else {
            clearDefaultViewState('users');
        }
        setDefaultSavedOpen(false);
    };

    // "The default" is the user's saved one when it exists, the preset otherwise —
    // Reset to default always returns to whichever that is. The live view key is not cleared:
    // the debounced save re-seeds it from the state set below anyway.
    const handleResetView = () => {
        const saved = loadDefaultViewState('users');
        if (saved) {
            applyViewState(saved);
            return;
        }
        setOrgFilter([]);
        setColumnVisibilityModel(buildUserColumnVisibilityModel(userVisibleColumns));
        setSortModel(userSortModel);
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
    const orgOptions = useMemo(() => [...new Set(organizations.map((org) => org.name).filter(Boolean))], [organizations]);

    const filteredRows = useMemo(() => {
        if (orgFilter.length === 0) return rows;
        return rows.filter((row) => orgFilter.includes(row.orgName));
    }, [rows, orgFilter]);

    const pageSizeOptions = useMemo(() => pageSizeOptionsFor(filteredRows.length), [filteredRows.length]);
    // Kept out of state: a transient row count (empty during the fetch, or a narrow filter)
    // must never rewrite — and persist — the page size the user actually chose.
    const effectivePageSize = Math.min(paginationModel.pageSize, pageSizeOptions[pageSizeOptions.length - 1]);

    const handleExportCsv = () => {
        apiRef.current.exportDataAsCsv({ fileName: reportFileName('users_export') });
    };

    const handleExportXlsx = () => {
        exportGridXlsx(apiRef, reportFileName('users_export'));
    };

    return (
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
                <Autocomplete
                    sx={{ width: 680, maxWidth: '100%', flexShrink: 0 }}
                    multiple
                    size="small"
                    limitTags={2}
                    disableCloseOnSelect
                    id="user-report-org-filter"
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
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, width: 0, minWidth: '100%' }}>
                <DataGrid
                    apiRef={apiRef}
                    rows={filteredRows}
                    columns={userReportColumns}
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
                    slots={{ toolbar: UserReportToolbar, noRowsOverlay: NoRowsOverlay, columnsManagement: ReportColumnsPanel }}
                    slotProps={{
                        toolbar: {
                            onExportCsv: handleExportCsv,
                            onExportXlsx: handleExportXlsx,
                            onResetView: handleResetView,
                            onSaveDefault: handleSaveDefault,
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
    );
};

export default UserReportGrid;
