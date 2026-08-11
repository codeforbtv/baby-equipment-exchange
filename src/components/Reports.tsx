'use client';

import { Tab, Tabs, Button, Menu, MenuItem, useMediaQuery } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CustomTabPanel from './CustomTabPanel';
import ReportGrid from './reports/ReportGrid';
import UserReportGrid from './reports/UserReportGrid';
import { useEffect, useState } from 'react';
import {
    buildRows,
    extractUniqueDonors,
    extractUniqueRequestors,
    OrgLookup,
    OrgNameById,
    ReportRow,
    ReportType,
    REPORT_PRESETS,
    UserOrgLookup
} from './reports/reportGridColumns';
import { getAllDonations } from '@/api/firebase-donations';
import { getOrganizations } from '@/api/firebase-organizations';
import { getAllDbUsers } from '@/api/firebase-users';
import { buildUserRows, UserReportRow } from './reports/userReportColumns';
import { addErrorEvent } from '@/api/firebase';
import styles from './reports/Reports.module.css';

const reportTabs: { label: string; type: ReportType }[] = [
    { label: 'Product Lifecycle', type: 'lifecycle' },
    { label: 'By Organization', type: 'organization' },
    { label: 'By Requestor', type: 'requestor' },
    { label: 'By Donor', type: 'donor' },
    { label: 'Raw Export', type: 'raw' },
    { label: 'Users', type: 'users' }
];

export default function Reports() {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [rows, setRows] = useState<ReportRow[]>([]);
    const [userRows, setUserRows] = useState<UserReportRow[]>([]);
    const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
    const [requestors, setRequestors] = useState<{ id: string; name: string; email: string }[]>([]);
    const [donors, setDonors] = useState<{ name: string; email: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const [donations, orgs, users] = await Promise.all([getAllDonations(), getOrganizations(), getAllDbUsers()]);
                const orgLookup: OrgLookup = Object.fromEntries(orgs.map((o) => [o.name, { county: o.county, phone: o.phoneNumber, tags: o.tags }]));
                // Canonicalize by org id: the org doc's current name wins over the (possibly stale)
                // name snapshot on the user doc, so renamed orgs don't split into duplicate rows.
                const orgNameById: OrgNameById = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
                const userOrgLookup: UserOrgLookup = Object.fromEntries(
                    users.filter((u) => u.organization).map((u) => [u.uid, { id: u.organization!.id, name: orgNameById[u.organization!.id] ?? u.organization!.name }])
                );
                setRows(buildRows(donations, orgLookup, userOrgLookup, orgNameById));
                setUserRows(buildUserRows(users, orgNameById, donations));
                setOrganizations(orgs.map((o) => ({ id: o.id, name: o.name })));
                setRequestors(extractUniqueRequestors(donations));
                setDonors(extractUniqueDonors(donations));
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
                                '&.Mui-selected': { color: 'primary.main', fontWeight: 600 }
                            },
                            '& .MuiTabs-indicator': {
                                height: 2,
                                borderRadius: '2px 2px 0 0',
                                backgroundColor: 'primary.main'
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
                            sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#333' }}
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
                    {tab.type === 'users' ? (
                        <UserReportGrid rows={userRows} organizations={organizations} isLoading={isLoading} />
                    ) : (
                        <ReportGrid
                            preset={REPORT_PRESETS[tab.type]}
                            reportType={tab.type}
                            rows={rows}
                            organizations={organizations}
                            requestors={requestors}
                            donors={donors}
                            isLoading={isLoading}
                        />
                    )}
                </CustomTabPanel>
            ))}
        </>
    );
}
