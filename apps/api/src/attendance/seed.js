import { db } from './db.js';
import { runDailyParticipantAbsenceJob } from './services/rulesEngine.js';

export function seedDatabase() {
  console.log('Seeding initial anti-fraud database...');
  db.reset();

  // 1. Create Units
  const unit1 = db.insert('units', {
    id: 'unit_st_jude',
    name: 'St. Jude Youth Residential Hostel',
    type: 'Hostel',
    address: 'Sector 4, Central District',
    sanctionedStrength: 30,
    activeParticipantsCount: 30,
    minVerificationRatio: 0.8,
    location: {
      lat: 12.9716,
      lng: 77.5946,
      radiusMeters: 200
    }
  });

  const unit2 = db.insert('units', {
    id: 'unit_govt_home',
    name: 'Govt. Welfare Children Home (North)',
    type: 'Child Welfare Home',
    address: 'Plot 12, Vikas Nagar',
    sanctionedStrength: 35,
    activeParticipantsCount: 40,
    minVerificationRatio: 0.8,
    location: {
      lat: 13.0827,
      lng: 80.2707,
      radiusMeters: 250
    }
  });

  const unit3 = db.insert('units', {
    id: 'unit_pragati',
    name: 'Pragati Model Vocational Institute',
    type: 'Institute',
    address: 'Industrial Area Phase 2',
    sanctionedStrength: 50,
    activeParticipantsCount: 48,
    minVerificationRatio: 0.85,
    location: {
      lat: 28.6139,
      lng: 77.2090,
      radiusMeters: 300
    }
  });

  // 2. Create 30 Participants for Unit 1 (St. Jude)
  const studentNames = [
    "Aarav Sharma", "Vivaan Patel", "Aditya Iyer", "Vihaan Singh", "Arjun Reddy",
    "Reyansh Gupta", "Muhammad Khan", "Sai Pranav", "Kabir Joshi", "Ananya Deshmukh",
    "Diya Sengupta", "Saanvi Rao", "Aadhya Nair", "Rohan Verma", "Ishaan Kulkarni",
    "Shlok Bhatt", "Tanvi Agarwal", "Navya Pillai", "Myra Choudhury", "Pari Mehra",
    "Devansh Tiwari", "Ira Nambiar", "Krishna Trivedi", "Kiara Saxena", "Rudra Patil",
    "Ahana Roy", "Samarth Bhat", "Gauri Mahajan", "Atharv Dixit", "Avani Shetty"
  ];

  studentNames.forEach((name, idx) => {
    const rollNo = `STJ-${101 + idx}`;
    // Rohan Verma (index 13) has 20 days long absence for demo step 4
    const isLongAbsentee = (idx === 13);
    const consecutiveAbsentDays = isLongAbsentee ? 20 : (idx % 7 === 0 ? 3 : 0);
    const totalWorkingDays = 25;
    const totalPresent = isLongAbsentee ? 5 : (25 - consecutiveAbsentDays);

    db.insert('participants', {
      id: `p_stj_${idx + 1}`,
      unitId: unit1.id,
      name,
      rollNo,
      gender: idx % 2 === 0 ? 'Male' : 'Female',
      age: 14 + (idx % 5),
      status: 'active',
      consecutiveAbsentDays,
      totalPresent,
      totalWorkingDays,
      absenceReason: null, // Unexplained absence
      lastAttendedDate: isLongAbsentee ? '2026-09-13' : '2026-10-02'
    });
  });

  // Create Participants for Unit 2
  for (let i = 1; i <= 40; i++) {
    db.insert('participants', {
      id: `p_gwh_${i}`,
      unitId: unit2.id,
      name: `Beneficiary GWH-${100 + i}`,
      rollNo: `GWH-${100 + i}`,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      age: 10 + (i % 6),
      status: 'active',
      consecutiveAbsentDays: i === 5 ? 18 : 0,
      absenceReason: i === 5 ? "Hospitalized for typhoid" : null, // Excused absence
      totalPresent: 22,
      totalWorkingDays: 24,
      lastAttendedDate: '2026-10-02'
    });
  }

  // 3. Seed historical sessions for Unit 1 to demonstrate trends and repeated low ratios
  const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'];
  dates.forEach((date, i) => {
    const tickedCount = 28;
    const faceCount = 20; // 0.71 ratio -> repeated low ratio
    const verificationRatio = Number((faceCount / tickedCount).toFixed(2));
    const attendanceRate = Number((tickedCount / 30).toFixed(2));

    db.insert('sessions', {
      id: `sess_stj_hist_${i + 1}`,
      unitId: unit1.id,
      unitName: unit1.name,
      sessionType: 'Morning Rollcall',
      date,
      status: 'final',
      createdAt: `${date}T08:30:00.000Z`,
      finalizedAt: `${date}T08:42:00.000Z`,
      faceCount,
      tickedCount,
      verificationRatio,
      attendanceRate,
      registeredCount: 30,
      photos: [
        {
          id: `photo_hist_${i}_1`,
          timestamp: `${date}T08:32:00.000Z`,
          gps: { lat: 12.9716, lng: 77.5946, accuracy: 12 },
          faceCount: 20,
          quality: { blur: 110.2, brightness: 125, ok: true, reason: 'Good quality' }
        }
      ]
    });
  });

  // Seed photo hashes for duplicate detection test
  db.insert('photo_hashes', {
    photoId: 'photo_prev_master_001',
    sessionId: 'sess_stj_hist_1',
    unitId: unit1.id,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    pHash: '8f0e3c1a7b9d4e2f',
    date: '2026-09-28'
  });

  // 4. Run daily absence job to populate active alerts
  runDailyParticipantAbsenceJob();

  console.log('✓ Database seeded successfully with St. Jude hostel test data, participants, and historical sessions.');
}

// Run directly if called as script
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
