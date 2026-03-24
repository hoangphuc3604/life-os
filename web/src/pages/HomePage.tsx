import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-h)]">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">Filter</Button>
          <Button variant="secondary" size="sm">Today</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--accent)]" />
              <span className="font-medium text-[var(--text-h)]">To Do</span>
              <span className="text-sm text-[var(--text)]">0</span>
            </div>
            <p className="text-sm text-[var(--text)]">No tasks yet. Add one to get started.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">+</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-orange-400" />
              <span className="font-medium text-[var(--text-h)]">On Progress</span>
              <span className="text-sm text-[var(--text)]">0</span>
            </div>
            <p className="text-sm text-[var(--text)]">Tasks in progress appear here.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">+</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              <span className="font-medium text-[var(--text-h)]">Done</span>
              <span className="text-sm text-[var(--text)]">0</span>
            </div>
            <p className="text-sm text-[var(--text)]">Completed tasks.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">+</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
