require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;

const app = admin.initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

const USERS = {
    admin: {
        uid: 'admin1',
        email: 'admin1@email.com',
        password: 'password',
        displayName: 'Kay Pham',
        phoneNumber: '+10000000001',
        claims: { admin: true, verified: true, donor: true },
        organization: null
    },
    donor1: {
        uid: 'donor1',
        email: 'donor1@email.com',
        password: 'password',
        displayName: 'Ren Ochoa',
        phoneNumber: '+10000000002',
        claims: { donor: true, verified: true },
        organization: null
    },
    donor2: {
        uid: 'donor2',
        email: 'donor2@email.com',
        password: 'password',
        displayName: 'Eli Sato',
        phoneNumber: '+10000000003',
        claims: { donor: true, verified: true },
        organization: null
    },
    aidWorker: {
        uid: 'aid1',
        email: 'aid1@email.com',
        password: 'password',
        displayName: 'Noor Farah',
        phoneNumber: '+10000000004',
        claims: { 'aid-worker': true, verified: true },
        organization: { id: 'org-vt-connector', name: 'Vermont Connector' }
    },
    aidWorker2: {
        uid: 'aid2',
        email: 'aid2@email.com',
        password: 'password',
        displayName: 'Jules Marin',
        phoneNumber: '+10000000005',
        claims: { 'aid-worker': true, verified: true },
        organization: { id: 'org-cvoeo', name: 'CVOEO' }
    },
    pendingUser: {
        uid: 'pending1',
        email: 'pending1@email.com',
        password: 'password',
        displayName: 'Ash Linden',
        phoneNumber: '+10000000006',
        claims: { donor: true, verified: false },
        organization: null
    }
};

const CATEGORIES = [
    { name: 'Car Seats', tagPrefix: 'CAR', tagCount: 14, description: 'Infant and convertible car seats, boosters' },
    { name: 'Strollers', tagPrefix: 'STR', tagCount: 8, description: 'Single and double strollers, joggers, umbrella strollers' },
    { name: 'Cribs', tagPrefix: 'CRB', tagCount: 5, description: 'Full-size cribs, mini cribs, bassinets, pack-n-plays' },
    { name: 'High Chairs', tagPrefix: 'HCH', tagCount: 3, description: 'Standard and portable high chairs, clip-on seats' },
    { name: 'Baby Carriers', tagPrefix: 'BCR', tagCount: 2, description: 'Wraps, structured carriers, slings, hiking carriers' },
    { name: 'Changing Tables', tagPrefix: 'CHG', tagCount: 1, description: 'Changing tables and pads' },
    { name: 'Monitors', tagPrefix: 'MON', tagCount: 4, description: 'Audio and video baby monitors' },
    { name: 'Breast Pumps', tagPrefix: 'BPM', tagCount: 6, description: 'Manual and electric breast pumps' },
    { name: 'Clothing', tagPrefix: 'CLT', tagCount: 20, description: 'Baby and toddler clothing bundles' },
    { name: 'Toys', tagPrefix: 'TOY', tagCount: 11, description: 'Developmental toys, play mats, bouncers' }
];

const ORGANIZATIONS = [
    {
        id: 'org-vt-connector',
        name: 'Vermont Connector',
        county: 'Chittenden',
        phoneNumber: '802-555-0100',
        emailFooter: 'Vermont Connector — building community one family at a time.',
        tags: ['social-services', 'early-childhood-education'],
        address: {
            line_1: '123 Church Street',
            line_2: 'Suite 4B',
            city: 'Burlington',
            state: 'VT',
            zipcode: '05401'
        },
        notes: ['Primary partner since 2022', 'Serves 200+ families annually']
    },
    {
        id: 'org-cvoeo',
        name: 'CVOEO',
        county: 'Chittenden',
        phoneNumber: '802-555-0200',
        emailFooter: 'Champlain Valley Office of Economic Opportunity',
        tags: ['social-services', 'homelessness-unhoused'],
        address: {
            line_1: '255 South Champlain Street',
            line_2: null,
            city: 'Burlington',
            state: 'VT',
            zipcode: '05401'
        },
        notes: ['Family support programs', 'Housing assistance referral partner']
    },
    {
        id: 'org-parent-child-ctr',
        name: 'Parent Child Center',
        county: 'Washington',
        phoneNumber: '802-555-0300',
        emailFooter: 'Central Vermont Parent Child Center — strengthening families.',
        tags: ['early-childhood-education', 'pediatric-maternal-health'],
        address: {
            line_1: '550 North Main Street',
            line_2: null,
            city: 'Barre',
            state: 'VT',
            zipcode: '05641'
        },
        notes: []
    }
];

