'use client';
//Styling
import '../../styles/globalStyles.css';
import styles from './About.module.css';
import { ReactNode } from 'react';
import Link from 'next/link';

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

    const faqs: { question: string; answer: ReactNode }[] = [
        {
            question: 'How do I request items for myself?',
            answer: (
                <p>
                    Requests need to come from designated agencies to streamline coordination and to ensure that resources are allocated to those most in need
                    in the community. You can learn more about our designated agencies, <a href="#">here</a>.
                </p>
            )
        },
        {
            question: 'How do I make a donation?',
            answer: (
                <p>
                    <Link href="/contact">Contact the Exchange</Link>, if the item you wish to donate is an acceptable item.
                </p>
            )
        },
        {
            question: 'How can my organization partner with the Exchange?',
            answer: (
                <p>
                    <Link href="/contact">Contact the Exchange</Link>, if your organization is interested in partnering with the Exchange.
                </p>
            )
        },
        {
            question: 'How do you verify safety and recall standards for items donated?',
            answer: (
                <div>
                    <p>
                        Vermont Connector does not have the capacity to verify recall and safety guidelines for each individual item donated. That said, we do
                        not accept items that have stringent health or safety requirements (such as car seats, booster seats, breast pumps) or that could be
                        subject to recall (such as cribs). We ask that donors only offer items that are clean, in good working order, and not subject to recall.
                        Please reference the following web pages if you have any questions about safety/recall status of these items:
                    </p>
                    <ul>
                        <li>
                            Consumer Product Safety Commission <a href="https://cspc.gov">(cpsc.gov)</a>{' '}
                        </li>
                        <li>
                            Reseller&apos;s Guide to Selling Safer Products <a></a>
                        </li>
                        <li>
                            SaferProducts.gov <a href="https://saferproducts.gov">(saferproducts.gov)</a>
                        </li>
                        <li>
                            Recalls.gov <a href="https://recalls.gov">(recalls.gov)</a>
                        </li>
                        <li>
                            Safercar.gov <a href="https://safercar.gov">(safercar.gov)</a>
                        </li>
                    </ul>
                </div>
            )
        }
    ];
    const faqList = faqs.map((faqitems: { question: string; answer: ReactNode }, index: number) => {
        return (
            <li key={index}>
                <a
                    className={styles['about__question']}
                    id={'faq-item-question-' + index}
                    onClick={(event: React.UIEvent<HTMLAnchorElement>) => {
                        (event.currentTarget.nextElementSibling as HTMLElement).style.display === 'none'
                            ? ((event.currentTarget.nextElementSibling as HTMLElement).style.display = 'block')
                            : ((event.currentTarget.nextElementSibling as HTMLElement).style.display = 'none');
                    }}
                >
                    {faqitems.question}
                </a>
                <div className={styles['about__answer']} style={{ display: 'none' }} id={'faq-item-answer-' + index}>
                    {faqitems.answer}
                </div>
            </li>
        );
    });

    return (
        <>
            <div className={styles['about_container']}>
                <h1>About</h1>
                <div className="content__container">
                    <h2>The Project</h2>
                    <p>
                        Vermont Connector has launched the Baby & Child Product Exchange in partnership with twenty-five social services and mutual aid
                        organizations{' '}
                    </p>
                    <p>The exchange provides durable equipment to families in need through partner referrals and community donations.</p>
                    <h4 className={styles['about__heading']}>Learn More:</h4>
                    <p className={styles['about__paragraph']}>
                        <a href="https://www.wendyriceconsulting.com/">Click here for Vermont Connector&apos;s project page</a>
                    </p>
                    <br />
                    <h2>Donations</h2>
                    <p className={styles['about__paragraph--list-label']}>List of item accepted:</p>
                    <ul className={styles['about__list']}>{itemTypesAcceptedList}</ul>
                    <p className={styles['about__paragraph--list-label']}>List of items not accepted:</p>
                    <ul className={styles['about__list']}>{itemTypesNotAcceptedList}</ul>
                    <p>Read the full FAQ documents.</p>
                    <ul className={styles['about__list']}>{faqList}</ul>
                </div>
            </div>
        </>
    );
}
