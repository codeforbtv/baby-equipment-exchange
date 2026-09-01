import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { deleteApp as deleteAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { deleteApp, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, getIdTokenResult, signInWithEmailAndPassword } from 'firebase/auth';
import {
    arrayUnion,
    collection,
    connectFirestoreEmulator,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    serverTimestamp,
    updateDoc,
    writeBatch
} from 'firebase/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT;
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const EXPECT_BASELINE_DENIAL = process.env.HOTFIX_BASELINE === '1';
const KEEP_EMULATOR_DATA = process.env.KEEP_EMULATOR_DATA === '1';

if (!PROJECT_ID?.startsWith('demo-')) {
    throw new Error(`Refusing to run against non-demo Firebase project: ${PROJECT_ID ?? '(missing)'}`);
}
if (!AUTH_EMULATOR_HOST || !FIRESTORE_EMULATOR_HOST) {
    throw new Error('Both FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are required.');
}

const parseHost = (host) => {
    const url = new URL(`http://${host}`);
    return { hostname: url.hostname, port: Number(url.port) };
};

const firestoreHost = parseHost(FIRESTORE_EMULATOR_HOST);
const runId = `aid-worker-request-${randomUUID()}`;
const password = 'demo-password-123';
const adminApp = initializeAdminApp({ projectId: PROJECT_ID }, `${runId}-admin`);
const adminAuth = getAdminAuth(adminApp);
const adminDb = getAdminFirestore(adminApp);
const webApps = [];
const createdAuthUids = [];
const createdDocumentRefs = [];

const ids = {
    admin: `${runId}-admin`,
    aidWorker: `${runId}-aid`,
    otherAidWorker: `${runId}-other-aid`,
    userWithoutAccess: `${runId}-unauth-user`
};

function isPermissionDenied(error) {
    return typeof error?.code === 'string' && error.code.endsWith('permission-denied');
}

async function assertPermissionDenied(operation, message) {
    await assert.rejects(operation, (error) => isPermissionDenied(error), message);
}

async function createAuthUser(uid, claims) {
    const email = `${uid}@example.test`;
    await adminAuth.createUser({ uid, email, password, displayName: uid });
    createdAuthUids.push(uid);

    const app = initializeApp(
        {
            apiKey: 'demo-api-key',
            authDomain: `${PROJECT_ID}.firebaseapp.com`,
            projectId: PROJECT_ID
        },
        `${uid}-web`
    );
    webApps.push(app);

    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, firestoreHost.hostname, firestoreHost.port);

    const credential = await signInWithEmailAndPassword(auth, email, password);
    await adminAuth.setCustomUserClaims(uid, claims);
    await credential.user.getIdToken(true);
    const tokenResult = await getIdTokenResult(credential.user, true);
    for (const [claim, expected] of Object.entries(claims)) {
        assert.equal(tokenResult.claims[claim], expected, `${uid} did not receive the ${claim} claim`);
    }

    return { auth, firestore, user: credential.user };
}

