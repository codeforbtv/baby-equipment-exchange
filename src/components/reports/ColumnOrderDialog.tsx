'use client';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type Announcements
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReportRow } from './reportGridColumns';

type ColumnOrderDialogProps = {
    open: boolean;
    columns: GridColDef<ReportRow>[];
    onClose: () => void;
    onSave: (order: string[]) => void;
    onReset: () => void;
};

const ACCENT = '#3d9991';

type RowProps = {
    field: string;
    label: string;
    position: number;
};

function SortableRow({ field, label, position }: RowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field });

    return (
        <Box
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1,
                py: 0.75,
                borderRadius: 1,
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                transform: CSS.Transform.toString(transform),
                transition,
                // The lifted copy lives in the DragOverlay, so the row left behind reads as the
                // gap it will fill rather than as a second copy of the same column.
                opacity: isDragging ? 0.25 : 1,
                '&:hover': { bgcolor: '#f5f5f5' },
                '&:hover .drag-handle': { color: ACCENT },
                '&:focus-visible': { outline: `2px solid ${ACCENT}`, outlineOffset: 2 }
            }}
        >
            <DragIndicatorIcon className="drag-handle" fontSize="small" sx={{ color: '#c4c4c4', transition: 'color 120ms' }} />
            <Typography variant="caption" sx={{ width: 18, textAlign: 'right', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>
                {position}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                {label}
            </Typography>
        </Box>
    );
}

export default function ColumnOrderDialog({ open, columns, onClose, onSave, onReset }: ColumnOrderDialogProps) {
    const [fields, setFields] = useState<string[]>([]);
    const [activeField, setActiveField] = useState<string | null>(null);

    useEffect(() => {
        if (open) setFields(columns.map((col) => col.field));
    }, [open, columns]);

    const labelFor = (field: string) => columns.find((col) => col.field === field)?.headerName ?? field;

    const sensors = useSensors(
        // A few pixels of slop so a click on the row doesn't register as a drag.
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => setActiveField(String(event.active.id));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveField(null);
        if (!over || active.id === over.id) return;
        setFields((current) => arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))));
    };

    const announcements: Announcements = {
        onDragStart: ({ active }) => `Picked up ${labelFor(String(active.id))}, position ${fields.indexOf(String(active.id)) + 1} of ${fields.length}.`,
        onDragOver: ({ active, over }) =>
            over ? `${labelFor(String(active.id))} moved to position ${fields.indexOf(String(over.id)) + 1} of ${fields.length}.` : '',
        onDragEnd: ({ active, over }) =>
            over
                ? `${labelFor(String(active.id))} dropped at position ${fields.indexOf(String(over.id)) + 1} of ${fields.length}.`
                : `${labelFor(String(active.id))} returned to its original position.`,
        onDragCancel: ({ active }) => `Reordering cancelled. ${labelFor(String(active.id))} returned to its original position.`
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
                <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 1.5 }}>
                    Drag a column to move it. Position 1 sits furthest left in the grid. To add or remove columns, use the Columns button.
                </Typography>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    accessibility={{ announcements }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveField(null)}
                >
                    <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {fields.map((field, index) => (
                                <SortableRow key={field} field={field} label={labelFor(field)} position={index + 1} />
                            ))}
                        </Box>
                    </SortableContext>
                    <DragOverlay>
                        {activeField ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    px: 1,
                                    py: 0.75,
                                    borderRadius: 1,
                                    bgcolor: '#fff',
                                    cursor: 'grabbing',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
                                    borderLeft: `3px solid ${ACCENT}`
                                }}
                            >
                                <DragIndicatorIcon fontSize="small" sx={{ color: ACCENT }} />
                                <Typography variant="caption" sx={{ width: 18, textAlign: 'right', color: '#aaa', fontVariantNumeric: 'tabular-nums' }}>
                                    {fields.indexOf(activeField) + 1}
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '0.875rem' }}>
                                    {labelFor(activeField)}
                                </Typography>
                            </Box>
                        ) : null}
                    </DragOverlay>
                </DndContext>
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
