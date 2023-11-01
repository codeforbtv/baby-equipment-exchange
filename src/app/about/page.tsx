//Styling
import globalStyles from "@/styles/globalStyles.module.css"
import styles from "./About.module.css"

export default function About() {

    let itemTypesAccepted: string[] = [
        "Baby gates",
        "Baby slings and carriers",
        "Bassinets",
        "Booster seats",
        "Bouncer chairs",
        "Changing pad sheets",
        "Changing pads and covers",
        "Child safety locks",
        "Crib sheets",
        "Diapers (any size, opened/unopened packages ok)",
        "Wipes (unopened packages only)",
        "Diaper bags",
        "Diaper changing stations",
        "Diaper pails and liners",
        "Floor seats",
        "High chairs",
        "Hiking backpacks",
        "Pack n Plays",
        "Plastic Pack n Play mattresses (versus cloth)",
        "Silicone bibs",
        "Strollers",
        "Swaddlers",
        "Swings",
        "Tents/Shade covers"
    ];
    let itemTypesAcceptedList = itemTypesAccepted.map((itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>
    })
    let itemTypesNotAccepted: string[] = [
        "Car seats",
        "Breast pumps",
        "Nursing/feeding supplies",
        "Cribs or other large furniture",
        "Strollers with click-in car seats",
        "Toys",
        "Activity centers",
        "Exersaucers",
        "Jumpers",
        "Linens",
        "Walkers",
        "Games",
        "Books",
        "Clothes"
    ];
    let itemTypesNotAcceptedList = itemTypesNotAccepted.map((itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>
    })

    let faqs: string[] = [
        "How do I request items for myself?",
        "How do I make a donation?",
        "How can my organization partner with the Exchange?"
    ]
    let faqList = faqs.map((question: string, index: number) => {
        return <li key={index}><a href="#">{question}</a></li>
    })

    return (
        <>
            <div className={styles["about_container"]}>
                <h1>About</h1>
                <h4>Learn about the Baby Equipment Exchange</h4>
                <div className={globalStyles["content__container"]}>
                    <h2>The Project</h2>
                    <p>Vermont Connector has launched the Baby & Child Product Exchange in partnership with 25 social services and mutual aid organizations </p>
                    <p>The exchange provides durable equipment to families in need through partner referrals and community donations.</p>
                    <h4 className={styles["about__heading"]}>Learn More:</h4>
                    <p className={styles["about__paragraph"]}>
                        <a href="https://www.wendyriceconsulting.com/" target="_blank">Click here for Vermont Connector's project page</a>
                    </p>
                    <br />
                    <h2>Donations</h2>
                    <p className={styles["about__paragraph--list-label"]}>List of item accepted:</p>
                    <ul className={styles["about__list"]}>
                        {itemTypesAcceptedList}
                    </ul>
                    <p className={styles["about__paragraph--list-label"]}>List of items not accepted:</p>
                    <ul className={styles["about__list"]}>
                        {itemTypesNotAcceptedList}
                    </ul>
                    <p>Read the full FAQ documents.</p>
                    <ul className={styles["about__list"]}>
                        {faqList}
                    </ul>
                </div>
            </div>
        </>
    )
}