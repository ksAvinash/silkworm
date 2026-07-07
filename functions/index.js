const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

// Must match FUNCTIONS_REGION in lib/firebase.ts.
const REGION = 'asia-south1';

/**
 * Onboard a new tenant (super admin only).
 *
 * Creates the tenant document, creates (or reuses) the Firebase Auth user for
 * the tenant admin's phone number, sets the `tenantId` custom claim on that
 * user, and registers them in /admins.
 */
exports.onboardTenant = onCall({ region: REGION }, async (request) => {
  if (request.auth?.token?.superAdmin !== true) {
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
  if (user.customClaims?.tenantId) {
    throw new HttpsError('already-exists', 'This phone number is already the admin of another tenant.');
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

  await auth.setCustomUserClaims(user.uid, { tenantId: tenantRef.id });
  await db.collection('admins').doc(user.uid).set({
    phone: adminPhone,
    tenantId: tenantRef.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { tenantId: tenantRef.id };
});

/**
 * Mirror the caller's recorded role into their auth custom claims.
 *
 * /superAdmins/{uid} → { superAdmin: true }; otherwise /admins/{uid} →
 * { tenantId }. Both collections are Admin-SDK-only (client writes are
 * denied by Firestore rules), so they're safe to trust as the role source.
 * Lets a super admin bootstrap their claim from a console-created doc, and
 * heals tokens when claims were set after the user signed in.
 */
exports.syncClaims = onCall({ region: REGION }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  const uid = request.auth.uid;
  const db = admin.firestore();

  let claims = null;
  const superDoc = await db.collection('superAdmins').doc(uid).get();
  if (superDoc.exists) {
    claims = { superAdmin: true };
  } else {
    const adminDoc = await db.collection('admins').doc(uid).get();
    const tenantId = adminDoc.exists ? adminDoc.data().tenantId : null;
    if (tenantId) claims = { tenantId };
  }
  if (!claims) {
    throw new HttpsError('permission-denied', 'No admin role is recorded for this account.');
  }

  const user = await admin.auth().getUser(uid);
  const current = user.customClaims || {};
  const drifted = Object.entries(claims).some(([key, value]) => current[key] !== value);
  if (drifted) {
    await admin.auth().setCustomUserClaims(uid, { ...current, ...claims });
  }
  return { ok: true, claims };
});
