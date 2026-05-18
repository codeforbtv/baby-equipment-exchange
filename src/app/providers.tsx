'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { UserProvider } from '@/contexts/UserContext';
import { PendingDonationsProvider } from '@/contexts/PendingDonationsContext';
import { RequestedInventoryProvider } from '@/contexts/RequestedInventoryContext';
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper';

// app router client-side navigations don't trigger full page loads so PostHog's auto-capture misses them. This fires on every route change and tracks
function PostHogPageView() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && posthog) {
            let url = window.origin + pathname;
            const search = searchParams.toString();
            if (search) url += '?' + search;
            posthog.capture('$pageview', { $current_url: url });
        }
    }, [pathname, searchParams]);

    return null;
}

function PHProvider({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            {/* suspense needed because useSearchParams requires it in the app router */}
            <Suspense fallback={null}>
                <PostHogPageView />
            </Suspense>
            {children}
        </PostHogProvider>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PHProvider>
            <ThemeProviderWrapper>
                <UserProvider>
                    <PendingDonationsProvider>
                        <RequestedInventoryProvider>{children}</RequestedInventoryProvider>
                    </PendingDonationsProvider>
                </UserProvider>
            </ThemeProviderWrapper>
        </PHProvider>
    );
}
