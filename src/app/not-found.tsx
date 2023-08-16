import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '4em' }}>404.</h1>
            <Link href="/">Home.</Link>
        </div>
    );
}
