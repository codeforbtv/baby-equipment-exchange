'use client';

//Styling
import '../../styles/globalStyles.css';
import styles from './About.module.css';

export default function About() {
    const itemTypesAccepted: string[] = [
        'Baby gates',
        'Baby slings and carriers',
        'Bassinets',
        'Booster seats',
        'Bouncer chairs',
        'Changing pad sheets',
        'Changing pads and covers',
        'Child safety locks',
        'Crib sheets',
        'Diapers (any size, opened/unopened packages ok)',
        'Wipes (unopened packages only)',
        'Diaper bags',
        'Diaper changing stations',
        'Diaper pails and liners',
        'Floor seats',
        'High chairs',
        'Hiking backpacks',
        'Pack n Plays',
        'Plastic Pack n Play mattresses (versus cloth)',
        'Silicone bibs',
        'Strollers',
        'Swaddlers',
        'Swings',
        'Tents/Shade covers'
    ];
    const itemTypesAcceptedList = itemTypesAccepted.map((itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>;
    });
    const itemTypesNotAccepted: string[] = [
        'Car seats',
        'Breast pumps',
        'Nursing/feeding supplies',
        'Cribs or other large furniture',
        'Strollers with click-in car seats',
        'Toys',
        'Activity centers',
        'Exersaucers',
        'Jumpers',
        'Linens',
        'Walkers',
        'Games',
        'Books',
        'Clothes'
    ];

    const itemTypesNotAcceptedList = itemTypesNotAccepted.map((itemType: string, index: number) => {
        return <li key={index}>{itemType}</li>;
    });

    return (
        <>
            <div className="page--header">
                <h1>About</h1>
            </div>
            <div className="content--container">
                <h2>The Project</h2>
                <p>
                    The Exchange is a community-driven program that provides free, gently used baby gear to Vermont families in need. We work with a statewide network of social service and mutual aid partners and we’ve already supported more than 700 families.{' '}
                </p>
                <p>The Exchange eases financial stress for parents, promotes reuse and sustainability, and builds a caring community around families. Every item is thoughtfully repurposed and shared with those who need it most.</p>
                <p>Want to help? You <b>can donate items, volunteer, or make a charitable gift</b> to keep this community-driven service growing.  Contact us to get involved!</p>
                <h4 className={styles['about__heading']}>Learn More:</h4>
                <p className={styles['about__paragraph']}>
                    <a href="https://www.vermontconnector.org/baby-and-child-product-exchange" target="_blank">
                        Click here for Vermont Connector&apos;s project page
                    </a>
                </p>
                <br />
                <h2>Donations</h2>
                <p className={styles['about__paragraph--list-label']}>List of items accepted:</p>
                <ul className={styles['about__list']}>{itemTypesAcceptedList}</ul>
                <p className={styles['about__paragraph--list-label']}>List of items not accepted:</p>
                <ul className={styles['about__list']}>{itemTypesNotAcceptedList}</ul>
                <p>
                    <a href="https://docs.google.com/document/d/198EiN4I1h1X2L46-kAJ5rS2iPGV9aBwt_mQC2eBIl-c" target="_blank">
                        Read the full FAQ documents.
                    </a>
                </p>
            </div>
        </>
    );
}
