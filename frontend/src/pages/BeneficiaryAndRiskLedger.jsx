import { useEffect, useMemo, useState } from 'react';
import { beneficiaryApi } from '../api/services';
import AddBeneficiaryModal from '../components/common/AddBeneficiaryModal';
import EddAlertBanner from '../components/common/EddAlertBanner';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { useAuth } from '../context/AuthContext';
import { dmy, downloadCsv, errMsg, riskClass, waLink } from '../utils/format';

export default function BeneficiaryAndRiskLedger() {
  const { user } = useAuth();
  const canRegister = ['ANM', 'MEDICAL_OFFICER'].includes(user?.role);
  const isMO = user?.role === 'MEDICAL_OFFICER';

  const [rows, setRows] = useState([]);
  const [watch, setWatch] = useState({ critical: [], dueDelivery: [], overdue: [] });
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [filters, setFilters] = useState({
    village: '',
    riskLevel: '',
    trimester: '',
    anemiaStatus: '',
    from: '',
    to: '',
  });
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [moNotes, setMoNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = async () => {
    setError('');
    try {
      const [list, w] = await Promise.all([
        beneficiaryApi.list({ q: dq, ...filters }),
        beneficiaryApi.watchlist(),
      ]);
      setRows(list);
      setWatch(w);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    load();
  }, [dq, filters.village, filters.riskLevel, filters.trimester, filters.anemiaStatus, filters.from, filters.to]);

  const openMother = async (id) => {
    const [b, tl] = await Promise.all([beneficiaryApi.get(id), beneficiaryApi.timeline(id)]);
    setSelected(b);
    setMoNotes(b?.notes || '');
    setTimeline(tl);
  };

  const saveMoNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    try {
      const updated = await beneficiaryApi.update(selected._id, { notes: moNotes });
      setSelected(updated);
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSavingNotes(false);
    }
  };

  const exportRegistry = () => {
    downloadCsv('high-risk-and-directory.csv', [
      ['Name', 'RCH', 'Phone', 'Village', 'ASHA', 'EDD', 'Risk', 'Anemia', 'Next Visit'],
      ...rows.map((r) => [
        r.name,
        r.rchId,
        r.phone,
        r.village,
        r.assignedAsha?.name,
        dmy(r.edd),
        r.currentRiskLevel,
        r.anemiaStatus,
        dmy(r.nextVisitDate),
      ]),
    ]);
  };

  const exportTimeline = () => {
    if (!selected) return;
    downloadCsv(`passbook-${selected.rchId}.csv`, [
      ['Date', 'Week', 'Hb', 'BP', 'Sugar', 'Weight', 'Risk', 'IFA', 'Poshan', 'Notes'],
      ...timeline.map((t) => [
        dmy(t.campDate),
        t.gestWeek,
        t.hb,
        `${t.bpSystolic}/${t.bpDiastolic}`,
        t.bloodSugar,
        t.weightKg,
        t.riskStatus,
        t.kitsGiven?.ifa,
        t.kitsGiven?.poshan,
        t.notes,
      ]),
    ]);
  };

  const grouped = useMemo(() => rows, [rows]);

  return (
    <div>
      <EddAlertBanner />
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-black">Mother Directory & High-Risk Watchlist</h1>
        <div className="flex gap-2">
          <button type="button" onClick={exportRegistry} className="border border-zinc-900 px-2 py-1 text-sm">
            Export Excel/CSV
          </button>
          {canRegister && (
            <button type="button" onClick={() => setShowAdd(true)} className="border border-zinc-900 bg-yellow-300 px-2 py-1 text-sm font-bold">
              Register New Mother
            </button>
          )}
        </div>
      </div>
      {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm">{error}</div>}
      <SearchFilterBar q={q} onQ={setQ} filters={filters} onFilter={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} />

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <WatchBox title="Critical High-Risk" items={watch.critical} onOpen={openMother} />
        <WatchBox title="Delivery in next 14 days" items={watch.dueDelivery} onOpen={openMother} extra={(m) => `EDD ${dmy(m.edd)}`} />
        <WatchBox title="Overdue follow-up" items={watch.overdue} onOpen={openMother} extra={(m) => `Due ${dmy(m.nextVisitDate)}`} />
      </div>

      <div className="border border-zinc-900 bg-white">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Mother</th>
              <th>RCH</th>
              <th>Phone</th>
              <th>Village</th>
              <th>ASHA</th>
              <th>LMP / EDD</th>
              <th>Trimester</th>
              <th>Risk</th>
              <th>Anemia</th>
              <th>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((m) => (
              <tr key={m._id} className="cursor-pointer hover:bg-yellow-50" onClick={() => openMother(m._id)}>
                <td className="font-semibold">{m.name}</td>
                <td>{m.rchId}</td>
                <td>{m.phone}</td>
                <td>{m.village}</td>
                <td>{m.assignedAsha?.name}</td>
                <td>
                  {dmy(m.lmpDate)} / {dmy(m.edd)}
                </td>
                <td>{m.trimester}</td>
                <td>
                  <span className={riskClass(m.currentRiskLevel)}>{m.currentRiskLevel}</span>
                </td>
                <td>{m.anemiaStatus}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Namaste ${m.name} ji, MatruKavach PHC follow-up reminder. Your EDD is ${dmy(m.edd)}. Please attend your upcoming camp checkup.`;
                      window.open(waLink(m.phone, msg), '_blank');
                    }}
                    className="border border-zinc-900 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 text-xs font-bold inline-flex items-center gap-1"
                    title="Send WhatsApp follow-up reminder"
                  >
                    📱 WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/50 p-6">
          <div className="w-full max-w-4xl border-2 border-zinc-900 bg-white p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black">{selected.name}</h2>
                <p className="text-sm">
                  {selected.rchId} · {selected.village} · BG {selected.bloodGroup} · EDD {dmy(selected.edd)}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="border border-zinc-900 px-2 py-1 text-sm" onClick={exportTimeline}>
                  Download Passbook CSV
                </button>
                <button type="button" className="border border-zinc-900 px-2 py-1 text-sm" onClick={() => window.print()}>
                  Print PDF
                </button>
                <button type="button" className="border border-zinc-900 px-2 py-1 text-sm" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Week</th>
                  <th>Hb</th>
                  <th>BP</th>
                  <th>Sugar</th>
                  <th>Weight</th>
                  <th>Risk</th>
                  <th>Kits</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((t) => (
                  <tr key={t._id}>
                    <td>{dmy(t.campDate)}</td>
                    <td>{t.gestWeek}</td>
                    <td>{t.hb}</td>
                    <td>
                      {t.bpSystolic}/{t.bpDiastolic}
                    </td>
                    <td>{t.bloodSugar}</td>
                    <td>{t.weightKg}</td>
                    <td>
                      <span className={riskClass(t.riskStatus)}>{t.riskStatus}</span>
                    </td>
                    <td>
                      IFA {t.kitsGiven?.ifa} / Poshan {t.kitsGiven?.poshan}
                    </td>
                    <td>{t.notes}</td>
                  </tr>
                ))}
                {!timeline.length && (
                  <tr>
                    <td colSpan={9}>No checkup history yet.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {isMO ? (
              <div className="my-3 border-2 border-zinc-900 bg-amber-50/70 p-3">
                <div className="mb-1 text-xs font-black uppercase text-zinc-900 flex items-center justify-between">
                  <span>🩺 Medical Officer Clinical Notes & Assessment</span>
                  <span className="text-[11px] font-bold text-zinc-700">Editable by MO</span>
                </div>
                <textarea
                  rows={3}
                  value={moNotes}
                  onChange={(e) => setMoNotes(e.target.value)}
                  placeholder="Enter clinical observations, risk factors, triage guidance, or referral instructions..."
                  className="w-full border border-zinc-800 p-2 text-xs font-mono bg-white"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={saveMoNotes}
                    className="border-2 border-zinc-900 bg-yellow-300 hover:bg-yellow-400 px-3 py-1 text-xs font-black uppercase"
                  >
                    {savingNotes ? 'Saving…' : 'Save Clinical Notes'}
                  </button>
                </div>
              </div>
            ) : (
              selected.notes && (
                <div className="my-3 border border-zinc-700 bg-zinc-50 p-2.5 text-xs">
                  <span className="font-bold">Doctor's Clinical Notes:</span> {selected.notes}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <AddBeneficiaryModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => load()} />
    </div>
  );
}

function WatchBox({ title, items, onOpen, extra }) {
  return (
    <div className="border border-zinc-900 bg-white p-2">
      <div className="mb-1 font-bold">
        {title} ({items.length})
      </div>
      <ul className="max-h-36 overflow-auto text-sm">
        {items.map((m) => (
          <li key={m._id}>
            <button type="button" className="text-left underline" onClick={() => onOpen(m._id)}>
              {m.name}
            </button>{' '}
            <span className="text-zinc-600">{extra ? extra(m) : m.village}</span>
          </li>
        ))}
        {!items.length && <li className="text-zinc-500">None</li>}
      </ul>
    </div>
  );
}
