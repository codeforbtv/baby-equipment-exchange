import type {
    BookingMatchConfidence,
    BookingMatchResult,
    Invitee,
    ScheduledEventWithInvitees
} from 'scheduling';

export type SchedulingMatchMode = 'pickup' | 'dropoff';

export interface SchedulableDonation {
    id: string;
    donorEmail: string;
    donorName: string;
    status: string;
    tagNumber?: string | null;
    requestor?: { id: string; name: string; email: string } | null;
}

interface IndexedInvitee {
    invitee: Invitee;
    event: ScheduledEventWithInvitees;
}

interface MatchScore {
    confidence: BookingMatchConfidence;
    score: number;
    reason: string;
}

const NAME_STOP_WORDS = new Set([
    'mr',
    'mrs',
    'ms',
    'miss',
    'dr',
    'jr',
    'sr',
    'ii',
    'iii',
    'iv'
]);

export function normalizeText(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9@.+\-\s]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

export function normalizeEmail(value: string): string {
    const email = normalizeText(value);
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;

    const plusIndex = local.indexOf('+');
    const withoutPlus = plusIndex >= 0 ? local.slice(0, plusIndex) : local;
    const canonicalLocal =
        domain === 'gmail.com' || domain === 'googlemail.com'
            ? withoutPlus.replace(/\./g, '')
            : withoutPlus;

    return `${canonicalLocal}@${domain}`;
}

function nameTokens(value: string): string[] {
    return normalizeText(value)
        .split(' ')
        .map((token) => token.replace(/[^a-z0-9]/g, ''))
        .filter((token) => token.length > 1 && !NAME_STOP_WORDS.has(token));
}

function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = new Array<number>(b.length + 1);

    for (let i = 1; i <= a.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + substitutionCost
            );
        }
        for (let j = 0; j <= b.length; j += 1) {
            previous[j] = current[j];
        }
    }

    return previous[b.length];
}

export function nameSimilarity(left: string, right: string): number {
    const leftTokens = nameTokens(left);
    const rightTokens = nameTokens(right);
    if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

    const leftName = leftTokens.join(' ');
    const rightName = rightTokens.join(' ');
    if (leftName === rightName) return 1;

    const leftSet = new Set(leftTokens);
    const rightSet = new Set(rightTokens);
    const intersection = [...leftSet].filter((token) =>
        rightSet.has(token)
    ).length;
    const union = new Set([...leftSet, ...rightSet]).size;
    const tokenScore = union === 0 ? 0 : intersection / union;

    const distance = levenshtein(leftName, rightName);
    const editScore =
        1 - distance / Math.max(leftName.length, rightName.length);

    const firstLastMatch =
        leftTokens[0] === rightTokens[0] &&
        leftTokens[leftTokens.length - 1] ===
            rightTokens[rightTokens.length - 1];
    const reversedMatch =
        leftTokens[0] === rightTokens[rightTokens.length - 1] &&
        leftTokens[leftTokens.length - 1] === rightTokens[0];

    const structuralBoost = firstLastMatch || reversedMatch ? 0.2 : 0;
    return Math.min(1, tokenScore * 0.65 + editScore * 0.35 + structuralBoost);
}

function inviteeAnswers(invitee: Invitee): string {
    return (invitee.questions_and_answers ?? [])
        .map((entry) => `${entry.question} ${entry.answer}`)
        .join(' ');
}

function hasTagMatch(invitee: Invitee, tagNumber?: string | null): boolean {
    if (!tagNumber) return false;
    return normalizeText(inviteeAnswers(invitee)).includes(
        normalizeText(tagNumber)
    );
}

function scoreInvitee(
    lookupEmail: string,
    lookupName: string,
    tagNumber: string | null | undefined,
    invitee: Invitee
): MatchScore {
    const normalizedLookupEmail = normalizeEmail(lookupEmail);
    const normalizedInviteeEmail = normalizeEmail(invitee.email);
    if (
        normalizedLookupEmail &&
        normalizedLookupEmail === normalizedInviteeEmail
    ) {
        return {
            confidence: 'confirmed',
            score: 1,
            reason: `Email match: ${invitee.email}`
        };
    }

    const nameScore = lookupName ? nameSimilarity(lookupName, invitee.name) : 0;
    const tagMatched = hasTagMatch(invitee, tagNumber);
    const score = Math.min(0.99, nameScore + (tagMatched ? 0.18 : 0));

    if (tagMatched && nameScore >= 0.82) {
        return {
            confidence: 'confirmed',
            score,
            reason: `Reference tag and name match: ${invitee.name}`
        };
    }
    if (nameScore >= 0.86) {
        return {
            confidence: 'possible-match',
            score,
            reason: `Strong name match: ${invitee.name}`
        };
    }
    if (tagMatched || nameScore >= 0.72) {
        return {
            confidence: 'possible-match',
            score,
            reason: tagMatched
                ? `Reference tag appears in booking answers: ${tagNumber}`
                : `Partial name match: ${invitee.name}`
        };
    }

    return {
        confidence: 'unconfirmed',
        score,
        reason: 'No matching booking found'
    };
}

function lookupFields(
    donation: SchedulableDonation,
    mode: SchedulingMatchMode
): { email: string; name: string } {
    if (mode === 'dropoff') {
        return {
            email: donation.donorEmail,
            name: donation.donorName
        };
    }

    return {
        email: donation.requestor?.email ?? '',
        name: donation.requestor?.name ?? ''
    };
}

export function matchDonationBookings(
    donations: SchedulableDonation[],
    events: ScheduledEventWithInvitees[],
    mode: SchedulingMatchMode
): BookingMatchResult[] {
    const inviteeIndex: IndexedInvitee[] = events.flatMap((event) =>
        event.invitees.map((invitee) => ({ invitee, event }))
    );

    return donations.map((donation) => {
        const lookup = lookupFields(donation, mode);
        const ranked = inviteeIndex
            .map((entry) => ({
                ...entry,
                match: scoreInvitee(
                    lookup.email,
                    lookup.name,
                    donation.tagNumber,
                    entry.invitee
                )
            }))
            .sort((left, right) => right.match.score - left.match.score);

        const best = ranked[0];
        const confidence = best?.match.confidence ?? 'unconfirmed';
        const baseResult: BookingMatchResult = {
            id: donation.id,
            lookupEmail: lookup.email,
            lookupName: lookup.name,
            confidence,
            matchReason: best?.match.reason ?? 'No matching booking found'
        };

        if (!best || confidence === 'unconfirmed') {
            return {
                ...baseResult,
                confidence: 'unconfirmed',
                matchReason: 'No matching booking found'
            };
        }

        return {
            ...baseResult,
            matchedEvent: best.event,
            matchedInvitee: best.invitee
        };
    });
}
