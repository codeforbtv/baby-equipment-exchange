'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, Typography } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { ReportRow } from './reportGridColumns';

type ColumnOrderDialogProps = {
    open: boolean;
    columns: GridColDef<ReportRow>[];
    onClose: () => void;
    onSave: (order: string[]) => void;
    onReset: () => void;
};

export default function ColumnOrderDialog({ open, columns, onClose, onSave, onReset }: ColumnOrderDialogProps) {
    const [fields, setFields] = useState<string[]>([]);

    useEffect(() => {
        if (open) setFields(columns.map((col) => col.field));
    }, [open, columns]);

    const labelFor = (field: string) => columns.find((col) => col.field === field)?.headerName ?? field;

    const move = (index: number, delta: number) => {
        const target = index + delta;
        if (target < 0 || target >= fields.length) return;
        const next = [...fields];
        [next[index], next[target]] = [next[target], next[index]];
        setFields(next);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{ pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Reorder Columns
                <IconButton size="small" aria-label="close" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="caption" sx={{ color: '#888' }}>
                    Only columns currently shown in the grid are listed. Use the Columns button to show or hide columns.
                </Typography>
                <List dense>
                    {fields.map((field, index) => (
                        <ListItem
                            key={field}
                            disableGutters
                            secondaryAction={
                                <>
                                    <IconButton size="small" aria-label={`Move ${labelFor(field)} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                                        <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        aria-label={`Move ${labelFor(field)} down`}
                                        disabled={index === fields.length - 1}
                                        onClick={() => move(index, 1)}
                                    >
                                        <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                </>
                            }
                        >
                            <ListItemText primary={labelFor(field)} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onReset} sx={{ mr: 'auto' }}>
                    Reset order
                </Button>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(fields)}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
