const NOTIFICATION_RETURN_PATH_KEY = 'notificationReturnPath';
const NOTIFICATION_SCROLL_Y_KEY = 'notificationScrollY';
let restoreCleanupTimeout: number | undefined;

const getSessionStorage = (): Storage | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.sessionStorage;
};

export const saveNotificationReturnPosition = (pathname: string): void => {
    const storage = getSessionStorage();
    if (!storage) {
        return;
    }

    storage.setItem(NOTIFICATION_RETURN_PATH_KEY, pathname);
    storage.setItem(NOTIFICATION_SCROLL_Y_KEY, String(window.scrollY));
};

export const getNotificationReturnPath = (fallback = '/'): string => {
    const storage = getSessionStorage();
    if (!storage) {
        return fallback;
    }

    return storage.getItem(NOTIFICATION_RETURN_PATH_KEY) || fallback;
};

export const restoreNotificationScrollPosition = (): void => {
    const storage = getSessionStorage();
    if (!storage) {
        return;
    }

    const storedScrollY = storage.getItem(NOTIFICATION_SCROLL_Y_KEY);
    if (!storedScrollY) {
        return;
    }

    const scrollY = Number(storedScrollY);
    if (!Number.isFinite(scrollY)) {
        storage.removeItem(NOTIFICATION_RETURN_PATH_KEY);
        storage.removeItem(NOTIFICATION_SCROLL_Y_KEY);
        return;
    }

    requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY });
    });

    if (restoreCleanupTimeout) {
        window.clearTimeout(restoreCleanupTimeout);
    }
    restoreCleanupTimeout = window.setTimeout(() => {
        storage.removeItem(NOTIFICATION_RETURN_PATH_KEY);
        storage.removeItem(NOTIFICATION_SCROLL_Y_KEY);
        restoreCleanupTimeout = undefined;
    }, 1000);
};