const DONOR1_DONATIONS = [
    {
        id: 'donation-mj-001',
        category: 'Car Seats',
        brand: 'Graco',
        model: 'SnugRide SnugLock 35',
        description: 'Rear-facing infant seat, base included. Used for 14 months, no accidents.',
        status: 'in processing',
        images: []
    },
    {
        id: 'donation-mj-002',
        category: 'Strollers',
        brand: 'UPPAbaby',
        model: 'Vista V2',
        description: 'Full-size stroller with bassinet attachment. Rain cover included. Minor scuff on front wheel.',
        status: 'in processing',
        images: []
    },
    {
        id: 'donation-mj-003',
        category: 'Play Mats',
        brand: 'Fisher Price',
        model: '?',
        description: 'Colorful activity gym with hanging toys. Batteries not included.',
        status: 'in processing',
        images: []
    }
];

const DONOR2_DONATIONS = [
    {
        id: 'donation-sam-001',
        category: 'Cribs',
        brand: 'IKEA',
        model: 'SNIGLAR',
        description: 'Beech wood crib with mattress. Disassembled, all hardware in labeled bags.',
        status: 'in processing',
        images: []
    },
    {
        id: 'donation-sam-002',
        category: 'High Chairs',
        brand: 'Stokke',
        model: 'Tripp Trapp',
        description: 'Walnut brown, includes baby set and tray. Some tooth marks on the front rail.',
        status: 'in processing',
        images: []
    },
    {
        id: 'donation-sam-003',
        category: 'Monitors',
        brand: 'Infant Optics',
        model: 'DXR-8 PRO',
        description: 'Video monitor with wide-angle lens. Camera, monitor unit, and USB charger.',
        status: 'in processing',
        images: []
    }
];

const ADMIN_DONATIONS = [
    {
        id: 'donation-admin-001',
        category: 'Car Seats',
        brand: 'Chicco',
        model: 'KeyFit 35',
        description: 'Infant seat, expires 2028. Comes with two bases. Smoke-free home.',
        status: 'available',
        tagNumber: 'CAR 12',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    },
    {
        id: 'donation-admin-002',
        category: 'Strollers',
        brand: 'Baby Jogger',
        model: 'City Mini GT2',
        description: 'All-terrain stroller, hand brake, one-hand fold. Charcoal gray.',
        status: 'available',
        tagNumber: 'STR 7',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    },
    {
        id: 'donation-admin-003',
        category: 'Breast Pumps',
        brand: 'Spectra',
        model: 'S1 Plus',
        description: 'Hospital-grade portable pump, rechargeable battery. Includes carrying case and extra flanges.',
        status: 'available',
        tagNumber: 'BPM 5',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    },
    {
        id: 'donation-admin-004',
        category: 'Baby Carriers',
        brand: 'Ergobaby',
        model: 'Omni 360',
        description: 'Cool air mesh, forward and rear facing. Lumbar support pad included.',
        status: 'available',
        tagNumber: 'BCR 2',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    },
    {
        id: 'donation-admin-005',
        category: 'Clothing',
        brand: 'Mixed',
        model: '0-6 months bundle',
        description: "25-piece lot: onesies, sleepers, socks. Freshly laundered, mostly Carter's and Gerber.",
        status: 'available',
        tagNumber: 'CLT 18',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    },
    {
        id: 'donation-admin-006',
        category: 'Toys',
        brand: 'VTech',
        model: 'Sit-to-Stand Learning Walker',
        description: 'Interactive panel with shapes, piano keys, phone. Detaches from walker frame.',
        status: 'requested',
        tagNumber: 'TOY 9',
        donorEmail: 'anonymous@babyproductexchange.org',
        donorName: 'Anonymous Drop-Off',
        donorId: 'admin1'
    }
];

const HISTORY_DONATIONS = [
    {
        id: 'donation-hist-001',
        category: 'Cribs',
        brand: 'Babyletto',
        model: 'Hudson 3-in-1',
        description: 'Convertible crib, white/washed natural. Toddler rail included.',
        status: 'distributed',
        tagNumber: 'CRB 3',
        donorEmail: 'donor2@email.com',
        donorName: 'Eli Sato',
        donorId: 'donor2'
    }
];

