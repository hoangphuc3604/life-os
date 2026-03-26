import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useCallback, useState, type ChangeEvent } from 'react'
import { useNote, useUpload } from '@/hooks/useKnowledge'
import { useKnowledgeStore } from '@/stores/knowledge.store'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const lowlight = createLowlight(common)
const AUTO_SAVE_DELAY = 1500

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'idle'

interface NoteEditorProps {
  noteId: string
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-border mx-0.5" />
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="size-7"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { note, isLoading, updateNote, createBlock, updateBlock } = useNote(noteId)
  const { setDirty, isDirty } = useKnowledgeStore()
  const { upload, isUploading } = useUpload()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [titleValue, setTitleValue] = useState('')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentBlockId = useRef<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full my-2' },
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-8 py-6 knowledge-prose',
      },
    },
    onUpdate: () => {
      setSaveStatus('unsaved')
      setDirty(true)
      scheduleAutoSave()
    },
  })

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      performSave()
    }, AUTO_SAVE_DELAY)
  }, [])

  const performSave = useCallback(async () => {
    if (!editor || !noteId) return
    setSaveStatus('saving')

    const json = editor.getJSON()

    try {
      if (contentBlockId.current) {
        await updateBlock.mutateAsync({
          id: contentBlockId.current,
          data: { type: 'richtext', content: { json } },
        })
      } else {
        const block = await createBlock.mutateAsync({
          noteId,
          data: { type: 'richtext', content: { json } },
        })
        contentBlockId.current = block.id
      }
      setSaveStatus('saved')
      setDirty(false)
    } catch {
      setSaveStatus('unsaved')
    }
  }, [editor, noteId, updateBlock, createBlock, setDirty])

  useEffect(() => {
    if (!editor || !note) return

    setTitleValue(note.title ?? '')

    const richtextBlock = note.blocks?.find((b) => b.type === 'richtext')
    if (richtextBlock) {
      contentBlockId.current = richtextBlock.id
      if (richtextBlock.content?.json) {
        editor.commands.setContent(richtextBlock.content.json)
      } else {
        editor.commands.setContent('')
      }
    } else {
      contentBlockId.current = null
      editor.commands.setContent('')
    }

    setSaveStatus('idle')
    setDirty(false)
  }, [note?.id, note?.title])

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value)
    setSaveStatus('unsaved')
    setDirty(true)
  }

  const handleTitleBlur = () => {
    if (!noteId || !titleValue.trim()) return
    updateNote.mutate({ id: noteId, data: { title: titleValue.trim() } })
    setSaveStatus('saved')
    setDirty(false)
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    try {
      const result = await upload(file)
      editor.chain().focus().setImage({ src: result.url }).run()
    } catch {}
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const setLink = () => {
    const url = window.prompt('Enter URL')
    if (!url || !editor) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!note) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 h-11 border-b shrink-0 flex-wrap">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strikethrough">
          <Strikethrough className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline code">
          <Code className="size-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="size-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet list">
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleTaskList().run()} active={editor?.isActive('taskList')} title="Task list">
          <CheckSquare className="size-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
          <Quote className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Code block">
          <Code className="size-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Insert image" disabled={isUploading}>
          {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor?.isActive('link')} title="Insert link">
          <LinkIcon className="size-3.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo">
          <Undo className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo">
          <Redo className="size-3.5" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="size-3 animate-spin" />
              <span>Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="size-3 text-green-500" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && <span className="text-muted-foreground">Unsaved changes</span>}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[760px] mx-auto">
          <div className="px-8 pt-8 pb-2">
            <input
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Untitled"
              className="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground resize-none"
            />
          </div>
          <EditorContent editor={editor} />
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  )
}
