const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const REGION = 'asia-south1';

function isSuperToken(token) {
  // token.superAdmin is the legacy claim shape, accepted during transition.
  return token?.role === 'superadmin' || token?.superAdmin === true;
}

/**
 * Onboard a new tenant (super admin only).
 *
 * Creates the tenant document, creates (or reuses) the Firebase Auth user for
 * the tenant admin's phone number, sets role custom claims on that user, and
 * registers them in /users.
 */
exports.onboardTenant = onCall({ region: REGION }, async (request) => {
  if (!isSuperToken(request.auth?.token)) {
    throw new HttpsError('permission-denied', 'Only the platform super admin can onboard tenants.');
  }

  const name = String(request.data?.name ?? '').trim();
  const adminPhone = String(request.data?.adminPhone ?? '').trim();
  if (!name || !/^\+[1-9]\d{6,14}$/.test(adminPhone)) {
    throw new HttpsError('invalid-argument', 'Provide a tenant name and an E.164 phone number (e.g. +919876543210).');
  }

  const db = admin.firestore();
  const auth = admin.auth();

  // Create or reuse the auth user for this phone number.
  let user;
  try {
    user = await auth.getUserByPhoneNumber(adminPhone);
  } catch {
    user = await auth.createUser({ phoneNumber: adminPhone });
  }
  if (user.customClaims?.role) {
    throw new HttpsError('already-exists', 'This phone number already has a role on the platform.');
  }

  const tenantRef = db.collection('tenants').doc();
  await tenantRef.set({
    name,
    adminPhone,
    status: 'active',
    invoiceSeq: 0,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await auth.setCustomUserClaims(user.uid, { role: 'admin', tenantId: tenantRef.id });
  await db.collection('users').doc(user.uid).set({
    role: 'admin',
    phone: adminPhone,
    tenantId: tenantRef.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { tenantId: tenantRef.id };
});

/**
 * Mirror the caller's recorded role (/users/{uid}) into their auth custom
 * claims. /users is Admin-SDK-only (client writes are denied by Firestore
 * rules), so it's safe to trust as the role source.
 *
 * If no /users doc exists for this uid, falls back to a lookup by the
 * token's verified phone number and re-keys the profile — this self-heals
 * the case where an auth user was deleted and re-created with a new uid.
 */
exports.syncClaims = onCall({ region: REGION }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  const uid = request.auth.uid;
  const db = admin.firestore();
  const users = db.collection('users');

  let snap = await users.doc(uid).get();

  if (!snap.exists) {
    const phone = String(request.auth.token.phone_number ?? '').trim();
    if (phone) {
      const byPhone = await users.where('phone', '==', phone).limit(1).get();
      if (!byPhone.empty) {
        await users.doc(uid).set(byPhone.docs[0].data());
        await byPhone.docs[0].ref.delete();
        snap = await users.doc(uid).get();
      }
    }
  }
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'No role is recorded for this account.');
  }

  const { role, tenantId } = snap.data();
  let claims;
  if (role === 'superadmin') {
    claims = { role: 'superadmin' };
  } else if (role === 'admin' && tenantId) {
    claims = { role: 'admin', tenantId };
  } else {
    throw new HttpsError('permission-denied', 'User role is invalid.');
  }

  const user = await admin.auth().getUser(uid);
  const current = user.customClaims || {};
  const drifted =
    Object.entries(claims).some(([key, value]) => current[key] !== value) ||
    Object.keys(current).length !== Object.keys(claims).length;
  if (drifted) {
    await admin.auth().setCustomUserClaims(uid, claims);
  }
  return { ok: true, claims };
});
