'use client';

//Components
import { Button, IconButton, Menu, MenuItem, Tab, Tabs, useMediaQuery } from '@mui/material';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import CustomTabPanel from './CustomTabPanel';
import {
    DashboardCategoriesTab,
    DashboardDonationsTab,
    DashboardInventoryTab,
    DashboardNotificationFeed,
    DashboardNotificationsTab,
    DashboardOrganizationsTab,
    DashboardUsersTab,
    refreshDashboardTab
} from '@/components/DashboardDataPanels';
//Hooks
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';
//Icons
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RefreshIcon from '@mui/icons-material/Refresh';
//Styles
import '@/styles/globalStyles.css';
import styles from '@/components/Dashboard.module.css';

const tabOptions = ['Notifications', 'Donations', 'Inventory', 'Users', 'Organizations', 'Categories'];

export default function Dashboard() {
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [highlightedEntityId, setHighlightedEntityId] = useState<string | null>(null);
    const [notificationsSubTab, setNotificationsSubTab] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const highlightTimer = useRef<number | null>(null);
    const { mutate } = useSWRConfig();

    //for mobile tab menu
    const matches = useMediaQuery('(min-width:600px)');
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (_event: React.MouseEvent<HTMLElement>, index: number) => {
        setCurrentTab(index);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleCurrentTab = (_event: React.SyntheticEvent, target: number) => {
        setCurrentTab(target);
    };

    const handleFeedNavigation = useCallback((tabIndex: number, entityId: string) => {
        setCurrentTab(0);
        setNotificationsSubTab(tabIndex);
        setHighlightedEntityId(entityId);
        if (highlightTimer.current) {
            window.clearTimeout(highlightTimer.current);
        }
        highlightTimer.current = window.setTimeout(() => {
            setHighlightedEntityId(null);
            highlightTimer.current = null;
        }, 5000);
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refreshDashboardTab(mutate, currentTab);
        } finally {
            setIsRefreshing(false);
        }
    }, [currentTab, mutate]);

    useEffect(() => {
        return () => {
            if (highlightTimer.current) {
                window.clearTimeout(highlightTimer.current);
            }
        };
    }, []);

    return (
        <ProtectedAdminRoute>
            <div className={styles['navbar']} data-unmask="true" data-dashboard-navbar="true">
                {matches ? (
                    <Tabs
                        value={currentTab}
                        onChange={handleCurrentTab}
                        aria-label="dashboard"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            '& .MuiTab-root': {
                                color: '#666',
                                fontWeight: 500,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                minHeight: 48,
                                '&.Mui-selected': { color: '#1976d2', fontWeight: 600 }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        {tabOptions.map((tab) => (
                            <Tab key={tab} label={tab} />
                        ))}
                    </Tabs>
                ) : (
                    <>
                        <Button endIcon={<ArrowDropDownIcon />} onClick={handleClickListItem} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            {tabOptions[currentTab]}
                        </Button>
                        <Menu id="selected-tab" anchorEl={anchorEl} open={open} onClose={handleClose}>
                            {tabOptions.map((tab, i) => (
                                <MenuItem key={tab} selected={i === currentTab} onClick={(event) => handleMenuItemClick(event, i)}>
                                    <p>{tab}</p>
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
                <div className={styles['toolbar']}>
                    <DashboardNotificationFeed onNavigate={handleFeedNavigation} />
                    <IconButton aria-label="Refresh dashboard tab" onClick={handleRefresh} size="small" disabled={isRefreshing} sx={{ color: '#666' }}>
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </div>
            </div>
            <CustomTabPanel value={currentTab} index={0}>
                <DashboardNotificationsTab
                    activeSubTab={notificationsSubTab}
                    onSubTabChange={setNotificationsSubTab}
                    highlightedEntityId={highlightedEntityId}
                />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={1}>
                <DashboardDonationsTab />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={2}>
                <DashboardInventoryTab />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={3}>
                <DashboardUsersTab />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={4}>
                <DashboardOrganizationsTab />
            </CustomTabPanel>
            <CustomTabPanel value={currentTab} index={5}>
                <DashboardCategoriesTab />
            </CustomTabPanel>
        </ProtectedAdminRoute>
    );
}
