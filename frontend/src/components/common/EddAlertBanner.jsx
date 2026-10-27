import { useEffect, useState } from 'react';
import { beneficiaryApi } from '../../api/services';
import { dmy } from '../../utils/format';

export default function EddAlertBanner() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    beneficiaryApi.eddAlerts().then(setRows).catch(() => setRows([]));
  }, []);

  if (!rows.length) return null;

  return (
    <div className="no-print mb-3 border-2 border-red-800 bg-red-100 p-2 text-sm">
      <div className="font-bold uppercase">7-Day EDD Alert — ambulance readiness</div>
      <ul className="mt-1 list-disc pl-5">
        {rows.map((m) => (
          <li key={m._id}>
            <strong>{m.name}</strong> ({m.village}) EDD {dmy(m.edd)} · BG {m.bloodGroup} · Anemia {m.anemiaStatus} ·
            ASHA {m.assignedAsha?.name || '—'} {m.assignedAsha?.phone ? `☎ ${m.assignedAsha.phone}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
