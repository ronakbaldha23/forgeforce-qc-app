import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useMachines } from '../hooks/useMachines'
import { Card } from '@/components/ui/card'

export function MachineListPage() {
  const { machines, isLoading, error } = useMachines()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Machines</h1>
      <p className="mt-1 text-sm text-muted-foreground">Select a machine to inspect or review its history.</p>

      {isLoading && (
        <p className="mt-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading machines&hellip;
        </p>
      )}
      {error && <p className="mt-6 text-destructive">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {machines.map((machine) => (
          <Link key={machine.id} to={`/machines/${machine.id}`} className="cursor-pointer">
            <Card className="min-h-[72px] justify-center px-5 py-3 shadow-sm transition-colors hover:bg-muted/50 active:bg-muted">
              <span className="text-lg font-medium text-foreground">{machine.name}</span>
              <span className="text-sm text-muted-foreground">
                {machine.code} &middot; Serial {machine.serial_number} &middot; {machine.machine_type}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
