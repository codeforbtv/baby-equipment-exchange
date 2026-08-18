'use client';

import { Box, Checkbox, FormControlLabel, InputAdornment, TextField, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { gridColumnDefinitionsSelector, gridColumnVisibilityModelSelector, useGridApiContext, useGridSelector } from '@mui/x-data-grid';
import { useState } from 'react';

// Replaces the built-in columns management panel so each column's description is
// available (as a hover tooltip) before toggling it on.
export default function ReportColumnsPanel() {
    const apiRef = useGridApiContext();
    const columns = useGridSelector(apiRef, gridColumnDefinitionsSelector);
    const visibilityModel = useGridSelector(apiRef, gridColumnVisibilityModelSelector);
    const [search, setSearch] = useState('');

    const isVisible = (field: string) => visibilityModel[field] !== false;
    const query = search.trim().toLowerCase();
    const shown = columns.filter((col) => (col.headerName ?? col.field).toLowerCase().includes(query));
    // Scoped to the search results so "Show/Hide All" never touches columns the user filtered out.
    const allVisible = shown.length > 0 && shown.every((col) => isVisible(col.field));
    const noneVisible = shown.every((col) => !isVisible(col.field));

    const toggleAll = () => {
        const next = !allVisible;
        apiRef.current.setColumnVisibilityModel({ ...visibilityModel, ...Object.fromEntries(shown.map((col) => [col.field, next])) });
    };

    return (
        <Box sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
                <TextField
                    fullWidth
                    size="small"
                    autoFocus
                    placeholder="Search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <Box sx={{ overflowY: 'auto', maxHeight: 320, px: 1.5, py: 0.5 }}>
                {shown.map((col) => (
                    <Tooltip key={col.field} title={col.description ?? ''} placement="left" enterDelay={300}>
                        <FormControlLabel
                            sx={{ display: 'flex', mx: 0, py: 0.25 }}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={isVisible(col.field)}
                                    onChange={() => apiRef.current.setColumnVisibility(col.field, !isVisible(col.field))}
                                    sx={{ py: 0.25, mr: 0.5 }}
                                />
                            }
                            label={col.headerName ?? col.field}
                            slotProps={{ typography: { fontSize: 14 } }}
                        />
                    </Tooltip>
                ))}
            </Box>
            <Box sx={{ borderTop: '1px solid #eee', px: 1.5, py: 0.5 }}>
                <FormControlLabel
                    sx={{ display: 'flex', mx: 0 }}
                    control={
                        <Checkbox
                            size="small"
                            checked={allVisible}
                            indeterminate={!allVisible && !noneVisible}
                            onChange={toggleAll}
                            sx={{ py: 0.25, mr: 0.5 }}
                        />
                    }
                    label="Show/Hide All"
                    slotProps={{ typography: { fontSize: 14 } }}
                />
            </Box>
        </Box>
    );
}
