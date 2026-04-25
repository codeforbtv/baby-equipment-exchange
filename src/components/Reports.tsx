'use client';

//Components
import { Tab, Tabs, Button, Menu, MenuItem, useMediaQuery } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CustomTabPanel from './CustomTabPanel';
import ProductLifecycleReport from './reports/ProductLifecycleReport';
import OrganizationReport from './reports/OrganizationReport';
import RequestorReport from './reports/RequestorReport';
//Hooks
import { useState } from 'react';
//Styles
import styles from '@/components/Dashboard.module.css';

const reportTabs = ['Product Lifecycle', 'By Organization', 'By Requestor'];

export default function Reports() {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <>
            <div className={styles['sub-navbar']}>
                {matches ? (
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        aria-label="reports"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            flex: 1,
                            minHeight: 44,
                            '& .MuiTab-root': {
                                color: '#888',
                                fontWeight: 500,
                                textTransform: 'none',
                                fontSize: '0.8125rem',
                                minHeight: 44,
                                padding: '8px 14px',
                                '&.Mui-selected': { color: '#333', fontWeight: 600 }
                            },
                            '& .MuiTabs-indicator': {
                                height: 2,
                                borderRadius: '2px 2px 0 0',
                                backgroundColor: '#333'
                            }
                        }}
                    >
                        {reportTabs.map((tab) => (
                            <Tab key={tab} label={tab} />
                        ))}
                    </Tabs>
                ) : (
                    <>
                        <Button
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', color: '#333' }}
                        >
                            {reportTabs[currentTab]}
                        </Button>
                        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
                            {reportTabs.map((tab, i) => (
                                <MenuItem
                                    key={tab}
                                    selected={i === currentTab}
                                    onClick={() => {
                                        setCurrentTab(i);
                                        setAnchorEl(null);
                                    }}
                                >
                                    {tab}
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
            </div>

            <CustomTabPanel value={currentTab} index={0}>
                <ProductLifecycleReport />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={1}>
                <OrganizationReport />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={2}>
                <RequestorReport />
            </CustomTabPanel>
        </>
    );
}
