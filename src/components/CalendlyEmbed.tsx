'use client';

import { useEffect } from 'react';

export type CalendlyProps = {
    url: string;
};

const styles = {
    marginTop: '80px',
    minwidth: '320px',
    height: '700px'
};

export default function CalendlyEmbed(props: CalendlyProps) {
    useEffect(() => {
        const head = document.querySelector('head');
        const script = document.createElement('script');
        script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
        head?.appendChild(script);
    }, []);

    return <div className="calendly-inline-widget" data-url={props.url} style={styles}></div>;
}
