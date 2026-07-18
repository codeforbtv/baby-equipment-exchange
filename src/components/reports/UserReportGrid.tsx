'use client';

import { Autocomplete, Box, Button, Checkbox, Chip, Stack, TextField, Typography } from '@mui/material';
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
import { exportGridXlsx, reportFileName } from './reportExport';
import { columnsPanelSx, filterListboxProps } from './reportGridStyles';
import { clearViewState, loadViewState, saveViewState } from './reportViewState';

interface UserReportToolbarProps {
    onExportCsv: () => void;
    onExportXlsx: () => void;
    onResetView: () => void;
    columnsButtonRef: (el: HTMLButtonElement | null) => void;
}

function UserReportToolbar({ onExportCsv, onExportXlsx, onResetView, columnsButtonRef }: UserReportToolbarProps) {
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

    const [savedView] = useState(() => loadViewState('users'));

    const [orgFilter, setOrgFilter] = useState<string[]>(savedView?.orgFilter ?? []);
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => {
        // Merge over defaults so columns added after a view was saved keep their
        // default visibility instead of DataGrid's absent-means-visible default.
        const base = buildUserColumnVisibilityModel(userVisibleColumns);
        return savedView?.columnVisibilityModel ? { ...base, ...savedView.columnVisibilityModel } : base;
    });
    const [sortModel, setSortModel] = useState<GridSortModel>(savedView?.sortModel ?? userSortModel);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: savedView?.pageSize ?? 100 });

    useEffect(() => {
        const handle = setTimeout(() => {
            saveViewState('users', {
                statusFilter: [],
                orgFilter,
                requestorFilter: [],
                dateField: 'createdAt',
                dateFrom: null,
                dateTo: null,
                columnVisibilityModel,
                sortModel,
                pageSize: paginationModel.pageSize
            });
        }, 300);
        return () => clearTimeout(handle);
    }, [orgFilter, columnVisibilityModel, sortModel, paginationModel.pageSize]);

    const handleResetView = () => {
        clearViewState('users');
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
    const orgOptions = useMemo(() => [...new Set(organizations.map((org) => org.name))], [organizations]);

    const filteredRows = useMemo(() => {
        if (orgFilter.length === 0) return rows;
        return rows.filter((row) => orgFilter.includes(row.orgName));
    }, [rows, orgFilter]);

    const handleExportCsv = () => {
        apiRef.current.exportDataAsCsv({ fileName: reportFileName('users_export') });
    };

    const handleExportXlsx = () => {
        exportGridXlsx(apiRef, reportFileName('users_export'));
    };

    return (
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
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[25, 50, 100]}
                    sx={{ border: 'none' }}
                    slots={{ toolbar: UserReportToolbar, noRowsOverlay: NoRowsOverlay }}
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
    );
};

export default UserReportGrid;
