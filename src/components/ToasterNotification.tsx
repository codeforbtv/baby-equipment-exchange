//Styles
import styles from './ToasterNotification.module.css';

type NotificaitonProps = {
    status: string;
};

interface StatusLookup {
    [key: string]: string;
}

const statusLookup: StatusLookup = {
    invalid_email: 'The Email address provided is already in use',
    invalid_login: 'The credentials provided were invalid, please try again',
    signed_out: 'You have successfully signed out',
    password_reset: 'Password reset email sucessfully sent.'
};

export default function ToasterNotification(props: NotificaitonProps) {
    return <div className={styles['toaster']}>{statusLookup[props.status]}</div>;
}
