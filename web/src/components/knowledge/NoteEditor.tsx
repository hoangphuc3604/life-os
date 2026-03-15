import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect, useCallback } from 'react';
import { useNote } from '@/hooks/useKnowledge';
import { useKnowledgeStore } from '@/stores/knowledge.store';
import { cn } from '@/lib/utils';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, CheckSquare, Quote, Heading1, Heading2, Heading3, Image as ImageIcon, Link as LinkIcon, Undo, Redo, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const lowlight = createLowlight(common);

interface NoteEditorProps {
  noteId: string;
}

export const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { note, isLoading, updateNote, updateBlock, createBlock, deleteBlock } = useNote(noteId);
  const { setSearchOpen } = useKnowledgeStore();
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
    },
  });
  
  useEffect(() => {
    if (editor && note?.blocks) {
      const blocksHtml = note.blocks.map(block => {
        switch (block.type) {
          case 'paragraph':
            return `<p>${block.content?.text || ''}</p>`;
          case 'heading':
            return `<h${block.content?.level || 1}>${block.content?.text || ''}</h${block.content?.level || 1}>`;
          case 'code':
            return `<pre><code>${block.content?.code || ''}</code></pre>`;
          case 'image':
            return `<img src="${block.content?.src || ''}" alt="${block.content?.alt || ''}" />`;
          default:
            return `<p>${JSON.stringify(block.content)}</p>`;
        }
      }).join('');
      
      editor.commands.setContent(`<div>${blocksHtml}</div>`);
    }
  }, [note, editor]);
  
  const addBlock = useCallback((type: string) => {
    if (!noteId) return;
    
    const content: Record<string, any> = {};
    if (type === 'heading') content.level = 1;
    if (type === 'code') { content.code = ''; content.language = 'typescript'; }
    if (type === 'image') { content.src = ''; content.alt = ''; }
    if (type === 'link') { content.url = ''; content.title = ''; }
    
    createBlock.mutate({
      noteId,
      data: { type, content, properties: {} }
    });
  }, [noteId, createBlock]);
  
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading note...</div>;
  }
  
  if (!note) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Select a note to start editing</p>
        <Button variant="outline" className="mt-4" onClick={() => setSearchOpen(true)}>
          Or search for a note
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 p-2 border-b flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(editor?.isActive('bold') && 'bg-accent')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(editor?.isActive('italic') && 'bg-accent')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={cn(editor?.isActive('strike') && 'bg-accent')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleCode().run()}
          className={cn(editor?.isActive('code') && 'bg-accent')}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(editor?.isActive('heading', { level: 1 }) && 'bg-accent')}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor?.isActive('heading', { level: 2 }) && 'bg-accent')}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(editor?.isActive('heading', { level: 3 }) && 'bg-accent')}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(editor?.isActive('bulletList') && 'bg-accent')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={cn(editor?.isActive('orderedList') && 'bg-accent')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          className={cn(editor?.isActive('taskList') && 'bg-accent')}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={cn(editor?.isActive('blockquote') && 'bg-accent')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={cn(editor?.isActive('codeBlock') && 'bg-accent')}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button variant="ghost" size="sm" onClick={() => addBlock('image')}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => addBlock('link')}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" onClick={() => addBlock('paragraph')}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};
