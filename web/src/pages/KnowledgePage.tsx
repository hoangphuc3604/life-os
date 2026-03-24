import { KnowledgeLayout } from '@/components/knowledge/KnowledgeLayout'
import { SearchModal } from '@/components/knowledge/SearchModal'

export function KnowledgePage() {
  return (
    <div className="flex h-[calc(100svh-56px)]">
      <KnowledgeLayout />
      <SearchModal />
    </div>
  )
}