async function createAuthUser(userData) {
    try {
        await auth.createUser({
            uid: userData.uid,
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
            emailVerified: true,
            disabled: false
        });
        await auth.setCustomUserClaims(userData.uid, userData.claims);
    } catch (err) {
        if (err.code === 'auth/uid-already-exists') {
            console.log(`  (${userData.email} already exists, skipping)`);
            return;
        }
        throw err;
    }
}

async function createFirestoreUser(userData) {
    await db.collection('Users').doc(userData.uid).set({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        customClaims: userData.claims,
        isDisabled: false,
        phoneNumber: userData.phoneNumber,
        requestedItems: [],
        distributedItems: [],
        notes: [],
        organization: userData.organization,
        createdAt: FieldValue.serverTimestamp(),
        modifiedAt: FieldValue.serverTimestamp()
    });
}

async function createCategory(cat) {
    await db.collection('Categories').doc(cat.name).set({
        id: cat.name,
        active: true,
        name: cat.name,
        description: cat.description,
        tagPrefix: cat.tagPrefix,
        tagCount: cat.tagCount,
        modifiedAt: FieldValue.serverTimestamp()
    });
}

async function createOrganization(org) {
    await db.collection('Organizations').doc(org.id).set({
        id: org.id,
        name: org.name,
        county: org.county,
        phoneNumber: org.phoneNumber,
        emailFooter: org.emailFooter,
        tags: org.tags,
        address: org.address,
        distributedItems: [],
        notes: org.notes,
        createdAt: FieldValue.serverTimestamp(),
        modifiedAt: FieldValue.serverTimestamp()
    });
}

function makeDonationDoc(d, donor) {
    const now = FieldValue.serverTimestamp();
    return {
        id: d.id,
        donorEmail: d.donorEmail || donor.email,
        donorName: d.donorName || donor.displayName,
        donorId: d.donorId || donor.uid,
        category: d.category,
        brand: d.brand,
        model: d.model,
        description: d.description || null,
        tagNumber: d.tagNumber || null,
        notes: [],
        status: d.status,
        bulkCollection: d.bulkCollection || null,
        images: d.images || [],
        createdAt: now,
        modifiedAt: now,
        dateAccepted: ['available', 'requested', 'reserved', 'distributed'].includes(d.status) ? now : null,
        dateReceived: ['available', 'requested', 'reserved', 'distributed'].includes(d.status) ? now : null,
        dateRequested: ['requested', 'reserved', 'distributed'].includes(d.status) ? now : null,
        dateDistributed: d.status === 'distributed' ? now : null,
        requestor: d.requestor || null,
        distributor: d.distributor || null
    };
}

async function createBulkDonation(bulkId, donorUser, donationItems) {
    const donationRefs = [];
    for (const d of donationItems) {
        d.bulkCollection = bulkId;
        const donDoc = makeDonationDoc(d, donorUser);
        await db.collection('Donations').doc(d.id).set(donDoc);
        donationRefs.push(db.collection('Donations').doc(d.id));
    }

    await db.collection('BulkDonations').doc(bulkId).set({
        donations: donationRefs,
        donorEmail: donorUser.email,
        donorName: donorUser.displayName,
        donorId: donorUser.uid,
        termsAccepted: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp()
    });
}

