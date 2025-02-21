'use client';

import CalendlyEmbed from '@/components/CalendlyEmbed';
import { calendlyEvents } from '@/data/html';
import { ChangeEvent, useState } from 'react';

import '../../styles/globalStyles.css';

let content;

export default function Calendly() {
    const [calendlyUrl, setCalendlyUrl] = useState('');

    const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
        setCalendlyUrl(event.target.value);
    };

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
