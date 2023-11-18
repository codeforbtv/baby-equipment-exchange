'use client'

//Components
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box/Box'
import Button from '@mui/material/Button/Button'
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import React, { useRef } from 'react'
import Typography from '@mui/material/Typography/Typography'
import Toolbar from '@mui/material/Toolbar/Toolbar';
import IconButton from '@mui/material/IconButton/IconButton';
import AppBar from '@mui/material/AppBar/AppBar';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import List from '@mui/material/List/List';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton';

const style = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    height: '50%',
    overflow: 'visible'
};

const Calendar: React.FC = () => {
    const calendarRef = useRef(null)
    const [open, setOpen] = React.useState(false);
    const [openDisclaimer, setOpenDisclaimer] = React.useState(false);
    const handleOpenDisclaimer = () => setOpenDisclaimer(true);
    const handleCloseDisclaimer = () => setOpenDisclaimer(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    return (
        <>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                editable
                events={[]}
                headerToolbar={{
                    left: 'volunteer',
                    right: 'timeGridDay,timeGridWeek,dayGridMonth'
                }}
                customButtons={{
                    volunteer: {
                        text: 'volunteer',
                        click: () => {
                            handleOpen()
                        }
                    }
                }}
                selectable
            />
            <div>
                <Dialog
                    open={open}
                    onClose={handleClose}
                    scroll='paper'
                    aria-labelledby="scroll-modal-title"
                    aria-describedby="scroll-modal-description"
                >
                    <DialogContent dividers>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Volunteer
                        </Typography>
                        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                            Available volunteer opportunities with us. Please be sure you have read our <a href="#">expectaions</a> and <a href="#">FAQs</a> about volunteering.
                        </Typography>
                        <div style={{ overflow: 'hidden' }}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <Typography>Pick Up (Burlington)</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography>
                                        A diaper collection is being held by one of the organizations we partner with.
                                        <a href="#">details...</a>
                                    </Typography>
                                    <Box sx={{ mt: 3, ml: 1, mb: 1 }}>
                                        <Button onClick={handleOpenDisclaimer}>confirm</Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                            <Accordion style={{ overflow: 'hidden' }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel2a-content"
                                    id="panel2a-header"
                                >
                                    <Typography>Deliver (Shelburne)</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography>
                                        This <a href="#">donation</a> is ready to be distributed!
                                        <br />
                                        <a href="#">details...</a>
                                    </Typography>
                                    <Box sx={{ mt: 3, ml: 1, mb: 1 }}>
                                        <Button onClick={handleOpenDisclaimer}>confirm</Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                            <Accordion disabled>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel3a-content"
                                    id="panel3a-header"
                                >
                                    <Typography>Pick Up (Dorset)<Chip label="cancelled" color="error" /></Typography>
                                </AccordionSummary>
                            </Accordion>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel2a-content"
                                    id="panel2a-header"
                                >
                                    <Typography>Deliver (Vergennes)</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography>
                                        This <a href="#">donation</a> is ready to be distributed!
                                        <br />
                                        <a href="#">details...</a>
                                    </Typography>
                                    <Box sx={{ mt: 3, ml: 1, mb: 1 }}>
                                        <Button onClick={handleOpenDisclaimer}>confirm</Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel2a-content"
                                    id="panel2a-header"
                                >
                                    <Typography>Office Work (Burlington)</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography>
                                        We could use a hand in our office making calls.
                                    </Typography>
                                    <Box sx={{ mt: 3, ml: 1, mb: 1 }}>
                                        <Button onClick={handleOpenDisclaimer}>confirm</Button>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div>
                <Dialog
                    fullScreen
                    open={openDisclaimer}
                    onClose={handleCloseDisclaimer}
                >
                    <AppBar sx={{ position: 'relative' }}>
                        <Toolbar>
                            <IconButton
                                edge="start"
                                color="inherit"
                                onClick={handleCloseDisclaimer}
                                aria-label="close"
                            >
                                <CloseIcon />
                            </IconButton>
                            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                                Reminder, you are scheduling to volunteer!
                            </Typography>
                            <Button autoFocus color="inherit" onClick={handleCloseDisclaimer}>
                                I understand!
                            </Button>
                        </Toolbar>
                    </AppBar>
                    <Typography>
                        Please notify our team at least 48 hours in advance if you are no longer available.
                    </Typography>
                    <List>
                        <ListItemButton>
                            <ListItemText primary="Meet donor" secondary="2024-03-21 @ 8:30 AM" />
                        </ListItemButton>
                        <Divider />
                        <ListItemButton>
                            <ListItemText primary="Meet donor" secondary="2024-03-21 @ 8:30 AM" />
                        </ListItemButton>
                        <Divider />
                        <ListItemButton>
                            <ListItemText
                                primary="Process donation"
                                secondary="2024-03-21 @ 12:15 PM"
                            />
                        </ListItemButton>
                    </List>
                </Dialog>
            </div>
        </>
    )
}

export default Calendar