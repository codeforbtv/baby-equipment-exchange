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
    // posthog fetches client level apis, useEffects makes it load in only when browser client does, would otherwise crash if it was done on the server
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;

        posthog.init(key, {
            api_host: 'https://us.i.posthog.com',
            capture_pageview: false,
            capture_pageleave: false,
            person_profiles: 'always',
            enable_recording_console_log: false,
            capture_exceptions: false,
            ip: false,

            session_recording: {
                maskAllInputs: true,
                maskTextSelector: '*',
                maskTextFn: (text, element) => {
                    if (element?.closest('[data-unmask="true"]')) {
                        return text;
                    }
                    return '*'.repeat(text.trim().length);
                },
            }
        });
    }, []);

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
