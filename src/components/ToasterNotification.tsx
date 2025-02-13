//Styles
import styles from './ToasterNotification.module.css';

type NotificaitonProps = {
    status: string;
};

interface StatusLookup {
    [key: string]: string;
}

const statusLookup: StatusLookup = {
    signed_out: 'You have successfully signed out',
    password_reset: 'Password reset email sucessfully sent.'
};

export default function ToasterNotification(props: NotificaitonProps) {
    return <div className={styles['toaster']}>{statusLookup[props.status]}</div>;
}
