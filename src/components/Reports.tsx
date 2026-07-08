'use client';

//Components
import { Tab, Tabs, Button, Menu, MenuItem, useMediaQuery } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CustomTabPanel from './CustomTabPanel';
import ReportGrid from './reports/ReportGrid';
//Hooks
import { useEffect, useState } from 'react';
//Types
import { buildRows, extractUniqueRequestors, OrgLookup, ReportRow, ReportType, REPORT_PRESETS } from './reports/reportGridColumns';
//API
import { getAllDonations } from '@/api/firebase-donations';
import { getOrganizations } from '@/api/firebase-organizations';
import { addErrorEvent } from '@/api/firebase';
//Styles
import styles from './reports/Reports.module.css';

const reportTabs: { label: string; type: ReportType }[] = [
    { label: 'Product Lifecycle', type: 'lifecycle' },
    { label: 'By Organization', type: 'organization' },
    { label: 'By Requestor', type: 'requestor' },
    { label: 'Raw Export', type: 'raw' }
];

export default function Reports() {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [rows, setRows] = useState<ReportRow[]>([]);
    const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
    const [requestors, setRequestors] = useState<{ id: string; name: string; email: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const [donations, orgs] = await Promise.all([getAllDonations(), getOrganizations()]);
                const orgLookup: OrgLookup = Object.fromEntries(orgs.map((o) => [o.name, { county: o.county, phone: o.phoneNumber, tags: o.tags }]));
                setRows(buildRows(donations, orgLookup));
                setOrganizations(orgs.map((o) => ({ id: o.id, name: o.name })));
                setRequestors(extractUniqueRequestors(donations));
            } catch (error) {
                addErrorEvent('Error fetching report data', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReportData();
    }, []);

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
                            <Tab key={tab.type} label={tab.label} />
                        ))}
                    </Tabs>
                ) : (
                    <>
                        <Button
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem', color: '#333' }}
                        >
                            {reportTabs[currentTab].label}
                        </Button>
                        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
                            {reportTabs.map((tab, i) => (
                                <MenuItem
                                    key={tab.type}
                                    selected={i === currentTab}
                                    onClick={() => {
                                        setCurrentTab(i);
                                        setAnchorEl(null);
                                    }}
                                >
                                    {tab.label}
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
            </div>

            {reportTabs.map((tab, i) => (
                <CustomTabPanel key={tab.type} value={currentTab} index={i}>
                    <ReportGrid
                        preset={REPORT_PRESETS[tab.type]}
                        reportType={tab.type}
                        rows={rows}
                        organizations={organizations}
                        requestors={requestors}
                        isLoading={isLoading}
                    />
                </CustomTabPanel>
            ))}
        </>
    );
}
