#!/usr/bin/env node
// Merge duplicate Organizations documents. Dry-run by default; pass --apply to write.
//
//   node scripts/merge-organizations.mjs                      # plan only
//   node scripts/merge-organizations.mjs --apply              # write, dev project only
//   node scripts/merge-organizations.mjs --apply --allow-prod
//   node scripts/merge-organizations.mjs --restore <backup.json> [--allow-prod]
//   node scripts/merge-organizations.mjs --gcloud-account you@example.com   # auth with a gcloud login instead
//
// Project comes from .env.local. Credentials come from the same service-account fields
// src/api/firebaseAdmin.ts uses, or, with --gcloud-account, from that account's gcloud login
// (~/.config/gcloud/legacy_credentials/<account>/adc.json). The .env.prod.local service account
// belongs to the dev project and cannot read prod, so prod runs need --gcloud-account.
// --apply writes a backup of every doc it is about to touch before the first write.
// --restore puts every doc in that backup back exactly as it was, recreating deleted ones.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

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

// Renames also update the name snapshot on Users.organization and the free-text Donations.distributor.organization.
const RENAMES = [
    { id: 'qiw1X7t49uaA9cIMC9rE', name: 'Department of Children and Families/Economic Services Division' },
    { id: 'nTyo4ltEFlX1g7yFEgd3', name: 'University of Vermont Medical Center' }
];

// Fields worth carrying over from the spare when the keep doc never had them.
const FILL_FIELDS = ['address', 'phoneNumber', 'emailFooter', 'county', 'createdAt'];

const argv = process.argv.slice(2);
const args = new Set(argv);
const apply = args.has('--apply');
const allowProd = args.has('--allow-prod');
const restoreFile = argv.includes('--restore') ? argv[argv.indexOf('--restore') + 1] : null;
if (argv.includes('--restore') && !restoreFile) fail('--restore needs a backup file path');
const gcloudAccount = argv.includes('--gcloud-account') ? argv[argv.indexOf('--gcloud-account') + 1] : null;
if (argv.includes('--gcloud-account') && !gcloudAccount) fail('--gcloud-account needs an email');
if (restoreFile && apply) fail('--restore and --apply are exclusive');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: resolve(root, '.env.local') });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) fail('NEXT_PUBLIC_FIREBASE_PROJECT_ID missing from .env.local');
if ((apply || restoreFile) && projectId !== DEV_PROJECT && !allowProd) {
    fail(`refusing to write against ${projectId}; pass --allow-prod if you really mean it`);
}

