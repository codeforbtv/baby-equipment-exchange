declare module 'scheduling' {
    // Event Types

    export interface EventType {
        active: boolean;
        color: string;
        created_at: string;
        deleted_at: string | null;
        description_html: string | null;
        description_plain: string | null;
        duration: number;
        duration_options: number[] | null;
        internal_note: string | null;
        kind: string;
        name: string;
        pooling_type: string | null;
        profile: Profile | null;
        scheduling_url: string;
        slug: string;
        type: string;
        updated_at: string;
        uri: string;
        custom_questions: EventTypeCustomQuestion[];
        admin_managed: boolean;
        locations: object[] | null;
        position: number;
    }

    export interface Profile {
        name: string;
        owner: string;
        type: string;
    }

    export interface EventTypeCustomQuestion {
        name: string;
        position: number;
        required: boolean;
        type: string;
        uuid: string;
        options?: string[];
    }

    // Scheduled Events

    export interface ScheduledEvent {
        uri: string;
        name: string;
        status: 'active' | 'canceled';
        start_time: string;
        end_time: string;
        event_type: string;
        location: ScheduledEventLocation | null;
        invitees_counter: { total: number; active: number; limit: number };
        created_at: string;
        updated_at: string;
        event_memberships: { user: string; user_email: string }[];
        calendar_event?: {
            kind: string;
            external_id: string;
        } | null;
    }

    export interface ScheduledEventLocation {
        type: string;
        location?: string;
        additional_info?: string;
    }

    export interface ScheduledEventsResponse {
        collection: ScheduledEvent[];
        pagination: Pagination;
    }

    // Invitees

    export interface Invitee {
        uri: string;
        name: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        status: 'active' | 'canceled';
        created_at: string;
        updated_at: string;
        cancel_url: string;
        reschedule_url: string;
        questions_and_answers?: InviteeQuestionAnswer[];
    }

    export interface InviteeQuestionAnswer {
        position: number;
        question: string;
        answer: string;
    }

    export interface InviteesResponse {
        collection: Invitee[];
        pagination: Pagination;
    }

    // Pagination

    export interface Pagination {
        count: number;
        next_page: string | null;
        previous_page: string | null;
        next_page_token: string | null;
    }

    // Time Range & Booking Matching

    export type TimeRange = '1week' | '2weeks' | '30days' | '60days' | '90days';

    /** A scheduled event enriched with its invitee list */
    export interface ScheduledEventWithInvitees extends ScheduledEvent {
        invitees: Invitee[];
    }

    /** Classification of event purpose */
    export type EventCategory = 'pickup' | 'dropoff' | 'unknown';

    /** Confidence level of a booking match */
    export type BookingMatchConfidence =
        | 'confirmed'
        | 'possible-match'
        | 'unconfirmed';

    /** Result of matching an entity to a booking */
    export interface BookingMatchResult {
        /** The entity ID value */
        id: string;
        /** The email used to look up the booking (donor or requestor) */
        lookupEmail: string;
        /** The name used to look up the booking */
        lookupName: string;
        /** Match confidence */
        confidence: BookingMatchConfidence;
        /** Matched  event (if any) */
        matchedEvent?: ScheduledEventWithInvitees;
        /** Matched invitee (if any) */
        matchedInvitee?: Invitee;
        /** Reason for the match classification */
        matchReason: string;
    }

    /** Aggregated booking status for a set of */
    export interface BookingStatusResult {
        /** Confirmed bookings */
        /** Confirmed bookings */
        confirmed: BookingMatchResult[];
        /** Possible matches */
        possibleMatches: BookingMatchResult[];
        /** Unconfirmed bookings */
        unconfirmed: BookingMatchResult[];
        /** Map of entity ID and match result for quick lookup */
        byId: Record<string, BookingMatchResult>;
    }

    /** Typeguard for booking match result with confirmed confidence */
    export function isConfirmedMatch(
        result: BookingMatchResult
    ): result is BookingMatchResult & {
        confidence: 'confirmed';
        matchedEvent: ScheduledEventWithInvitees;
        matchedInvitee: Invitee;
    };
}
