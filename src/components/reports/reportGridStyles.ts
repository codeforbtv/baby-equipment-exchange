import { SxProps, Theme } from '@mui/material';

// MUI sizes the columns panel to its full option list (~970px for the report grids), which
// runs off the bottom of the screen and puts the "Show/Hide all" footer out of reach.
// Capping the scrollable list directly — rather than the paper — keeps the header and
// footer visible at their natural size and confines scrolling to the list.
export const columnsPanelSx: SxProps<Theme> = {
    '& .MuiDataGrid-columnsManagement': {
        maxHeight: 'min(260px, calc(100vh - 320px))',
        overflowY: 'auto'
    }
};

// Keeps long option lists (statuses, organizations, requestors) inside the viewport
// instead of running off the bottom of short screens.
export const filterListboxProps = {
    style: { maxHeight: 'min(320px, calc(100vh - 220px))' }
};
