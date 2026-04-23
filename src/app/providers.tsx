'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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

export default function PHProvider({ children }: { children: React.ReactNode }) {
    // posthog fetches client level apis, useEffects makes it load in only when browser client does, would otherwise crash if it was done on the server
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;

        posthog.init(key, {
            api_host: '/ingest',
            ui_host: 'https://us.posthog.com',
            capture_pageview: false,
            capture_pageleave: true,
            person_profiles: 'always',
            enable_recording_console_log: false,
            // all text masked in session recordings for PII safety.
            session_recording: {
                maskAllInputs: true,
                // apply 'ph-visible' class to anything you want unmasked
                maskTextSelector: '*:not(.ph-visible)'
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
