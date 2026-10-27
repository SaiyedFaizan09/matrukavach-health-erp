import { useEffect, useState } from 'react';
import { reportApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { downloadCsv, errMsg } from '../utils/format';

export default function MonthlyHealthReport() {
  const { user } = useAuth();
  const isANM = user?.role === 'ANM';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [village, setVillage] = useState(isANM ? (user?.village || 'Rampur') : '');
  const [villages, setVillages] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    reportApi.villages().then(setVillages).catch(() => { });
  }, []);

  useEffect(() => {
    setError('');
    reportApi
      .monthly({ year, month, village })
      .then(setReport)
      .catch((err) => setError(errMsg(err)));
  }, [year, month, village]);

  const exportCsv = () => {
    if (!report) return;
    downloadCsv(`monthly-${year}-${month}.csv`, [
      [
        'Date',
        'Kits Received',
        'Strips Received',
        'Mothers Screened',
        'Moderate',
        'Critical',
        'Severe Anemia',
        'Pre-Eclampsia',
        'Kits Distributed',
        'Referrals',
        'Closing Stock',
      ],
      ...report.days.map((d) => [
        d.date,
        d.kitsReceived,
        d.stripsReceived,
        d.mothersScreened,
        d.moderateRisk,
        d.criticalRisk,
        d.severeAnemia,
        d.preEclampsia,
        d.kitsDistributed,
        d.emergencyReferrals,
        d.closingKitStock,
      ]),
      [
        'MONTHLY TOTAL',
        report.totals.kitsReceived,
        report.totals.stripsReceived,
        report.totals.mothersScreened,
        report.totals.moderateRisk,
        report.totals.criticalRisk,
        report.totals.severeAnemia,
        report.totals.preEclampsia,
        report.totals.kitsDistributed,
        report.totals.emergencyReferrals,
        '',
      ],
    ]);
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-lg font-black">Block Monthly Consolidation</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <label className="font-bold">
            Month
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="ml-1 border border-zinc-700 px-2 py-1 font-normal">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label className="font-bold">
            Year
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="ml-1 w-24 border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-bold">
            Village {isANM && <span className="text-[10px] text-zinc-500 font-normal">(Locked to Sub-Center)</span>}
            <select
              disabled={isANM}
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="ml-1 border border-zinc-700 px-2 py-1 font-normal disabled:bg-zinc-100"
            >
              {!isANM && <option value="">All Villages</option>}
              {villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={exportCsv} className="border border-zinc-900 px-2 py-1">
            Export CSV
          </button>
        </div>
      </div>
      {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm">{error}</div>}
      {!report ? (
        <div>Loading report…</div>
      ) : (
        <div className="overflow-x-auto border border-zinc-900 bg-white">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Suppl. Kits Recd</th>
                <th>Diag. Strips Recd</th>
                <th>Mothers</th>
                <th>Moderate</th>
                <th>Critical</th>
                <th>Hb&lt;7</th>
                <th>Pre-Eclampsia</th>
                <th>Kits Dist.</th>
                <th>Referrals</th>
                <th>Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              {report.days.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.kitsReceived}</td>
                  <td>{d.stripsReceived}</td>
                  <td>{d.mothersScreened}</td>
                  <td>{d.moderateRisk}</td>
                  <td>{d.criticalRisk}</td>
                  <td>{d.severeAnemia}</td>
                  <td>{d.preEclampsia}</td>
                  <td>{d.kitsDistributed}</td>
                  <td>{d.emergencyReferrals}</td>
                  <td>{d.closingKitStock}</td>
                </tr>
              ))}
              <tr className="row-yellow">
                <td>MONTHLY TOTAL</td>
                <td>{report.totals.kitsReceived}</td>
                <td>{report.totals.stripsReceived}</td>
                <td>{report.totals.mothersScreened}</td>
                <td>{report.totals.moderateRisk}</td>
                <td>{report.totals.criticalRisk}</td>
                <td>{report.totals.severeAnemia}</td>
                <td>{report.totals.preEclampsia}</td>
                <td>{report.totals.kitsDistributed}</td>
                <td>{report.totals.emergencyReferrals}</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <div className="border-t border-zinc-900 p-2 text-sm font-bold">
            Community average Hb this month: {report.totals.avgHb} g/dL
          </div>
        </div>
      )}
    </div>
  );
}
