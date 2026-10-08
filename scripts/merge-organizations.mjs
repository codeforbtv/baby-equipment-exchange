#!/usr/bin/env node
// Merge duplicate Organizations documents. Dry-run by default; pass --apply to write.
//
//   node scripts/merge-organizations.mjs            # plan only
//   node scripts/merge-organizations.mjs --apply    # write, dev project only
//   node scripts/merge-organizations.mjs --apply --allow-prod
//
// Credentials and project come from .env.local (same fields src/api/firebaseAdmin.ts uses).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const DEV_PROJECT = 'baby-equipment-exchange-dev';

// keep: canonical doc. spare: doc that goes away.
// repointUsers: user ids expected to be on the spare; any other user on it aborts the merge.
const MERGES = [
    {
        label: 'Janet S. Munt Family Room',
        keep: 'C4be8tRHqKihZtKrMKKI',
        spare: 'kwIHMnH0LnwbFcrrnmTt',
        repointUsers: ['D4XKLd4VbiQLw1RUIG4BbB7Vtfm2']
    },
    { label: 'CVOEO', keep: 'tVV1H3dm6YgVDch0k1Fc', spare: 'BnzmFvmVpVxBFy3vf9m8', repointUsers: [] },
    { label: "Burlington Children's Space", keep: 'bKLvtFzGXzSYSPECiNKk', spare: '5YSh71fZIrTTnJBQ3iuj', repointUsers: [] },
    { label: 'CHCB', keep: 'TiEZ6kkJRHEyHRVLsUc8', spare: 'K4VQirAKAZWqZ4B0suxp', repointUsers: [] },
    { label: 'University of Vermont', keep: 'aS10Y7rgHDz9MTCr1rvw', spare: 'nTvX1x9pmdm0iu99o0vD', repointUsers: [] },
    { label: 'Franklin County Women for Democracy', keep: '9w62eQ4tOs7LBNY6wQZw', spare: 'NgdzPaO1H0qk9L2BLCih', repointUsers: [] }
];

const RENAMES = [{ id: 'qiw1X7t49uaA9cIMC9rE', name: 'Department of Children and Families/Economic Services Division' }];

// Fields worth carrying over from the spare when the keep doc never had them.
const FILL_FIELDS = ['address', 'phoneNumber', 'emailFooter', 'county', 'createdAt'];

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const allowProd = args.has('--allow-prod');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(root, '.env.local') });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) fail('NEXT_PUBLIC_FIREBASE_PROJECT_ID missing from .env.local');
if (apply && projectId !== DEV_PROJECT && !allowProd) {
    fail(`refusing to --apply against ${projectId}; pass --allow-prod if you really mean it`);
}

initializeApp({
    credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
});
const db = getFirestore();

console.log(`project: ${projectId}`);
console.log(`mode: ${apply ? 'APPLY' : 'dry-run'}`);
console.log('');

const backup = { project: projectId, ranAt: new Date().toISOString(), applied: apply, before: {} };
let blocked = false;

for (const merge of MERGES) {
    await planMerge(merge);
}
for (const rename of RENAMES) {
    await planRename(rename);
}

if (blocked) {
    console.log('\none or more merges are blocked; nothing was written');
    process.exit(1);
}
if (apply) {
    const stamp = new Date().toISOString().slice(0, 10);
    const dir = resolve(root, '..', 'thoughts', 'shared', 'backups');
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, `${stamp}-org-merge-${projectId}.json`);
    writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`\nbackup of every touched doc written to ${file}`);
}
console.log(apply ? '\ndone' : '\ndry-run complete; re-run with --apply to write');

