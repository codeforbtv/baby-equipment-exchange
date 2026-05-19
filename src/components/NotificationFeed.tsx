'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Donation } from '@/models/donation';
import { Notification } from '@/types/NotificationTypes';
import styles from './NotificationFeed.module.css';

type NotificationFilterType =
    | 'all'
    | 'pending-donations'
    | 'pending-deliveries'
    | 'pending-users'
    | 'requested-equipment'
    | 'reserved';
type EntityType = 'donation' | 'user' | 'order';
type DateLike =
    | string
    | Date
    | { toDate?: () => Date; toMillis?: () => number }
    | null
    | undefined;

type NotificationFeedItem = {
    id: string;
    type: Exclude<NotificationFilterType, 'all'>;
    title: string;
    subtitle: string;
    timestamp: Date;
    entityId: string;
    entityType: EntityType;
    tabIndex: number;
    searchText: string;
    tagNumbers: string[];
};

type NotificationFeedProps = {
    notifications: Notification | null;
    onNavigate: (tabIndex: number, entityId: string) => void;
};

const filters: { key: NotificationFilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending-deliveries', label: 'Deliveries' },
    { key: 'pending-donations', label: 'Donations' },
    { key: 'pending-users', label: 'Users' },
    { key: 'requested-equipment', label: 'Requested' },
    { key: 'reserved', label: 'Reserved' }
];

function normalize(value: unknown): string {
    return String(value ?? '')
        .toLowerCase()
        .trim();
}

function toDate(timestamp: DateLike): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (timestamp.toMillis) return new Date(timestamp.toMillis());
    if (timestamp.toDate) return timestamp.toDate();
    return new Date();
}

function donationFields(donation?: Donation): unknown[] {
    if (!donation) return [];
    return [
        donation.tagNumber,
        donation.model,
        donation.brand,
        donation.category,
        donation.description,
        donation.id,
        donation.donorName,
        donation.donorEmail,
        donation.requestor?.name,
        donation.requestor?.email
    ];
}

function createSearchText(fields: unknown[]): string {
    return fields.map(normalize).join(' ');
}

