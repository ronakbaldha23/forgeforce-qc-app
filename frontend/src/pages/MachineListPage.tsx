import { Link } from 'react-router-dom'
import { useMachines } from '../hooks/useMachines'

export function MachineListPage() {
  const { machines, isLoading, error } = useMachines()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Machines</h1>
      <p className="mt-1 text-sm text-slate-500">Select a machine to inspect or review its history.</p>

      {isLoading && <p className="mt-6 text-slate-500">Loading machines&hellip;</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {machines.map((machine) => (
          <Link
            key={machine.id}
            to={`/machines/${machine.id}`}
            className="flex min-h-[72px] flex-col justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm active:bg-slate-50"
          >
            <span className="text-lg font-medium text-slate-900">{machine.name}</span>
            <span className="text-sm text-slate-500">
              {machine.code} &middot; Serial {machine.serial_number} &middot; {machine.machine_type}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
