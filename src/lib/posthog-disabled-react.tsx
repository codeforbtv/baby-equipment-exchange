'use client';

import type { ReactNode } from 'react';

type PostHogProviderProps = {
    client?: unknown;
    children: ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
    return <>{children}</>;
}
