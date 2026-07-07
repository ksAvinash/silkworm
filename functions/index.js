const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Onboard a new tenant (super admin only).
 *
 * Creates the tenant document, creates (or reuses) the Firebase Auth user for
 * the tenant admin's phone number, sets the `tenantId` custom claim on that
 * user, and registers them in /admins.
 */
exports.onboardTenant = onCall(async (request) => {
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
