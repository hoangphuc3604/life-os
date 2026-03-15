import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/useKnowledge';
import { useKnowledgeStore } from '@/stores/knowledge.store';
import { Search, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SearchModal = () => {
  const { searchOpen, setSearchOpen, setSelectedNote, setSelectedFolder } = useKnowledgeStore();
  const { query, setQuery, results, isSearching } = useSearch();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);
  
  const handleSelect = (noteId: string) => {
    setSelectedNote(noteId);
    setSelectedFolder(null);
    setSearchOpen(false);
    setQuery('');
  };
  
  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          )}
          
          {!isSearching && query && (!results || results.length === 0) && (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
          
          {!isSearching && results?.map((result) => (
            <div
              key={result.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer"
              onClick={() => handleSelect(result.id)}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {result.icon} {result.title}
                </div>
                {result.highlight && (
                  <div 
                    className="text-sm text-muted-foreground truncate"
                    dangerouslySetInnerHTML={{ __html: result.highlight }}
                  />
                )}
              </div>
            </div>
          ))}
          
          {!query && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Type to search your notes...
            </div>
          )}
        </div>
        
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
          <span>Press ⌘K to open</span>
          <span>↑↓ to navigate, ↵ to select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