function buildFeedItems(
    notifications: Notification | null
): NotificationFeedItem[] {
    if (!notifications) return [];

    const items: NotificationFeedItem[] = [];

    notifications.donations
        .filter((donation) => donation.status === 'in processing')
        .forEach((donation) => {
            items.push({
                id: `pending-donation-${donation.id}`,
                type: 'pending-donations',
                title: `${donation.brand} - ${donation.model}`,
                subtitle: `Donated by ${donation.donorName}`,
                timestamp: toDate(donation.createdAt),
                entityId: donation.id,
                entityType: 'donation',
                tabIndex: 0,
                searchText: createSearchText(donationFields(donation)),
                tagNumbers: donation.tagNumber ? [donation.tagNumber] : []
            });
        });

    notifications.donations
        .filter((donation) => donation.status === 'pending delivery')
        .forEach((donation) => {
            items.push({
                id: `pending-delivery-${donation.id}`,
                type: 'pending-deliveries',
                title: `${donation.brand} - ${donation.model}`,
                subtitle: `Drop-off pending from ${donation.donorName}`,
                timestamp: toDate(donation.dateAccepted),
                entityId: donation.id,
                entityType: 'donation',
                tabIndex: 1,
                searchText: createSearchText(donationFields(donation)),
                tagNumbers: donation.tagNumber ? [donation.tagNumber] : []
            });
        });

    notifications.orders
        .filter((order) => order.items.length > 0)
        .forEach((order) => {
            const tagNumbers = order.items.flatMap((donation) =>
                donation.tagNumber ? [donation.tagNumber] : []
            );
            items.push({
                id: `order-${order.id}`,
                type: 'requested-equipment',
                title: `${order.requestor.name} - ${order.items.length} item${order.items.length !== 1 ? 's' : ''}`,
                subtitle: 'Equipment request pending review',
                timestamp: toDate(order.createdAt as DateLike),
                entityId: order.id,
                entityType: 'order',
                tabIndex: 2,
                searchText: createSearchText([
                    order.id,
                    order.requestor.name,
                    order.requestor.email,
                    ...order.items.flatMap(donationFields)
                ]),
                tagNumbers: [...new Set(tagNumbers)]
            });
        });

    notifications.donations
        .filter((donation) => donation.status === 'reserved')
        .forEach((donation) => {
            items.push({
                id: `reserved-${donation.id}`,
                type: 'reserved',
                title: `${donation.brand} - ${donation.model}`,
                subtitle: `Reserved by ${donation.requestor?.name ?? 'Unknown'}`,
                timestamp: toDate(donation.dateRequested),
                entityId: donation.id,
                entityType: 'donation',
                tabIndex: 3,
                searchText: createSearchText(donationFields(donation)),
                tagNumbers: donation.tagNumber ? [donation.tagNumber] : []
            });
        });

    notifications.users
        .filter((user) => !user.isDeleted)
        .forEach((user) => {
            items.push({
                id: `user-${user.uid}`,
                type: 'pending-users',
                title: user.displayName,
                subtitle: `${user.email} awaiting approval`,
                timestamp: toDate(user.createdAt as DateLike),
                entityId: user.uid,
                entityType: 'user',
                tabIndex: 4,
                searchText: createSearchText([
                    user.uid,
                    user.displayName,
                    user.email,
                    user.organization?.name,
                    user.phoneNumber
                ]),
                tagNumbers: []
            });
        });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

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

function getItemIcon(type: NotificationFeedItem['type']) {
    switch (type) {
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
    }
}

export default function NotificationFeed({
    notifications,
    onNavigate
}: NotificationFeedProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilter, setActiveFilter] =
        useState<NotificationFilterType>('all');
    const [searchInput, setSearchInput] = useState('');

    const items = useMemo(() => buildFeedItems(notifications), [notifications]);
    const normalizedSearchInput = normalize(searchInput);
    const filteredItems = useMemo(() => {
        const filteredByType =
            activeFilter === 'all'
                ? items
                : items.filter((item) => item.type === activeFilter);
        if (!normalizedSearchInput) return filteredByType;
        return filteredByType.filter(
            (item) =>
                item.searchText.includes(normalizedSearchInput) ||
                item.title.toLowerCase().includes(normalizedSearchInput)
        );
    }, [activeFilter, items, normalizedSearchInput]);

    const filterCounts = useMemo<Record<NotificationFilterType, number>>(
        () => ({
            all: items.length,
            'pending-deliveries': items.filter(
                (item) => item.type === 'pending-deliveries'
            ).length,
            'pending-donations': items.filter(
                (item) => item.type === 'pending-donations'
            ).length,
            'pending-users': items.filter(
                (item) => item.type === 'pending-users'
            ).length,
            'requested-equipment': items.filter(
                (item) => item.type === 'requested-equipment'
            ).length,
            reserved: items.filter((item) => item.type === 'reserved').length
        }),
        [items]
    );

    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleItemClick = useCallback(
        (item: NotificationFeedItem) => {
            onNavigate(item.tabIndex, item.entityId);
        },
        [onNavigate]
    );

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleClose();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleClose]);

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    className={styles['feed-trigger']}
                    onClick={() => setIsOpen(true)}
                    size="small"
                    sx={{ color: '#666' }}
                    aria-label={`Open notifications feed, ${items.length} notifications`}
                >
                    <NotificationsIcon fontSize="small" />
                    <span className={styles['feed-trigger-count']}>
                        {items.length}
                    </span>
                </IconButton>
            </Tooltip>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                    <>
                        <div
                            className={styles['feed-backdrop']}
                            onClick={handleClose}
                        />
                        <div
                            className={styles['feed-panel']}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Notifications"
                        >
                            <div className={styles['feed-header']}>
                                <h3>Notifications</h3>
                                <Tooltip title="Close">
                                    <IconButton
                                        size="small"
                                        onClick={handleClose}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </div>

                            <div className={styles['feed-search']}>
                                <SearchIcon
                                    className={styles['feed-search-icon']}
                                    fontSize="small"
                                />
                                <input
                                    aria-label="Search notifications"
                                    className={styles['feed-search-input']}
                                    type="search"
                                    placeholder="Search TAG, model, brand, or person"
                                    value={searchInput}
                                    onChange={(event) =>
                                        setSearchInput(event.target.value)
                                    }
                                />
                                {searchInput && (
                                    <button
                                        aria-label="Clear notification search"
                                        className={styles['feed-search-clear']}
                                        type="button"
                                        onClick={() => setSearchInput('')}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                )}
                            </div>

                            <div className={styles['feed-filters']}>
                                {filters.map((filter) => (
                                    <button
                                        key={filter.key}
                                        className={`${styles['feed-chip']} ${activeFilter === filter.key ? styles['feed-chip--active'] : ''}`}
                                        onClick={() =>
                                            setActiveFilter(filter.key)
                                        }
                                    >
                                        <span>{filter.label}</span>
                                        <span
                                            className={
                                                styles['feed-chip-count']
                                            }
                                        >
                                            {filterCounts[filter.key]}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className={styles['feed-list']}>
                                {filteredItems.length === 0 ? (
                                    <div className={styles['feed-empty']}>
                                        {normalizedSearchInput
                                            ? 'No notifications match this search.'
                                            : 'No notifications matching this filter.'}
                                    </div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <button
                                            key={item.id}
                                            className={styles['feed-item']}
                                            type="button"
                                            onClick={() =>
                                                handleItemClick(item)
                                            }
                                        >
                                            <span
                                                className={`${styles['feed-item-icon']} ${styles[`feed-item-icon--${item.entityType}`]}`}
                                            >
                                                {getItemIcon(item.type)}
                                            </span>
                                            <span
                                                className={
                                                    styles['feed-item-content']
                                                }
                                            >
                                                <span
                                                    className={
                                                        styles[
                                                            'feed-item-title'
                                                        ]
                                                    }
                                                >
                                                    {item.title}
                                                </span>
                                                <span
                                                    className={
                                                        styles[
                                                            'feed-item-subtitle'
                                                        ]
                                                    }
                                                >
                                                    {item.subtitle}
                                                </span>
                                                {item.tagNumbers.length > 0 && (
                                                    <span
                                                        className={
                                                            styles[
                                                                'feed-item-tags'
                                                            ]
                                                        }
                                                    >
                                                        <span>TAG</span>{' '}
                                                        {item.tagNumbers.join(
                                                            ', '
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                            <span
                                                className={
                                                    styles['feed-item-time']
                                                }
                                            >
                                                {timeAgo(item.timestamp)}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}
