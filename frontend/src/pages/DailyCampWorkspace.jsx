import { useEffect, useMemo, useState } from 'react';
import { beneficiaryApi, campApi, reportApi } from '../api/services';
import AddBeneficiaryModal from '../components/common/AddBeneficiaryModal';
import EddAlertBanner from '../components/common/EddAlertBanner';
import { useAuth } from '../context/AuthContext';
import {
  KIT_KEYS,
  buildHealthCardText,
  dmy,
  downloadCsv,
  errMsg,
  inflowSum,
  num,
  riskClass,
  waLink,
  ymd,
} from '../utils/format';

const EMPTY_SCREEN = {
  beneficiary: '',
  gestWeek: 20,
  hb: '',
  bpSystolic: '',
  bpDiastolic: '',
  bloodSugar: '',
  weightKg: '',
  kitsGiven: { ifa: 1, calcium: 0, poshan: 0, hbStrips: 1 },
};

function liveRisk(row) {
  const hb = Number(row.hb);
  const sys = Number(row.bpSystolic);
  const dia = Number(row.bpDiastolic);
  const sugar = Number(row.bloodSugar);
  if ((Number.isFinite(hb) && hb < 7) || sys >= 140 || dia >= 90 || sugar >= 140) return 'Critical High-Risk';
  if ((Number.isFinite(hb) && hb >= 7 && hb <= 9.9) || (sys >= 130 && sys <= 139) || (dia >= 85 && dia <= 89)) {
    return 'Moderate';
  }
  return 'Normal';
}

function nextDays(risk) {
  if (risk === 'Critical High-Risk') return 7;
  if (risk === 'Moderate') return 15;
  return 30;
}

function formatRisk(status) {
  if (status === 'Critical High-Risk') return 'Critical';
  return status;
}

