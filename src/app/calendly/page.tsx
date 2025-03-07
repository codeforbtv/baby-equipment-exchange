'use client';

import CalendlyEmbed from '@/components/CalendlyEmbed';
import { calendlyEvents } from '@/data/html';
import { ChangeEvent, useEffect, useState } from 'react';

import { getSchedulingPageLink } from '@/api/calendly';

const CLIENT_ID = process.env.NEXT_PUBLIC_CALEDNLY_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_CALEDNLY_CLIENT_SECRET;
const BP_TOKEN = process.env.BP_TOKEN;
const API_KEY = process.env.NEXT_PUBLIC_CALENDLY_API_KEY;

import '../../styles/globalStyles.css';

let content;

export default function Calendly() {
    const [calendlyUrl, setCalendlyUrl] = useState('');

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setCalendlyUrl(event.target.value);
    };

    useEffect(() => {
        getSchedulingPageLink();
    }, []);

    return (
        <>
            <div className="page--header">
                <h1>Schedule Drop Off</h1>
            </div>
            <div className="content--container">
                <select value={calendlyUrl} onChange={handleSelect}>
                    <option value="" disabled>
                        Select an Drop Off Location
                    </option>
                    {calendlyEvents.map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                {calendlyUrl.length > 0 && <CalendlyEmbed url={calendlyUrl} />}
            </div>
        </>
    );
}
