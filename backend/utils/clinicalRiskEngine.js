const RISK = {
  CRITICAL: 'Critical High-Risk',
  MODERATE: 'Moderate',
  NORMAL: 'Normal',
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Rule-based maternal triage from portable diagnostics.
 * CRITICAL: Hb < 7.0 OR BP >= 140/90 OR Sugar >= 140
 * MODERATE: Hb 7.0–9.9 OR BP 130/85–139/89
 * NORMAL: otherwise
 */
function calculateMaternalRisk({ hb, bpSystolic, bpDiastolic, bloodSugar }) {
  const hemoglobin = toNumber(hb, null);
  const sys = toNumber(bpSystolic, null);
  const dia = toNumber(bpDiastolic, null);
  const sugar = toNumber(bloodSugar, null);

  const severeAnemia = hemoglobin !== null && hemoglobin < 7;
  const preEclampsia = (sys !== null && sys >= 140) || (dia !== null && dia >= 90);
  const gdmRisk = sugar !== null && sugar >= 140;

  if (severeAnemia || preEclampsia || gdmRisk) {
    return RISK.CRITICAL;
  }

  const moderateAnemia = hemoglobin !== null && hemoglobin >= 7 && hemoglobin <= 9.9;
  const elevatedBp =
    (sys !== null && sys >= 130 && sys <= 139) || (dia !== null && dia >= 85 && dia <= 89);

  if (moderateAnemia || elevatedBp) {
    return RISK.MODERATE;
  }

  return RISK.NORMAL;
}

function suggestedNextVisitDays(riskStatus) {
  if (riskStatus === RISK.CRITICAL) return 7;
  if (riskStatus === RISK.MODERATE) return 15;
  return 30;
}

function classifyAnemia(hb) {
  const hemoglobin = toNumber(hb, null);
  if (hemoglobin === null) return 'Unknown';
  if (hemoglobin < 7) return 'Severe';
  if (hemoglobin <= 9.9) return 'Moderate';
  if (hemoglobin <= 10.9) return 'Mild';
  return 'None';
}

function riskFlags({ hb, bpSystolic, bpDiastolic, bloodSugar }) {
  const hemoglobin = toNumber(hb, null);
  const sys = toNumber(bpSystolic, null);
  const dia = toNumber(bpDiastolic, null);
  const sugar = toNumber(bloodSugar, null);
  return {
    severeAnemia: hemoglobin !== null && hemoglobin < 7,
    preEclampsia: (sys !== null && sys >= 140) || (dia !== null && dia >= 90),
    gestationalDiabetes: sugar !== null && sugar >= 140,
  };
}

module.exports = {
  RISK,
  calculateMaternalRisk,
  suggestedNextVisitDays,
  classifyAnemia,
  riskFlags,
};
