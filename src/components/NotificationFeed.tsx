'use client';

//Hooks
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
//Components
import { Badge, IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import NotificationCard from './NotificationCard';
//Types
import { NotificationItem, NotificationFilterType, NotificationData } from '@/types/NotificationTypes';
//Styles
import styles from './NotificationFeed.module.css';

// Types
interface NotificationFeedProps {
    items: NotificationItem[];
    onNavigate: (tabIndex: number, entityId: string) => void;
    notificationData?: NotificationData | null;
}

// Filter Config

const FILTERS: { key: NotificationFilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending-deliveries', label: 'Deliveries' },
    { key: 'pending-donations', label: 'Donations' },
    { key: 'pending-users', label: 'Users' },
    { key: 'requested-equipment', label: 'Requested' },
    { key: 'reserved', label: 'Reserved' },
    { key: 'unconfirmed-bookings', label: 'Unconfirmed' }
];

// Helpers

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}

function getItemIcon(item: NotificationItem) {
    if (item.calendlyStatus === 'unconfirmed') {
        return <ErrorOutlineIcon fontSize="small" />;
    }
    if (item.calendlyStatus === 'possible-match') {
        return <WarningAmberIcon fontSize="small" />;
    }

    switch (item.type) {
        case 'pending-donations':
            return <VolunteerActivismIcon fontSize="small" />;
        case 'pending-deliveries':
            return <LocalShippingIcon fontSize="small" />;
        case 'pending-users':
            return <PersonAddIcon fontSize="small" />;
        case 'requested-equipment':
            return <ShoppingCartIcon fontSize="small" />;
        case 'reserved':
            return <BookmarkIcon fontSize="small" />;
        default:
            return <NotificationsIcon fontSize="small" />;
    }
}

function getIconClass(item: NotificationItem): string {
    if (item.calendlyStatus === 'unconfirmed') return styles['feed-item-icon--danger'];
    if (item.calendlyStatus === 'possible-match') return styles['feed-item-icon--warning'];

    switch (item.entityType) {
        case 'user':
            return styles['feed-item-icon--user'];
        case 'order':
            return styles['feed-item-icon--order'];
        default:
            return styles['feed-item-icon--donation'];
    }
}

function CalendlyBadge({ status }: { status?: 'confirmed' | 'possible-match' | 'unconfirmed' }) {
    if (!status) return null;

    const config = {
        confirmed: { cls: styles['calendly-badge--confirmed'], icon: <CheckCircleOutlineIcon sx={{ fontSize: 11 }} />, label: 'Booked' },
        'possible-match': { cls: styles['calendly-badge--possible'], icon: <HelpOutlineIcon sx={{ fontSize: 11 }} />, label: 'Maybe' },
        unconfirmed: { cls: styles['calendly-badge--unconfirmed'], icon: <ErrorOutlineIcon sx={{ fontSize: 11 }} />, label: 'No booking' }
    };

    const c = config[status];
    return (
        <span className={`${styles['calendly-badge']} ${c.cls}`}>
            {c.icon} {c.label}
        </span>
    );
}