async function seed() {
    console.log('Seeding Firebase emulators...\n');

    console.log('Creating users...');
    for (const [role, userData] of Object.entries(USERS)) {
        await createAuthUser(userData);
        await createFirestoreUser(userData);
        console.log(`  ${role}: ${userData.displayName} <${userData.email}>`);
    }

    console.log('\nCreating categories...');
    for (const cat of CATEGORIES) {
        await createCategory(cat);
        console.log(`  ${cat.tagPrefix} — ${cat.name}`);
    }

    console.log('\nCreating organizations...');
    for (const org of ORGANIZATIONS) {
        await createOrganization(org);
        console.log(`  ${org.name} (${org.county} County)`);
    }

    console.log('\nCreating donations...');

    await createBulkDonation('bulk-donor1-001', USERS.donor1, DONOR1_DONATIONS);
    console.log(`  Bulk from ${USERS.donor1.displayName}: ${DONOR1_DONATIONS.length} items (in processing)`);
    console.log('    ** donation-mj-003 has category "Play Mats" — Bug 1 repro **');

    await createBulkDonation('bulk-donor2-001', USERS.donor2, DONOR2_DONATIONS);
    console.log(`  Bulk from ${USERS.donor2.displayName}: ${DONOR2_DONATIONS.length} items (in processing)`);

    for (const d of ADMIN_DONATIONS) {
        if (d.id === 'donation-admin-006') {
            d.requestor = {
                id: USERS.aidWorker.uid,
                name: USERS.aidWorker.displayName,
                email: USERS.aidWorker.email
            };
        }
        const donDoc = makeDonationDoc(d, USERS.admin);
        await db.collection('Donations').doc(d.id).set(donDoc);
        console.log(`  ${d.tagNumber}: ${d.brand} ${d.model} [${d.status}]`);
    }

    for (const d of HISTORY_DONATIONS) {
        d.requestor = {
            id: USERS.aidWorker2.uid,
            name: USERS.aidWorker2.displayName,
            email: USERS.aidWorker2.email
        };
        d.distributor = {
            id: USERS.admin.uid,
            name: USERS.admin.displayName,
            email: USERS.admin.email,
            organization: 'CVOEO'
        };
        const donDoc = makeDonationDoc(d, USERS.donor2);
        await db.collection('Donations').doc(d.id).set(donDoc);
        console.log(`  ${d.tagNumber}: ${d.brand} ${d.model} [${d.status}]`);
    }

    console.log('\nCreating orders...');

    await db
        .collection('Orders')
        .doc('order-normal-001')
        .set({
            status: 'open',
            requestor: {
                id: USERS.aidWorker.uid,
                name: USERS.aidWorker.displayName,
                email: USERS.aidWorker.email
            },
            items: [db.collection('Donations').doc('donation-admin-001'), db.collection('Donations').doc('donation-admin-003')],
            createdAt: FieldValue.serverTimestamp(),
            modifiedAt: FieldValue.serverTimestamp()
        });
    for (const id of ['donation-admin-001', 'donation-admin-003']) {
        await db
            .collection('Donations')
            .doc(id)
            .update({
                status: 'requested',
                requestor: {
                    id: USERS.aidWorker.uid,
                    name: USERS.aidWorker.displayName,
                    email: USERS.aidWorker.email
                },
                dateRequested: FieldValue.serverTimestamp(),
                modifiedAt: FieldValue.serverTimestamp()
            });
    }
    console.log('  order-normal-001: Chicco KeyFit 35 + Spectra S1 Plus [open, 2 items]');

    await db
        .collection('Orders')
        .doc('order-stuck-001')
        .set({
            status: 'open',
            requestor: {
                id: USERS.aidWorker2.uid,
                name: USERS.aidWorker2.displayName,
                email: USERS.aidWorker2.email
            },
            items: [],
            rejectedItems: [db.collection('Donations').doc('donation-admin-006')],
            createdAt: FieldValue.serverTimestamp(),
            modifiedAt: FieldValue.serverTimestamp()
        });
    await db.collection('Donations').doc('donation-admin-006').update({
        status: 'unavailable',
        requestor: null,
        modifiedAt: FieldValue.serverTimestamp()
    });
    console.log('  order-stuck-001: VTech walker rejected, status still "open" — Bug 2 repro');

    await db
        .collection('Users')
        .doc(USERS.aidWorker.uid)
        .update({
            requestedItems: [
                { id: 'donation-admin-001', model: 'KeyFit 35' },
                { id: 'donation-admin-003', model: 'S1 Plus' }
            ],
            modifiedAt: FieldValue.serverTimestamp()
        });
    await db
        .collection('Users')
        .doc(USERS.aidWorker2.uid)
        .update({
            distributedItems: [{ id: 'donation-hist-001', tagNumber: 'CRB 3' }],
            modifiedAt: FieldValue.serverTimestamp()
        });

    console.log('\nDone! Emulator UI: http://localhost:4080');
    console.log('\nTest accounts (password: password):');
    console.log('  Admin:      admin1@email.com');
    console.log('  Donor:      donor1@email.com');
    console.log('  Donor:      donor2@email.com');
    console.log('  Aid worker: aid1@email.com');
    console.log('  Aid worker: aid2@email.com');
    console.log('  Pending:    pending1@email.com (unverified)');
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
