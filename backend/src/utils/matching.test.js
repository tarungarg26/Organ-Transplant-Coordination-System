const test = require("node:test");
const assert = require("node:assert/strict");
const {
  bloodCompatible,
  hlaScore,
  urgencyScore,
  waitScore,
  haversine,
  compatibility,
  getColdIschemiaLimit,
  ORGAN_COLD_ISCHEMIA_LIMITS
} = require("./matching");

test("ABO Blood Compatibility Matrix", async (t) => {
  await t.test("O- donor is universal to all recipient blood types", () => {
    const types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
    types.forEach(recipientBlood => {
      assert.equal(
        bloodCompatible({ bloodType: "O-" }, { bloodType: recipientBlood }),
        true,
        `O- should be compatible with ${recipientBlood}`
      );
    });
  });

  await t.test("AB+ recipient is universal receiver from all donor blood types", () => {
    const types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
    types.forEach(donorBlood => {
      assert.equal(
        bloodCompatible({ bloodType: donorBlood }, { bloodType: "AB+" }),
        true,
        `${donorBlood} should be compatible with AB+ recipient`
      );
    });
  });

  await t.test("Incompatible blood groups return false", () => {
    assert.equal(bloodCompatible({ bloodType: "A+" }, { bloodType: "B+" }), false);
    assert.equal(bloodCompatible({ bloodType: "B+" }, { bloodType: "A+" }), false);
    assert.equal(bloodCompatible({ bloodType: "AB+" }, { bloodType: "O+" }), false);
  });
});

test("HLA Matching Algorithm", async (t) => {
  await t.test("100% match when all antigens identical", () => {
    const score = hlaScore("A2 B7 DR4", "A2 B7 DR4");
    assert.equal(score, 100);
  });

  await t.test("Case and whitespace insensitive", () => {
    const score = hlaScore("a2, b7, dr4", "A2 B7 DR4");
    assert.equal(score, 100);
  });

  await t.test("Partial match returns proportional percentage", () => {
    const score = hlaScore("A2 B8 DR3", "A2 B7 DR4");
    assert.equal(score, 33);
  });

  await t.test("Zero match on complete antigen divergence", () => {
    const score = hlaScore("A1 B8 DR3", "A2 B7 DR4");
    assert.equal(score, 0);
  });
});

test("Urgency and Wait Time Scoring", async (t) => {
  await t.test("Clinical urgency ranks monotonically", () => {
    assert.equal(urgencyScore("Critical"), 100);
    assert.equal(urgencyScore("High"), 75);
    assert.equal(urgencyScore("Medium"), 50);
    assert.equal(urgencyScore("Low"), 25);
    assert.equal(urgencyScore("Unknown"), 0);
  });

  await t.test("Wait score caps at 100", () => {
    const oneYearAgo = new Date(Date.now() - 365 * 86400000);
    assert.equal(waitScore(oneYearAgo), 100);
  });
});

test("Geographic Proximity (Haversine Great-Circle Distance)", async (t) => {
  await t.test("Computes valid terrestrial distance between cities", () => {
    // Chennai to Bangalore ~290 km
    const chennai = { lat: 13.0827, lng: 80.2707 };
    const bangalore = { lat: 12.9716, lng: 77.5946 };
    const dist = haversine(chennai, bangalore);
    assert.ok(dist >= 280 && dist <= 310, `Expected ~290 km, got ${dist}`);
  });

  await t.test("Returns null gracefully for missing coordinates", () => {
    assert.equal(haversine(null, { lat: 12.0, lng: 80.0 }), null);
    assert.equal(haversine({}, {}), null);
  });
});

test("Organ-Specific Cold Ischemia Time Limits", async (t) => {
  await t.test("Assigns correct physiological limits per organ type", () => {
    assert.equal(getColdIschemiaLimit("Heart"), 240);
    assert.equal(getColdIschemiaLimit("Lung"), 360);
    assert.equal(getColdIschemiaLimit("Liver"), 720);
    assert.equal(getColdIschemiaLimit("Pancreas"), 720);
    assert.equal(getColdIschemiaLimit("Kidney"), 1440);
    assert.equal(getColdIschemiaLimit("Cornea"), 2880);
  });

  await t.test("Case-insensitive lookup with safe default fallback", () => {
    assert.equal(getColdIschemiaLimit("kidney"), 1440);
    assert.equal(getColdIschemiaLimit("HEART"), 240);
    assert.equal(getColdIschemiaLimit("liver "), 720);
    assert.equal(getColdIschemiaLimit("Unspecified"), 360);
    assert.equal(getColdIschemiaLimit(null), 360);
  });
});

test("End-to-End Compatibility Evaluation", async (t) => {
  const donor = {
    organType: "Kidney",
    bloodType: "O+",
    hlaTyping: "A2 B7 DR4",
    organSize: 8,
    location: { lat: 13.0827, lng: 80.2707 }
  };

  const recipientCompatible = {
    requiredOrgan: "Kidney",
    bloodType: "A+",
    hlaTyping: "A2 B7 DR4",
    organSize: 8,
    urgencyStatus: "Critical",
    createdAt: new Date(),
    location: { lat: 13.0475, lng: 80.2824 }
  };

  const recipientMismatchOrgan = {
    ...recipientCompatible,
    requiredOrgan: "Liver"
  };

  const recipientIncompatibleBlood = {
    ...recipientCompatible,
    bloodType: "B-"
  };

  await t.test("Valid match produces composite score and reasons breakdown", () => {
    const res = compatibility(donor, recipientCompatible);
    assert.equal(res.compatible, true);
    assert.ok(res.score >= 70, `Expected score >= 70, got ${res.score}`);
    assert.ok(Array.isArray(res.reasons) && res.reasons.length > 0);
  });

  await t.test("Organ mismatch fails immediately", () => {
    const res = compatibility(donor, recipientMismatchOrgan);
    assert.equal(res.compatible, false);
    assert.equal(res.score, 0);
    assert.ok(res.reasons.includes("Organ type mismatch"));
  });

  await t.test("Blood type incompatibility fails immediately", () => {
    const res = compatibility(donor, recipientIncompatibleBlood);
    assert.equal(res.compatible, false);
    assert.equal(res.score, 0);
    assert.ok(res.reasons.includes("Blood type incompatible"));
  });
});
