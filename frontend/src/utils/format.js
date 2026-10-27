export function ymd(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dmy(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}-${m}-${d.getFullYear()}`;
}

export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function errMsg(err, fallback = 'Request failed') {
  return err?.response?.data?.message || err?.message || fallback;
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = cell === null || cell === undefined ? '' : String(cell);
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function riskClass(status) {
  if (status === 'Critical High-Risk' || status === 'Critical') return 'badge badge-critical';
  if (status === 'Moderate') return 'badge badge-moderate';
  return 'badge badge-normal';
}

export function buildHealthCardText(row, mother) {
  const date = dmy(row.campDate);
  const bp = row.bpSystolic && row.bpDiastolic ? `${row.bpSystolic}/${row.bpDiastolic}` : '-';
  const kits =
    num(row.kitsGiven?.ifa) + num(row.kitsGiven?.calcium) + num(row.kitsGiven?.poshan);
  return `*માતૃકવચ - PHC આરોગ્ય કાર્ડ (MatruKavach)*
તારીખ (Date): ${date}

નામ (Name): ${mother?.name || ''}
ગર્ભાવસ્થા સપ્તાહ (Week): ${row.gestWeek ?? ''}
હિમોગ્લોબિન (Hb): ${row.hb ?? ''} g/dL
બ્લડ પ્રેશર (BP): ${bp}
વજન (Weight): ${row.weightKg ?? ''} Kg
જોખમ સ્થિતિ (Risk Status): ${row.riskStatus || ''}
આપેલ આયરન/પોષણ કીટ: ${kits}
ફરી તપાસની તારીખ (Next Visit): ${dmy(row.nextVisitDate)}`;
}

export function waLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.length === 10 ? digits : digits.slice(-10);
  return `https://wa.me/91${local}?text=${encodeURIComponent(text)}`;
}

export const KIT_KEYS = [
  { key: 'ifa', label: 'IFA Iron Strips' },
  { key: 'calcium', label: 'Calcium Packets' },
  { key: 'poshan', label: 'Poshan Nutrition Kits' },
  { key: 'hbStrips', label: 'Hb Test Strips' },
];

export function inflowSum(line) {
  return (line?.inflows || []).reduce((s, r) => s + num(r.quantity), 0);
}
