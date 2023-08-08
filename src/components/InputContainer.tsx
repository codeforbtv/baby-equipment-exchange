'use client'
//Styles
import styles from './InputContainer.module.css'


type InputProps = {
    label: string,
    for: string,
    footnote?: string;
    children: React.ReactNode;
}

export default function InputContainer(props: InputProps) {
    return (
        <div className={styles["input__container"]}>
            <label htmlFor={props.for}>{props.label}</label>
            {props.children}
            {props.footnote &&
            <p className={styles["footnote"]}>{props.footnote}</p>
            }
        </div>
    )
}