if (gcloudAccount) {
    const adc = resolve(homedir(), '.config', 'gcloud', 'legacy_credentials', gcloudAccount, 'adc.json');
    if (!existsSync(adc)) fail(`no gcloud login found for ${gcloudAccount} (expected ${adc}); run: gcloud auth login ${gcloudAccount}`);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adc;
}
initializeApp({
    projectId,
    credential: gcloudAccount
        ? applicationDefault()
        : cert({
              projectId,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
});
const db = getFirestore();

console.log(`project: ${projectId}`);
console.log(`auth: ${gcloudAccount ? `gcloud ${gcloudAccount}` : `service account ${process.env.FIREBASE_CLIENT_EMAIL}`}`);
console.log(`mode: ${restoreFile ? 'RESTORE' : apply ? 'APPLY' : 'dry-run'}`);
console.log('');

if (restoreFile) {
    await restore(restoreFile);
} else {
    await run();
}

async function run() {
    const ops = [];
    let blocked = false;
    for (const merge of MERGES) {
        const op = await planMerge(merge);
        if (op === 'blocked') blocked = true;
        else if (op) ops.push(op);
    }
    for (const rename of RENAMES) {
        const op = await planRename(rename);
        if (op) ops.push(op);
    }

    if (blocked) {
        console.log('\none or more merges are blocked; nothing was written');
        process.exit(1);
    }
    if (!apply) {
        console.log('\ndry-run complete; re-run with --apply to write');
        return;
    }
    if (ops.length === 0) {
        console.log('\nnothing to apply');
        return;
    }

    const backup = { project: projectId, ranAt: new Date().toISOString(), applied: [], before: {} };
    for (const op of ops) Object.assign(backup.before, op.before);
    const file = backupPath();
    writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`\nbackup of every doc about to be touched written to ${file}`);

    for (const op of ops) {
        const batch = db.batch();
        op.write(batch);
        await batch.commit();
        backup.applied.push(op.label);
        writeFileSync(file, JSON.stringify(backup, null, 2));
        console.log(`applied: ${op.label}`);
    }
    console.log(`\ndone. undo with: node scripts/merge-organizations.mjs --restore ${file}${projectId === DEV_PROJECT ? '' : ' --allow-prod'}`);
}

async function planMerge({ label, keep, spare, repointUsers }) {
    console.log(`== ${label}`);
    const [keepSnap, spareSnap] = await Promise.all([db.doc(`Organizations/${keep}`).get(), db.doc(`Organizations/${spare}`).get()]);
    if (!spareSnap.exists) {
        console.log(`   spare ${spare} not found, skipping`);
        return null;
    }
    if (!keepSnap.exists) {
        console.log(`   keep ${keep} not found but spare exists; aborting this merge`);
        return 'blocked';
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
        return 'blocked';
    }
    if (!donationsOnSpare.empty) {
        console.log(`   BLOCKED: ${donationsOnSpare.size} donation(s) snapshot requestor.organization.id = ${spare}`);
        return 'blocked';
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

    const before = {
        [`Organizations/${keep}`]: keepData,
        [`Organizations/${spare}`]: spareData
    };
    for (const d of usersOnSpare.docs) before[`Users/${d.id}`] = d.data();
    for (const d of distributorRows?.docs ?? []) before[`Donations/${d.id}`] = d.data();

    return {
        label,
        before,
        write(batch) {
            if (Object.keys(keepUpdate).length > 0) batch.update(keepSnap.ref, keepUpdate);
            for (const d of usersOnSpare.docs) {
                batch.update(d.ref, { organization: { id: keep, name: keepData.name }, modifiedAt: FieldValue.serverTimestamp() });
            }
            for (const d of distributorRows?.docs ?? []) {
                batch.update(d.ref, { 'distributor.organization': keepData.name, modifiedAt: FieldValue.serverTimestamp() });
            }
            batch.delete(spareSnap.ref);
        }
    };
}

async function planRename({ id, name }) {
    console.log(`== rename ${id}`);
    const snap = await db.doc(`Organizations/${id}`).get();
    if (!snap.exists) {
        console.log('   not found, skipping');
        return null;
    }
    const current = snap.data().name;
    if (current === name) {
        console.log(`   already "${name}"`);
        return null;
    }
    const [users, donations] = await Promise.all([
        db.collection('Users').where('organization.id', '==', id).get(),
        current ? db.collection('Donations').where('distributor.organization', '==', current).get() : null
    ]);
    console.log(`   "${current}" -> "${name}"`);
    console.log(`   update organization.name on ${users.size} user(s), distributor.organization on ${donations?.size ?? 0} donation(s)`);

    const before = { [`Organizations/${id}`]: snap.data() };
    for (const d of users.docs) before[`Users/${d.id}`] = d.data();
    for (const d of donations?.docs ?? []) before[`Donations/${d.id}`] = d.data();

    return {
        label: `rename ${id} -> "${name}"`,
        before,
        write(batch) {
            batch.update(snap.ref, { name, modifiedAt: FieldValue.serverTimestamp() });
            for (const d of users.docs) batch.update(d.ref, { 'organization.name': name, modifiedAt: FieldValue.serverTimestamp() });
            for (const d of donations?.docs ?? []) batch.update(d.ref, { 'distributor.organization': name, modifiedAt: FieldValue.serverTimestamp() });
        }
    };
}

async function restore(file) {
    const backup = JSON.parse(readFileSync(file, 'utf8'));
    if (backup.project !== projectId) fail(`backup is for ${backup.project}, .env.local points at ${projectId}`);
    const entries = Object.entries(backup.before ?? {});
    if (entries.length === 0) fail('backup has no documents');
    console.log(`restoring ${entries.length} document(s) from ${file} (taken ${backup.ranAt})`);
    console.log('each doc is written back whole, so any change made to it since the backup is lost\n');
    const batch = db.batch();
    for (const [path, data] of entries) {
        console.log(`   set ${path}`);
        batch.set(db.doc(path), reviveTimestamps(data));
    }
    await batch.commit();
    console.log('\nrestored');
}

function reviveTimestamps(value) {
    if (Array.isArray(value)) return value.map(reviveTimestamps);
    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 2 && typeof value._seconds === 'number' && typeof value._nanoseconds === 'number') {
            return new Timestamp(value._seconds, value._nanoseconds);
        }
        return Object.fromEntries(keys.map((k) => [k, reviveTimestamps(value[k])]));
    }
    return value;
}

function backupPath() {
    const dir = resolve(root, '..', 'thoughts', 'shared', 'backups');
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return resolve(dir, `${stamp}-org-merge-${projectId}.json`);
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
