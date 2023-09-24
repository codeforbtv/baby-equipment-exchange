//Styling
import globalStyles from "@/styles/globalStyles.module.css"
import styles from "./About.module.css"

export default function About() {

    let itemTypesAccepted: string[] = ["Type 1", "Type 2", "Type 3"];
    let itemTypesAcceptedList = itemTypesAccepted.map ( (itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>
    }) 
    let itemTypesNotAccepted: string[] = ["Type 1", "Type 2", "Type 3"];
    let itemTypesNotAcceptedList = itemTypesAccepted.map ( (itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>
    }) 

    return (
        <>
            <div className={styles["account__container"]}>
                <h1>About</h1>
                <h4>Page Summary</h4>
                <div className={globalStyles["content__container"]}>
                    <h2>Header</h2>
                    <p>Paragraph text explaining project purpose like on https://www.wendyriceconsulting.com/baby-and-child-product-exchange </p>
                    <h4 className={styles["about__heading"]}>Label:</h4><p className={styles["about__paragraph"]}>Text</p><br/>
                    <h4 className={styles["about__heading"]}>Label:</h4><p className={styles["about__paragraph"]}>Text</p><br/>
                    <h4 className={styles["about__heading"]}>Label:</h4><p className={styles["about__paragraph"]}>Text</p><br/>
                    <h2>Header</h2>
                    <p className={styles["about__paragraph--list-label"]}>List of item types accepted:</p>
                    <ul className={styles["about__list"]}>
                        {itemTypesAcceptedList}
                    </ul>
                    <p className={styles["about__paragraph--list-label"]}>List of item types accepted:</p>
                    <ul className={styles["about__list"]}>
                        {itemTypesNotAcceptedList}
                    </ul>
                </div>
            </div>
        </>
    )
}