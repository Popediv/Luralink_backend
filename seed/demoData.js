/**
 * LuraLink Demo Seed
 * Run with: npm run seed
 *
 * Creates:
 *   1 platform admin
 *   2 facilities  (hospital + clinic)
 *   6 workers     (various healthcare specialties, all verified)
 *   6 open shifts (spread across the next 7 days)
 *   3 applications (2 pending, 1 accepted → shift becomes assigned)
 *   1 funded payment (on the assigned shift, ready for release)
 *   1 completed shift + rating (to demo the rating flow)
 *
 * Re-running is safe: users are upserted by email.
 */

import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../src/config/db.js';
import bcrypt from 'bcrypt';

// ─── helpers ────────────────────────────────────────────────────────────────

const hash = (pw) => bcrypt.hash(pw, 10);

function daysFromNow(days, extra = {}) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  Object.assign(d, extra);
  return d;
}

function hoursAfter(date, hours) {
  return new Date(date.getTime() + hours * 3_600_000);
}

// ─── seed ────────────────────────────────────────────────────────────────────

async function seed() {
  await prisma.$connect();
  console.log('🌱  Seeding LuraLink database…\n');

  // ── 1. Platform admin ────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@luralink.com' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@luralink.com',
      password: await hash('Admin1234!'),
      role: 'platform_admin',
    },
  });
  console.log('✔  Platform admin created  (admin@luralink.com / Admin1234!)');

  // ── 2. Facilities ────────────────────────────────────────────────────────
  const facilityDefs = [
    {
      email: 'ops@medicore.com',
      name: 'MediCore Hospital',
      type: 'hospital',
      address: '12 Marina Street, Lagos Island',
      latitude: 6.4531,
      longitude: 3.3958,
    },
    {
      email: 'ops@brightclinic.com',
      name: 'Bright Star Clinic',
      type: 'clinic',
      address: '45 Adeola Odeku, Victoria Island, Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
    },
  ];

  const facilities = [];
  for (const def of facilityDefs) {
    const u = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        name: def.name,
        email: def.email,
        password: await hash('Facility123!'),
        role: 'facility_admin',
      },
    });

    const f = await prisma.facility.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        name: def.name,
        type: def.type,
        address: def.address,
        latitude: def.latitude,
        longitude: def.longitude,
      },
    });

    facilities.push(f);
    console.log(`✔  Facility "${def.name}"  (${def.email} / Facility123!)`);
  }

  // ── 3. Workers ───────────────────────────────────────────────────────────
  const workerDefs = [
    { name: 'Amara Osei', email: 'amara@workers.com', skills: ['Nurse', 'ICU'], lat: 6.460, lon: 3.400, rating: 4.8 },
    { name: 'Chidi Nwosu', email: 'chidi@workers.com', skills: ['Pharmacist'], lat: 6.448, lon: 3.410, rating: 4.5 },
    { name: 'Fatima Bello', email: 'fatima@workers.com', skills: ['Lab Technician', 'Pathology'], lat: 6.435, lon: 3.390, rating: 4.2 },
    { name: 'Kofi Mensah', email: 'kofi@workers.com', skills: ['Radiographer'], lat: 6.470, lon: 3.375, rating: 3.9 },
    { name: 'Ngozi Adeyemi', email: 'ngozi@workers.com', skills: ['Physiotherapist'], lat: 6.442, lon: 3.425, rating: 4.6 },
    { name: 'Emeka Eze', email: 'emeka@workers.com', skills: ['Nurse', 'Midwife'], lat: 6.455, lon: 3.405, rating: 4.0 },
  ];

  const workers = [];
  for (const def of workerDefs) {
    const u = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        name: def.name,
        email: def.email,
        password: await hash('Worker123!'),
        role: 'worker',
      },
    });

    const w = await prisma.worker.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        skills: def.skills,
        availability: 'available',
        latitude: def.lat,
        longitude: def.lon,
        rating: def.rating,
      },
    });

    // Create all three required verification docs (auto-approved for demo)
    const docTypes = ['license', 'government_id', 'photo'];
    for (const documentType of docTypes) {
      const exists = await prisma.verification.findFirst({ where: { userId: u.id, documentType } });
      if (!exists) {
        await prisma.verification.create({
          data: {
            userId: u.id,
            documentType,
            documentUrl: `https://placehold.co/400x300.png?text=${documentType}`,
            status: 'approved',
          },
        });
      }
    }

    workers.push({ ...w, userId: u.id, user: u });
    console.log(`✔  Worker "${def.name}"  (${def.email} / Worker123!)`);
  }

  // ── 4. Shifts ────────────────────────────────────────────────────────────
  const shiftDefs = [
    { facilityIdx: 0, title: 'Night ICU Cover', specialty: 'Nurse', payRate: 25000, daysOffset: 1, durationHours: 12 },
    { facilityIdx: 0, title: 'Pharmacy Locum', specialty: 'Pharmacist', payRate: 18000, daysOffset: 2, durationHours: 8 },
    { facilityIdx: 0, title: 'Lab Sample Processing', specialty: 'Lab Technician', payRate: 15000, daysOffset: 3, durationHours: 6 },
    { facilityIdx: 1, title: 'Morning Imaging Shift', specialty: 'Radiographer', payRate: 20000, daysOffset: 2, durationHours: 8 },
    { facilityIdx: 1, title: 'Physio Session Cover', specialty: 'Physiotherapist', payRate: 16000, daysOffset: 4, durationHours: 4 },
    { facilityIdx: 1, title: 'Midwifery Support', specialty: 'Midwife', payRate: 22000, daysOffset: 5, durationHours: 10 },
  ];

  const shifts = [];
  for (const def of shiftDefs) {
    const startTime = daysFromNow(def.daysOffset);
    const endTime = hoursAfter(startTime, def.durationHours);
    const facility = facilities[def.facilityIdx];

    const shift = await prisma.shift.create({
      data: {
        facilityId: facility.id,
        title: def.title,
        specialty: def.specialty,
        payRate: def.payRate,
        startTime,
        endTime,
        status: 'open',
        latitude: facility.latitude,
        longitude: facility.longitude,
      },
    });

    shifts.push(shift);
    console.log(`✔  Shift "${def.title}"  (₦${def.payRate.toLocaleString()}, ${def.daysOffset}d from now)`);
  }

  // ── 5. Applications → one accepted (assigned shift) ────────────────────
  // Workers 0 (Amara – Nurse) and 5 (Emeka – Nurse) apply to shift 0 (ICU Cover)
  const nurseShift = shifts[0];
  const amaraWorker = workers[0];
  const emekaWorker = workers[5];

  const app1 = await prisma.application.create({
    data: { shiftId: nurseShift.id, workerId: amaraWorker.id, status: 'applied' },
  });
  await prisma.application.create({
    data: { shiftId: nurseShift.id, workerId: emekaWorker.id, status: 'applied' },
  });

  // Accept Amara → shift becomes assigned
  await prisma.$transaction([
    prisma.application.update({ where: { id: app1.id }, data: { status: 'accepted' } }),
    prisma.application.updateMany({
      where: { shiftId: nurseShift.id, id: { not: app1.id } },
      data: { status: 'rejected' },
    }),
    prisma.shift.update({
      where: { id: nurseShift.id },
      data: { workerId: amaraWorker.id, status: 'assigned' },
    }),
  ]);

  // Create a funded payment for that shift (simulates Paystack webhook)
  await prisma.payment.create({
    data: {
      shiftId: nurseShift.id,
      amount: nurseShift.payRate,
      escrowStatus: 'funded',
      reference: `demo_${nurseShift.id}_${Date.now()}`,
    },
  });

  console.log('\n✔  Application accepted: Amara → "Night ICU Cover" (shift assigned + escrow funded)');

  // ── 6. One fully completed shift with a rating ──────────────────────────
  // Pharmacist shift: Chidi applied & was accepted → shift completed → rated
  const pharmaShift = shifts[1];
  const chidiWorker = workers[1];
  const brightClinicFacility = facilities[1];

  const pharmaApp = await prisma.application.create({
    data: { shiftId: pharmaShift.id, workerId: chidiWorker.id, status: 'accepted' },
  });

  await prisma.$transaction([
    prisma.shift.update({
      where: { id: pharmaShift.id },
      data: { workerId: chidiWorker.id, status: 'paid', completedAt: new Date() },
    }),
    prisma.payment.create({
      data: {
        shiftId: pharmaShift.id,
        amount: pharmaShift.payRate,
        escrowStatus: 'released',
        reference: `demo_paid_${pharmaShift.id}_${Date.now()}`,
        releasedAt: new Date(),
      },
    }),
  ]);

  // Facility rates Chidi, Chidi rates facility user
  const facilityUser2 = await prisma.user.findUnique({ where: { id: brightClinicFacility.userId } });

  await prisma.rating.create({
    data: {
      fromUserId: facilityUser2.id,
      toUserId: chidiWorker.userId,
      shiftId: pharmaShift.id,
      score: 5,
      comment: 'Extremely professional and punctual. Would book again.',
    },
  });
  await prisma.rating.create({
    data: {
      fromUserId: chidiWorker.userId,
      toUserId: facilityUser2.id,
      shiftId: pharmaShift.id,
      score: 4,
      comment: 'Well-organised facility. Clear instructions provided.',
    },
  });

  // Update Chidi's average rating
  const { _avg } = await prisma.rating.aggregate({
    where: { toUserId: chidiWorker.userId },
    _avg: { score: true },
  });
  await prisma.worker.update({ where: { id: chidiWorker.id }, data: { rating: _avg.score ?? 0 } });

  console.log('✔  Completed shift demo: Chidi → "Pharmacy Locum" (paid + mutual ratings)\n');

  // ── done ─────────────────────────────────────────────────────────────────
  console.log('─────────────────────────────────────────────────────────');
  console.log('✅  Seeding complete!\n');
  console.log('Quick login credentials:');
  console.log('  Admin   → admin@luralink.com    / Admin1234!');
  console.log('  Facility→ ops@medicore.com       / Facility123!');
  console.log('  Worker  → amara@workers.com      / Worker123!');
  console.log('─────────────────────────────────────────────────────────');

  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