function createUnauthenticatedContext(name) {
    const app = initializeApp(
        {
            apiKey: 'demo-api-key',
            authDomain: `${PROJECT_ID}.firebaseapp.com`,
            projectId: PROJECT_ID
        },
        `${runId}-${name}`
    );
    webApps.push(app);
    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}`, { disableWarnings: true });
    const firestore = getFirestore(app);
    connectFirestoreEmulator(firestore, firestoreHost.hostname, firestoreHost.port);
    return { auth, firestore };
}

function trackDocument(ref) {
    createdDocumentRefs.push(ref);
    return ref;
}

async function seedDocument(collectionName, id, data) {
    const ref = trackDocument(adminDb.collection(collectionName).doc(id));
    await ref.set(data);
    return ref;
}

async function seedDonation(suffix, status = 'available') {
    return seedDocument('Donations', `${runId}-${suffix}`, {
        id: `${runId}-${suffix}`,
        brand: 'Demo',
        model: suffix,
        status,
        requestor: null,
        dateRequested: null,
        modifiedAt: FieldValue.serverTimestamp()
    });
}

async function submitCurrentRequest(firestore, inventoryItemIds, user) {
    const requestorUserSnap = await getDoc(doc(firestore, 'Users', user.id));
    const organization = requestorUserSnap.exists() ? (requestorUserSnap.data().organization ?? null) : null;
    const requestor = { ...user, organization };
    const orderRef = doc(collection(firestore, 'Orders'));
    trackDocument(adminDb.collection('Orders').doc(orderRef.id));
    const batch = writeBatch(firestore);

    batch.set(orderRef, {
        status: 'open',
        requestor,
        items: [],
        createdAt: serverTimestamp()
    });

    for (const inventoryItemId of inventoryItemIds) {
        const inventoryItemRef = doc(firestore, 'Donations', inventoryItemId);
        batch.update(inventoryItemRef, {
            status: 'requested',
            requestor,
            dateRequested: serverTimestamp(),
            modifiedAt: serverTimestamp()
        });
        batch.update(orderRef, {
            items: arrayUnion(inventoryItemRef),
            modifiedAt: serverTimestamp()
        });
    }

    await batch.commit();
    return orderRef;
}

async function cleanUp() {
    if (KEEP_EMULATOR_DATA) {
        console.log(`KEEP_EMULATOR_DATA=1; retained demo fixture prefix ${runId}`);
        return;
    }

    await Promise.all(createdDocumentRefs.map((ref) => ref.delete().catch(() => undefined)));
    await Promise.all(createdAuthUids.map((uid) => adminAuth.deleteUser(uid).catch(() => undefined)));
}

async function main() {
    const [adminContext, aidWorkerContext, otherAidWorkerContext] = await Promise.all([
        createAuthUser(ids.admin, { admin: true }),
        createAuthUser(ids.aidWorker, { 'aid-worker': true }),
        createAuthUser(ids.otherAidWorker, { 'aid-worker': true })
    ]);
    const unauthenticatedContext = createUnauthenticatedContext('unauthenticated');

    const organization = { id: `${runId}-org`, name: 'Demo Organization' };
    await seedDocument('Users', ids.admin, { uid: ids.admin, organization: null });
    await seedDocument('Users', ids.aidWorker, { uid: ids.aidWorker, organization });
    await seedDocument('Users', ids.otherAidWorker, { uid: ids.otherAidWorker, organization: null });
    await seedDocument('Users', ids.userWithoutAccess, { uid: ids.userWithoutAccess, organization: null });

    const baselineDonation = await seedDonation('baseline');
    const aidWorker = { id: ids.aidWorker, name: 'Aid Worker', email: `${ids.aidWorker}@example.test` };

    if (EXPECT_BASELINE_DENIAL) {
        const ordersBefore = await adminDb.collection('Orders').get();
        await assertPermissionDenied(
            submitCurrentRequest(aidWorkerContext.firestore, [baselineDonation.id], aidWorker),
            'baseline request should fail at the aid-worker self read'
        );
        const [donationAfter, ordersAfter] = await Promise.all([baselineDonation.get(), adminDb.collection('Orders').get()]);
        assert.equal(donationAfter.get('status'), 'available');
        assert.equal(ordersAfter.size, ordersBefore.size);
        console.log(`Baseline reproduced: self-read denied, donation available, zero new orders (${runId})`);
        return;
    }

    const selfUserRef = doc(aidWorkerContext.firestore, 'Users', ids.aidWorker);
    assert.equal((await getDoc(selfUserRef)).data().organization.id, organization.id);
    await assertPermissionDenied(
        getDoc(doc(aidWorkerContext.firestore, 'Users', ids.otherAidWorker)),
        'aid worker must not read another user'
    );
    await assertPermissionDenied(getDocs(collection(aidWorkerContext.firestore, 'Users')), 'aid worker must not list users');
    await assertPermissionDenied(
        getDoc(doc(unauthenticatedContext.firestore, 'Users', ids.aidWorker)),
        'unauthenticated user must not read a user'
    );

    const adminUserRef = doc(adminContext.firestore, 'Users', ids.userWithoutAccess);
    assert.equal((await getDoc(adminUserRef)).data().uid, ids.userWithoutAccess);
    await updateDoc(adminUserRef, { adminVerified: true });
    assert.equal((await adminDb.collection('Users').doc(ids.userWithoutAccess).get()).get('adminVerified'), true);

    const allowedDonation = await seedDonation('allowed-fields');
    await updateDoc(doc(aidWorkerContext.firestore, 'Donations', allowedDonation.id), {
        requestor: aidWorker,
        modifiedAt: serverTimestamp(),
        status: 'requested',
        dateRequested: serverTimestamp()
    });
    assert.equal((await allowedDonation.get()).get('status'), 'requested');

    const unauthorizedDonation = await seedDonation('unauthorized-field');
    await assertPermissionDenied(
        updateDoc(doc(aidWorkerContext.firestore, 'Donations', unauthorizedDonation.id), {
            requestor: aidWorker,
            modifiedAt: serverTimestamp(),
            status: 'requested',
            dateRequested: serverTimestamp(),
            notes: ['not allowed']
        }),
        'aid worker must not update unapproved donation fields'
    );

    const unavailableDonation = await seedDonation('unavailable-field-update', 'unavailable');
    await assertPermissionDenied(
        updateDoc(doc(aidWorkerContext.firestore, 'Donations', unavailableDonation.id), {
            requestor: aidWorker,
            modifiedAt: serverTimestamp(),
            status: 'requested',
            dateRequested: serverTimestamp()
        }),
        'aid worker must not update a donation that was not available'
    );

    const eventRef = await seedDocument('Event', `${runId}-event`, { type: 'test', note: runId });
    assert.equal((await getDoc(doc(adminContext.firestore, 'Event', eventRef.id))).data().note, runId);
    await assertPermissionDenied(
        getDoc(doc(aidWorkerContext.firestore, 'Event', eventRef.id)),
        'aid worker must not read Event records'
    );
    await assertPermissionDenied(
        getDoc(doc(unauthenticatedContext.firestore, 'Event', eventRef.id)),
        'unauthenticated user must not read Event records'
    );

    const validOne = await seedDonation('valid-one');
    const validTwo = await seedDonation('valid-two');
    const validOrderRef = await submitCurrentRequest(aidWorkerContext.firestore, [validOne.id, validTwo.id], aidWorker);
    const [validOrder, validOneAfter, validTwoAfter] = await Promise.all([
        adminDb.collection('Orders').doc(validOrderRef.id).get(),
        validOne.get(),
        validTwo.get()
    ]);
    assert.equal(validOrder.exists, true);
    assert.equal(validOrder.get('status'), 'open');
    assert.deepEqual(validOrder.get('requestor').organization, organization);
    assert.deepEqual(
        validOrder.get('items').map((ref) => ref.id).sort(),
        [validOne.id, validTwo.id].sort()
    );
    assert.equal(validOneAfter.get('status'), 'requested');
    assert.equal(validTwoAfter.get('status'), 'requested');

    const mixedAvailable = await seedDonation('mixed-available');
    const mixedUnavailable = await seedDonation('mixed-unavailable', 'unavailable');
    const trackedBeforeMixed = createdDocumentRefs.length;
    await assertPermissionDenied(
        submitCurrentRequest(aidWorkerContext.firestore, [mixedAvailable.id, mixedUnavailable.id], aidWorker),
        'mixed request must be denied atomically'
    );
    const mixedOrderRef = createdDocumentRefs[trackedBeforeMixed];
    const [mixedOrder, mixedAvailableAfter, mixedUnavailableAfter] = await Promise.all([
        mixedOrderRef.get(),
        mixedAvailable.get(),
        mixedUnavailable.get()
    ]);
    assert.equal(mixedOrder.exists, false);
    assert.equal(mixedAvailableAfter.get('status'), 'available');
    assert.equal(mixedUnavailableAfter.get('status'), 'unavailable');

    const raceDonation = await seedDonation('race');
    const otherAidWorker = {
        id: ids.otherAidWorker,
        name: 'Other Aid Worker',
        email: `${ids.otherAidWorker}@example.test`
    };
    const raceOrderStart = createdDocumentRefs.length;
    const raceResults = await Promise.allSettled([
        submitCurrentRequest(aidWorkerContext.firestore, [raceDonation.id], aidWorker),
        submitCurrentRequest(otherAidWorkerContext.firestore, [raceDonation.id], otherAidWorker)
    ]);
    assert.equal(raceResults.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(raceResults.filter((result) => result.status === 'rejected' && isPermissionDenied(result.reason)).length, 1);
    const raceOrderSnapshots = await Promise.all(createdDocumentRefs.slice(raceOrderStart).map((ref) => ref.get()));
    assert.equal(raceOrderSnapshots.filter((snapshot) => snapshot.exists).length, 1);
    assert.equal((await raceDonation.get()).get('status'), 'requested');

    console.log(`Aid-worker request emulator regression passed (${runId})`);
}

try {
    await main();
} finally {
    await cleanUp();
    await Promise.all(webApps.map((app) => deleteApp(app).catch(() => undefined)));
    await deleteAdminApp(adminApp).catch(() => undefined);
}
