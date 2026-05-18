'use client';

type AnalyticsProperties = Record<string, unknown>;

const noop = () => undefined;
const noopWithArgs = (...args: unknown[]) => {
    void args;
};

const posthog = {
    init: noopWithArgs,
    capture: (_eventName?: string, _properties?: AnalyticsProperties) => noopWithArgs(_eventName, _properties),
    captureException: (_error?: unknown, _properties?: AnalyticsProperties) => noopWithArgs(_error, _properties),
    identify: (_distinctId?: string, _properties?: AnalyticsProperties) => noopWithArgs(_distinctId, _properties),
    reset: noop
};

export default posthog;