export default function NotificationFeed({ items, onNavigate, notificationData }: NotificationFeedProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');

    const filteredItems = useMemo(() => {
        if (activeFilter === 'all') return items;
        if (activeFilter === 'unconfirmed-bookings') {
            return items.filter((i) => i.calendlyStatus === 'unconfirmed' || i.calendlyStatus === 'possible-match');
        }
        return items.filter((i) => i.type === activeFilter);
    }, [items, activeFilter]);

    const badgeCount = items.length;

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setIsExpanded(false);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsExpanded(false);
    }, []);

    const handleExpand = useCallback(() => {
        setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const handleItemClick = useCallback(
        (item: NotificationItem) => {
            onNavigate(item.tabIndex, item.entityId);
            handleClose();
        },
        [onNavigate, handleClose]
    );

    // Close on Escape key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) handleClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, handleClose]);

    return (
        <>
            {/* Bell Icon with Badge */}
            <Tooltip title="Notifications">
                <IconButton onClick={handleOpen} size="small" sx={{ ml: 'auto', mr: 0.5, color: '#666' }} id="notification-feed-icon">
                    <Badge
                        badgeContent={badgeCount}
                        color="error"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                fontSize: '0.65rem',
                                height: 18,
                                minWidth: 18
                            }
                        }}
                    >
                        <NotificationsIcon fontSize="small" />
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Drawer Overlay */}
            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <>
                        <div className={styles['feed-backdrop']} onClick={handleClose} />

                        <div className={`${styles['feed-panel']} ${isExpanded ? styles['feed-panel--expanded'] : styles['feed-panel--partial']}`}>
                            {/* Header */}
                            <div className={styles['feed-header']}>
                                <h3>Notifications</h3>
                                <div className={styles['feed-header-actions']}>
                                    <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
                                        <IconButton size="small" onClick={handleExpand}>
                                            {isExpanded ? <CloseFullscreenIcon fontSize="small" /> : <OpenInFullIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Close">
                                        <IconButton size="small" onClick={handleClose}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Filter Chips */}
                            <div className={styles['feed-filters']}>
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.key}
                                        className={`${styles['feed-chip']} ${activeFilter === f.key ? styles['feed-chip--active'] : ''}`}
                                        onClick={() => setActiveFilter(f.key)}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Feed Items */}
                            <div className={styles['feed-list']}>
                                {filteredItems.length === 0 ? (
                                    <div className={styles['feed-empty']}>No notifications matching this filter.</div>
                                ) : (
                                    filteredItems.map((item) => {
                                        if (isExpanded && notificationData) {
                                            const donation = notificationData.donations?.find((d) => d.id === item.entityId);
                                            const user = notificationData.users?.find((u) => u.uid === item.entityId);
                                            const order = notificationData.orders?.find((o) => o.id === item.entityId);

                                            let cardType: any = null;
                                            if (item.type === 'pending-donations') cardType = 'pending-donation';
                                            else if (item.type === 'pending-deliveries') cardType = 'pending-delivery';
                                            else if (item.type === 'reserved') cardType = 'reserved';
                                            else if (item.type === 'requested-equipment') cardType = 'order';
                                            else if (item.type === 'pending-users') cardType = 'pending-user';

                                            if (cardType) {
                                                return (
                                                    <div
                                                        key={item.id}
                                                        style={{ marginBottom: 16, padding: '0 20px', display: 'flex', flexDirection: 'column' }}
                                                    >
                                                        <NotificationCard
                                                            type={cardType}
                                                            donation={donation}
                                                            user={user}
                                                            order={order}
                                                            setIdToDisplay={(() => handleItemClick(item)) as any} // Clicking card natively acts as navigate
                                                            calendlyStatus={item.calendlyStatus}
                                                        />
                                                    </div>
                                                );
                                            }
                                        }

                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles['feed-item']} ${item.isNew ? styles['feed-item--new'] : ''}`}
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className={`${styles['feed-item-icon']} ${getIconClass(item)}`}>{getItemIcon(item)}</div>
                                                <div className={styles['feed-item-content']}>
                                                    <p className={styles['feed-item-title']}>
                                                        {item.title}
                                                        <CalendlyBadge status={item.calendlyStatus} />
                                                    </p>
                                                    <p
                                                        className={`${styles['feed-item-subtitle']} ${isExpanded ? styles['feed-item-subtitle--expanded'] : ''}`}
                                                    >
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                                <span className={styles['feed-item-time']}>{timeAgo(item.timestamp)}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            {!isExpanded && filteredItems.length > 0 && (
                                <div className={styles['feed-footer']}>
                                    <button className={styles['feed-expand-btn']} onClick={handleExpand}>
                                        See all details
                                    </button>
                                </div>
                            )}
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}