export default function DailyCampWorkspace() {
  const { user } = useAuth();
  const [date, setDate] = useState(ymd(new Date()));
  const [village, setVillage] = useState('Rampur');
  const [villages, setVillages] = useState(['Rampur']);
  const [sheet, setSheet] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [mothers, setMothers] = useState([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(EMPTY_SCREEN);
  const [showAdd, setShowAdd] = useState(false);
  const [printRow, setPrintRow] = useState(null);
  const [q, setQ] = useState('');

  const load = async (d = date, v = village) => {
    setError('');
    try {
      const data = await campApi.getSheet({ date: d, village: v });
      setSheet(data.sheet);
      setScreenings(data.screenings);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    reportApi.villages().then(setVillages).catch(() => { });
    beneficiaryApi.list({}).then(setMothers).catch(() => { });
  }, []);

  useEffect(() => {
    load();
  }, [date, village]);

  const isMO = user?.role === 'MEDICAL_OFFICER';
  const isBlockAdmin = user?.role === 'BLOCK_ADMIN';
  const isANM = user?.role === 'ANM';

  const locked = !!sheet?.locked;
  const canEdit = (isANM || isMO) && !locked;
  const canLock = isMO && !locked;
  const canEmergencyUnlock = isBlockAdmin && locked;

  const persistSheet = async (next) => {
    if (!sheet || !canEdit) return;
    try {
      const saved = await campApi.updateSheet(sheet._id, { stock: next.stock });
      setSheet(saved);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const setStockField = (key, field, value) => {
    if (!canEdit) return;
    const next = {
      ...sheet,
      stock: { ...sheet.stock, [key]: { ...sheet.stock[key], [field]: value } },
    };
    setSheet(next);
  };

  const setSingleInflow = (key, field, value) => {
    if (!canEdit) return;
    const currentInflows = sheet.stock[key]?.inflows || [];
    const first = currentInflows[0] || { batchNo: '', supplier: '', quantity: 0 };
    const updated = {
      ...first,
      [field]: field === 'quantity' ? (value === '' ? '' : Number(value)) : value,
      ...(field === 'batchNo' ? { supplier: value } : {}),
    };
    const next = {
      ...sheet,
      stock: {
        ...sheet.stock,
        [key]: {
          ...sheet.stock[key],
          inflows: [updated],
        },
      },
    };
    setSheet(next);
  };

  const carry = async () => {
    if (!canEdit) return;
    try {
      await campApi.carryForward({ date, village });
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const lockDay = async () => {
    if (!canLock) return;
    if (!window.confirm('Lock this camp sheet? It cannot be edited afterwards.')) return;
    try {
      const saved = await campApi.lock(sheet._id);
      setSheet(saved);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const unlockDay = async () => {
    if (!canEmergencyUnlock) return;
    if (!window.confirm('Emergency Unlock this camp sheet for audit editing?')) return;
    try {
      const saved = await campApi.unlock(sheet._id);
      setSheet(saved);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const addScreening = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!draft.beneficiary) return;
    try {
      const created = await campApi.createScreening({
        campSheet: sheet._id,
        ...draft,
        hb: draft.hb === '' ? null : Number(draft.hb),
        bpSystolic: draft.bpSystolic === '' ? null : Number(draft.bpSystolic),
        bpDiastolic: draft.bpDiastolic === '' ? null : Number(draft.bpDiastolic),
        bloodSugar: draft.bloodSugar === '' ? null : Number(draft.bloodSugar),
        weightKg: draft.weightKg === '' ? null : Number(draft.weightKg),
      });
      setScreenings((rows) => [...rows, created]);
      setDraft(EMPTY_SCREEN);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const patchRow = async (id, payload) => {
    try {
      const updated = await campApi.updateScreening(id, payload);
      setScreenings((rows) => rows.map((r) => (r._id === id ? updated : r)));
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeRow = async (id) => {
    if (!window.confirm('Delete this screening row?')) return;
    try {
      await campApi.deleteScreening(id);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const sendCard = async (row) => {
    const mother = row.beneficiary;
    const url = waLink(mother?.phone, buildHealthCardText(row, mother));
    window.open(url, '_blank');
    try {
      await campApi.sendCard(row._id);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const filtered = useMemo(() => {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (!q) return screenings;
    return screenings.filter(
      (r) =>
        rx.test(r.beneficiary?.name || '') ||
        rx.test(r.beneficiary?.rchId || '') ||
        rx.test(r.beneficiary?.phone || '') ||
        rx.test(r.village || '')
    );
  }, [screenings, q]);

  const summary = useMemo(() => {
    const hbVals = filtered.map((s) => Number(s.hb)).filter((n) => n > 0);
    return {
      total: filtered.length,
      high: filtered.filter((s) => s.riskStatus !== 'Normal').length,
      avgHb: hbVals.length ? (hbVals.reduce((a, b) => a + b, 0) / hbVals.length).toFixed(2) : '0.00',
      kits: filtered.reduce(
        (s, r) =>
          s +
          num(r.kitsGiven?.ifa) +
          num(r.kitsGiven?.calcium) +
          num(r.kitsGiven?.poshan),
        0
      ),
    };
  }, [filtered]);

  const exportSheet = () => {
    const rows = [
      [
        'Token',
        'Mother',
        'RCH',
        'Week',
        'Hb',
        'BP',
        'Sugar',
        'Weight',
        'Risk',
        'IFA',
        'Calcium',
        'Poshan',
        'Next Visit',
        'Card',
      ],
      ...filtered.map((r) => [
        r.tokenNo,
        r.beneficiary?.name,
        r.beneficiary?.rchId,
        r.gestWeek,
        r.hb,
        `${r.bpSystolic}/${r.bpDiastolic}`,
        r.bloodSugar,
        r.weightKg,
        r.riskStatus,
        r.kitsGiven?.ifa,
        r.kitsGiven?.calcium,
        r.kitsGiven?.poshan,
        dmy(r.nextVisitDate),
        r.healthCardSent ? 'Sent' : 'Pending',
      ]),
    ];
    downloadCsv(`camp-${village}-${date}.csv`, rows);
  };

  const draftRisk = liveRisk(draft);

  if (!sheet) {
    return <div className="p-4">{error || 'Loading camp sheet…'}</div>;
  }

  return (
    <div>
      <EddAlertBanner />
      <div className="mb-3 flex flex-wrap items-end gap-2 border-2 border-zinc-900 bg-white p-2.5">
        <label className="text-xs font-bold">
          Camp Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 border border-zinc-700 px-2 py-1 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-bold">
          Village / Camp
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className="ml-2 border border-zinc-700 px-2 py-1 text-sm font-normal"
          >
            {villages.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button
          disabled={!canEdit}
          type="button"
          onClick={carry}
          className="border border-zinc-900 bg-zinc-100 px-2 py-1 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50"
        >
          Carry Forward Previous Day Stock
        </button>
        <button
          type="button"
          onClick={exportSheet}
          className="border border-zinc-900 bg-zinc-100 px-2 py-1 text-sm font-semibold hover:bg-zinc-200"
        >
          Export CSV
        </button>
        {canLock && (
          <button
            type="button"
            onClick={lockDay}
            className="border border-zinc-900 bg-red-200 px-2 py-1 text-sm font-bold hover:bg-red-300"
          >
            Day-End Lock
          </button>
        )}
        {canEmergencyUnlock && (
          <button
            type="button"
            onClick={unlockDay}
            className="border-2 border-zinc-900 bg-amber-300 px-2 py-1 text-sm font-bold text-zinc-950 hover:bg-amber-400"
          >
            Emergency Unlock
          </button>
        )}
        {locked && <span className="badge badge-critical">LOCKED</span>}
        <span className="ml-auto text-sm font-bold">
          {dmy(date)} · {village}
        </span>
      </div>
      {error && <div className="mb-3 border-2 border-red-800 bg-red-100 px-3 py-1.5 text-sm font-bold text-red-900">{error}</div>}

      <div className="flex flex-col gap-3 w-full">
        {/* Top Section (100% Width): Portable Diagnostics & Supplement Stock */}
        <section className="border-2 border-zinc-900 bg-white p-3 w-full">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-zinc-900"></span>
              Portable Diagnostics & Supplement Stock
            </h3>
            <span className="text-xs text-zinc-600 font-medium">
              Auto-calculates closing stock from inflows, dispatch & damaged count
            </span>
          </div>
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="w-52">Item / Diagnostics</th>
                <th className="w-28 text-center">Old Stock</th>
                <th className="min-w-[280px]">New Inflow (District Store) [Qty · Source/Batch]</th>
                <th className="w-24 text-center">Gross Total</th>
                <th className="w-24 text-center">Dispatched</th>
                <th className="w-28 text-center">Before Wastage</th>
                <th className="w-24 text-center">Damaged</th>
                <th className="w-28 text-center">Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {KIT_KEYS.map(({ key, label }) => {
                const line = sheet.stock[key] || {};
                const gross = num(line.oldStock) + inflowSum(line);
                const remaining = gross - num(line.dispatched);
                const closing = remaining - num(line.damaged);
                const primaryInflow = line.inflows?.[0] || { quantity: 0, batchNo: '', supplier: '' };
                return (
                  <tr key={key}>
                    <td className="font-bold text-zinc-900">{label}</td>
                    <td>
                      <input
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        value={line.oldStock ?? 0}
                        onChange={(e) => setStockField(key, 'oldStock', Number(e.target.value))}
                        onBlur={() => persistSheet(sheet)}
                        className="font-mono text-center disabled:bg-zinc-100"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <input
                          disabled={!canEdit}
                          type="number"
                          min="0"
                          placeholder="Qty"
                          value={primaryInflow.quantity ?? ''}
                          onChange={(e) => setSingleInflow(key, 'quantity', e.target.value)}
                          onBlur={() => persistSheet(sheet)}
                          className="w-24 font-mono text-center font-bold disabled:bg-zinc-100"
                          title="Inflow Quantity"
                        />
                        <input
                          disabled={!canEdit}
                          type="text"
                          placeholder="Source / Batch No."
                          value={primaryInflow.batchNo || primaryInflow.supplier || ''}
                          onChange={(e) => setSingleInflow(key, 'batchNo', e.target.value)}
                          onBlur={() => persistSheet(sheet)}
                          className="flex-1 min-w-[150px] disabled:bg-zinc-100"
                          title="District Store Source or Batch Number"
                        />
                      </div>
                    </td>
                    <td className="text-center font-mono font-bold bg-zinc-50">{gross}</td>
                    <td className="text-center font-mono">{line.dispatched || 0}</td>
                    <td className="text-center font-mono bg-zinc-50">{remaining}</td>
                    <td>
                      <input
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        value={line.damaged ?? 0}
                        onChange={(e) => setStockField(key, 'damaged', Number(e.target.value))}
                        onBlur={() => persistSheet(sheet)}
                        className="font-mono text-center text-red-700 disabled:bg-zinc-100"
                      />
                    </td>
                    <td className="text-center font-mono font-bold row-yellow">{closing}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Bottom Section (100% Width): Daily Maternal Screening Grid */}
        <section className="border-2 border-zinc-900 bg-white p-3 w-full">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-zinc-900"></span>
                Daily Maternal Screening Grid
              </h3>
              <span className="text-xs bg-zinc-200 border border-zinc-700 px-2 py-0.5 font-bold">
                {filtered.length} Mothers Screened
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search mother / RCH / phone / village…"
                className="w-72 border border-zinc-700 px-2 py-1 text-xs"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="border border-zinc-700 bg-zinc-100 px-1.5 py-1 text-xs font-semibold hover:bg-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th className="w-14 text-center">Token</th>
                  <th className="min-w-[200px]">Mother Name / RCH ID</th>
                  <th className="w-16 text-center">Gest. Wk</th>
                  <th className="w-20 text-center">Hb (g/dL)</th>
                  <th className="w-28 text-center">BP (mmHg)</th>
                  <th className="w-20 text-center">Sugar (mg/dL)</th>
                  <th className="w-16 text-center">Wt (kg)</th>
                  <th className="w-28 text-center">Risk Badge</th>
                  <th className="w-14 text-center" title="IFA Iron Strips">IFA</th>
                  <th className="w-14 text-center" title="Calcium Packets">Calcium</th>
                  <th className="w-14 text-center" title="Poshan Nutrition Kits">Poshan</th>
                  <th className="w-24 text-center">Next Visit</th>
                  <th className="w-32 text-center">WhatsApp Card</th>
                  <th className="w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Fast Keyboard Data Entry Row */}
                {!locked && canEdit && (
                  <tr className="bg-amber-50/70 border-b-2 border-zinc-900 font-medium">
                    <td className="text-center font-bold text-zinc-600 bg-amber-100/50">
                      #{screenings.length + 1}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <select
                          value={draft.beneficiary}
                          onChange={(e) => setDraft({ ...draft, beneficiary: e.target.value })}
                          className="flex-1 font-medium"
                        >
                          <option value="">Select registered mother…</option>
                          {mothers.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} · {m.rchId} ({m.village})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="shrink-0 border border-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-1 text-[11px] font-bold whitespace-nowrap"
                          onClick={() => setShowAdd(true)}
                          title="Register new mother modal"
                        >
                          + New
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="42"
                        value={draft.gestWeek}
                        onChange={(e) => setDraft({ ...draft, gestWeek: Number(e.target.value) })}
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        min="2"
                        max="20"
                        placeholder="g/dL"
                        value={draft.hb}
                        onChange={(e) => setDraft({ ...draft, hb: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono font-bold"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          placeholder="Sys"
                          value={draft.bpSystolic}
                          onChange={(e) => setDraft({ ...draft, bpSystolic: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                          className="text-center font-mono"
                        />
                        <span className="text-zinc-500 font-bold">/</span>
                        <input
                          type="number"
                          placeholder="Dia"
                          value={draft.bpDiastolic}
                          onChange={(e) => setDraft({ ...draft, bpDiastolic: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                          className="text-center font-mono"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="Sugar"
                        value={draft.bloodSugar}
                        onChange={(e) => setDraft({ ...draft, bloodSugar: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Kg"
                        value={draft.weightKg}
                        onChange={(e) => setDraft({ ...draft, weightKg: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td className="text-center">
                      <span className={riskClass(draftRisk)}>{formatRisk(draftRisk)}</span>
                      <div className="text-[10px] text-zinc-600 font-medium">{nextDays(draftRisk)} days</div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={draft.kitsGiven.ifa}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            kitsGiven: { ...draft.kitsGiven, ifa: Number(e.target.value) },
                          })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={draft.kitsGiven.calcium}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            kitsGiven: { ...draft.kitsGiven, calcium: Number(e.target.value) },
                          })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={draft.kitsGiven.poshan}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            kitsGiven: { ...draft.kitsGiven, poshan: Number(e.target.value) },
                          })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addScreening(e)}
                        className="text-center font-mono"
                      />
                    </td>
                    <td className="text-center font-mono text-xs">
                      +{nextDays(draftRisk)}d
                    </td>
                    <td className="text-center text-[11px] text-zinc-500 italic">
                      Auto-link
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={addScreening}
                        className="border-2 border-zinc-900 bg-yellow-300 hover:bg-yellow-400 px-3 py-1 text-xs font-black uppercase whitespace-nowrap shadow-sm"
                        title="Save screening record"
                      >
                        + Add
                      </button>
                    </td>
                  </tr>
                )}

                {/* Screened Beneficiary Rows */}
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-50">
                    <td className="text-center font-bold font-mono">{r.tokenNo}</td>
                    <td>
                      <div className="font-bold text-zinc-900">{r.beneficiary?.name}</div>
                      <div className="text-[10px] text-zinc-600 font-mono">
                        RCH: {r.beneficiary?.rchId || '—'} · 📞 {r.beneficiary?.phone || '—'}
                      </div>
                    </td>
                    <td className="text-center font-mono">{r.gestWeek} wk</td>
                    <td className="text-center font-mono font-bold">{r.hb ?? '—'}</td>
                    <td className="text-center font-mono">
                      {r.bpSystolic && r.bpDiastolic ? `${r.bpSystolic}/${r.bpDiastolic}` : '—'}
                    </td>
                    <td className="text-center font-mono">{r.bloodSugar ?? '—'}</td>
                    <td className="text-center font-mono">{r.weightKg ?? '—'}</td>
                    <td className="text-center">
                      <span className={riskClass(r.riskStatus)}>{formatRisk(r.riskStatus)}</span>
                    </td>
                    <td className="text-center font-mono">{r.kitsGiven?.ifa ?? 0}</td>
                    <td className="text-center font-mono">{r.kitsGiven?.calcium ?? 0}</td>
                    <td className="text-center font-mono">{r.kitsGiven?.poshan ?? 0}</td>
                    <td className="text-center font-mono text-xs">
                      <div>{r.nextVisitDays}d</div>
                      <div className="text-[10px] text-zinc-500">{dmy(r.nextVisitDate)}</div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          className="border border-zinc-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 text-xs font-bold inline-flex items-center gap-1"
                          onClick={() => sendCard(r)}
                          title="Open WhatsApp health card preview"
                        >
                          📱 WhatsApp
                        </button>
                        <span className={r.healthCardSent ? 'badge badge-normal' : 'badge badge-moderate'}>
                          {r.healthCardSent ? 'Sent' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="border border-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 text-xs font-medium"
                          onClick={() => setPrintRow(r)}
                          title="Print 80mm thermal slip"
                        >
                          Slip
                        </button>
                        {!locked && canEdit && (
                          <button
                            type="button"
                            className="border border-red-800 bg-red-50 text-red-700 hover:bg-red-100 px-1.5 py-0.5 text-xs font-medium"
                            onClick={() => removeRow(r._id)}
                            title="Delete this screening"
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={14} className="text-center py-6 text-zinc-500 italic">
                      No screening records found for this camp date and village.
                    </td>
                  </tr>
                )}

                {/* Summary Row */}
                <tr className="row-yellow">
                  <td colSpan={14} className="py-2 px-3 text-xs font-bold text-zinc-900">
                    Total Screened: {summary.total} &nbsp;|&nbsp; High-Risk / Critical: {summary.high} &nbsp;|&nbsp; Avg Hb: {summary.avgHb} g/dL &nbsp;|&nbsp; Kits Dispatched: {summary.kits}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <AddBeneficiaryModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        defaults={{ village }}
        onCreated={(m) => {
          setMothers((list) => [...list, m]);
          setDraft((d) => ({ ...d, beneficiary: m._id }));
        }}
      />

      {printRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="print-slip w-[80mm] border-2 border-zinc-900 bg-white p-3 text-xs">
            <div className="text-center font-black">MatruKavach · PHC Appointment Slip</div>
            <hr className="my-2 border-zinc-900" />
            <div>Date: {dmy(printRow.campDate)}</div>
            <div>Name: {printRow.beneficiary?.name}</div>
            <div>RCH: {printRow.beneficiary?.rchId}</div>
            <div>Hb: {printRow.hb} · BP: {printRow.bpSystolic}/{printRow.bpDiastolic}</div>
            <div>Risk: {formatRisk(printRow.riskStatus)}</div>
            <div>Next visit: {dmy(printRow.nextVisitDate)}</div>
            <div className="mt-2">80mm thermal slip · keep for ASHA visit</div>
            <div className="no-print mt-3 flex gap-2">
              <button type="button" className="border border-zinc-900 px-2 py-1" onClick={() => window.print()}>
                Print
              </button>
              <button type="button" className="border border-zinc-900 px-2 py-1" onClick={() => setPrintRow(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
