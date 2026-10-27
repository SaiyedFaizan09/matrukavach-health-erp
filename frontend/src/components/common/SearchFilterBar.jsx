export default function SearchFilterBar({
  q,
  onQ,
  searchPlaceholder = 'Search name, RCH ID, phone, village, ASHA, vehicle…',
  filters = {},
  onFilter,
  extra,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-2 border border-zinc-900 bg-white p-2">
      <label className="flex min-w-[220px] flex-1 flex-col text-xs font-bold">
        Search
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
        />
      </label>
      {filters.date !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          Date
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) => onFilter('date', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          />
        </label>
      )}
      {filters.from !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          From
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => onFilter('from', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          />
        </label>
      )}
      {filters.to !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          To
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => onFilter('to', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          />
        </label>
      )}
      {filters.riskLevel !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          Risk
          <select
            value={filters.riskLevel}
            onChange={(e) => onFilter('riskLevel', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          >
            <option value="">All</option>
            <option value="Normal">Normal</option>
            <option value="Moderate">Moderate</option>
            <option value="Critical High-Risk">Critical High-Risk</option>
          </select>
        </label>
      )}
      {filters.trimester !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          Trimester
          <select
            value={filters.trimester}
            onChange={(e) => onFilter('trimester', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          >
            <option value="">All</option>
            <option value="1st">1st</option>
            <option value="2nd">2nd</option>
            <option value="3rd">3rd</option>
          </select>
        </label>
      )}
      {filters.anemiaStatus !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          Anemia
          <select
            value={filters.anemiaStatus}
            onChange={(e) => onFilter('anemiaStatus', e.target.value)}
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          >
            <option value="">All</option>
            <option value="None">None</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe</option>
          </select>
        </label>
      )}
      {filters.village !== undefined && (
        <label className="flex flex-col text-xs font-bold">
          Village / Sub-Center
          <input
            value={filters.village}
            onChange={(e) => onFilter('village', e.target.value)}
            list="village-options"
            className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal"
          />
        </label>
      )}
      {extra}
    </div>
  );
}
