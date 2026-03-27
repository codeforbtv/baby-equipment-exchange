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