async function planMerge({ label, keep, spare, repointUsers }) {
    console.log(`== ${label}`);
    const [keepSnap, spareSnap] = await Promise.all([db.doc(`Organizations/${keep}`).get(), db.doc(`Organizations/${spare}`).get()]);
    if (!spareSnap.exists) {
        console.log(`   spare ${spare} not found, skipping`);
        return;
    }
    if (!keepSnap.exists) {
        console.log(`   keep ${keep} not found but spare exists; aborting this merge`);
        blocked = true;
        return;
    }
    const keepData = keepSnap.data();
    const spareData = spareSnap.data();
    console.log(`   keep  ${keep} "${keepData.name}" (${(keepData.distributedItems ?? []).length} distributed)`);
    console.log(`   spare ${spare} "${spareData.name}" (${(spareData.distributedItems ?? []).length} distributed)`);

    const [usersOnSpare, donationsOnSpare] = await Promise.all([
        db.collection('Users').where('organization.id', '==', spare).get(),
        db.collection('Donations').where('requestor.organization.id', '==', spare).get()
    ]);
    const unexpectedUsers = usersOnSpare.docs.filter((d) => !repointUsers.includes(d.id));
    if (unexpectedUsers.length > 0) {
        console.log(`   BLOCKED: ${unexpectedUsers.length} user(s) on the spare not in repointUsers: ${unexpectedUsers.map((d) => d.id).join(', ')}`);
        blocked = true;
        return;
    }
    if (!donationsOnSpare.empty) {
        console.log(`   BLOCKED: ${donationsOnSpare.size} donation(s) snapshot requestor.organization.id = ${spare}`);
        blocked = true;
        return;
    }
    const missingUsers = repointUsers.filter((uid) => !usersOnSpare.docs.some((d) => d.id === uid));
    if (missingUsers.length > 0) {
        console.log(`   repointUsers not on the spare (already moved or absent here): ${missingUsers.join(', ')}`);
    }

    const keepUpdate = {};
    for (const field of FILL_FIELDS) {
        if (keepData[field] === undefined && spareData[field] !== undefined) keepUpdate[field] = spareData[field];
    }
    const spareItems = spareData.distributedItems ?? [];
    if (spareItems.length > 0) keepUpdate.distributedItems = FieldValue.arrayUnion(...spareItems);
    if (Object.keys(keepUpdate).length > 0) keepUpdate.modifiedAt = FieldValue.serverTimestamp();

    const distributorRows =
        spareData.name && spareData.name !== keepData.name
            ? await db.collection('Donations').where('distributor.organization', '==', spareData.name).get()
            : null;

    console.log(`   keep update: ${Object.keys(keepUpdate).length ? Object.keys(keepUpdate).join(', ') : 'none'}`);
    for (const d of usersOnSpare.docs) console.log(`   repoint user ${d.id} "${d.data().displayName ?? ''}" -> ${keep}`);
    if (distributorRows) console.log(`   rename distributor.organization on ${distributorRows.size} donation(s)`);
    console.log(`   delete spare ${spare}`);

    if (!apply) return;

    backup.before[`Organizations/${keep}`] = keepData;
    backup.before[`Organizations/${spare}`] = spareData;
    const batch = db.batch();
    if (Object.keys(keepUpdate).length > 0) batch.update(keepSnap.ref, keepUpdate);
    for (const d of usersOnSpare.docs) {
        backup.before[`Users/${d.id}`] = d.data();
        batch.update(d.ref, { organization: { id: keep, name: keepData.name }, modifiedAt: FieldValue.serverTimestamp() });
    }
    for (const d of distributorRows?.docs ?? []) {
        backup.before[`Donations/${d.id}`] = d.data();
        batch.update(d.ref, { 'distributor.organization': keepData.name, modifiedAt: FieldValue.serverTimestamp() });
    }
    batch.delete(spareSnap.ref);
    await batch.commit();
    console.log('   applied');
}

async function planRename({ id, name }) {
    console.log(`== rename ${id}`);
    const snap = await db.doc(`Organizations/${id}`).get();
    if (!snap.exists) {
        console.log('   not found, skipping');
        return;
    }
    const current = snap.data().name;
    if (current === name) {
        console.log(`   already "${name}"`);
        return;
    }
    console.log(`   "${current}" -> "${name}"`);
    if (!apply) return;
    backup.before[`Organizations/${id}`] = snap.data();
    await snap.ref.update({ name, modifiedAt: FieldValue.serverTimestamp() });
    console.log('   applied');
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
