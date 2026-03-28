import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core'
import '@tiptap/extension-code-block'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { common, createLowlight } from 'lowlight'

declare module '@tiptap/extension-code-block-lowlight' {
  interface CodeBlockLowlightOptions {
    addNodeView?: () => ReturnType<typeof ReactNodeViewRenderer>
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskList: {
      toggleTaskList: () => ReturnType
    }
  }
}
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
  ChevronDown,
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

const TaskList = Node.create({
  name: 'taskList',
  addOptions() {
    return { itemTypeName: 'taskItem', HTMLAttributes: {} }
  },
  group: 'block list',
  content() {
    return `${this.options.itemTypeName}+`
  },
  parseHTML() {
    return [{ tag: 'ul[data-type="taskList"]', priority: 51 }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
        style: 'list-style: none; padding-left: 0; margin: 0.5em 0;',
      }),
      0,
    ]
  },
  addCommands() {
    return {
      toggleTaskList:
        () =>
        (props): boolean => {
          const { commands } = props
          return commands.toggleList(this.name, this.options.itemTypeName)
        },
    }
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-9': () => this.editor.commands.toggleTaskList() }
  },
})

const inputRegex = /^\s*(\[([( |x])?\])\s$/

const CODE_LANGUAGES = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'docker', label: 'Docker' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'lua', label: 'Lua' },
  { value: 'r', label: 'R' },
  { value: 'scala', label: 'Scala' },
  { value: 'dart', label: 'Dart' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'vim', label: 'Vim' },
]

function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
  const language = node.attrs.language ?? 'plaintext'
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const selectedLang = CODE_LANGUAGES.find(l => l.value === language) ?? CODE_LANGUAGES[0]

  useEffect(() => {
    fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:mount",message:"Mount",data:{language},timestamp:Date.now(),hypothesisId:"A",runId:"debug-run"})}).catch(()=>{});
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:enter",message:"Enter",data:{language, isHovered: true},timestamp:Date.now(),hypothesisId:"A",runId:"debug-run"})}).catch(()=>{});
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:leave",message:"Leave",data:{language, isHovered: false},timestamp:Date.now(),hypothesisId:"A",runId:"debug-run"})}).catch(()=>{});
  }

  fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:render",message:"Render",data:{language, isHovered, isOpen},timestamp:Date.now(),hypothesisId:"A",runId:"debug-run"})}).catch(()=>{});

  return (
    <NodeViewWrapper>
      <div
        className="codeblock-wrapper code-block-with-lang"
        data-language={language}
      >
        <pre>
          <code>{/* lowlight injects hljs-* spans here */}</code>
        </pre>

        {/* Language selector - always visible for testing */}
        <div
          className="lang-selector"
          contentEditable={false}
          style={{ opacity: 1, pointerEvents: "auto" }}
        >
          {isOpen ? (
            <Select
              value={language}
              open
              onOpenChange={(open) => setIsOpen(open)}
              onValueChange={(value) => {
                updateAttributes({ language: value })
                setIsOpen(false)
              }}
            >
              <SelectTrigger className="h-6 min-w-[120px] text-xs bg-muted/80 backdrop-blur-sm border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {CODE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <button
              className="h-6 px-2 text-xs bg-muted/80 backdrop-blur-sm border border-border/50 rounded hover:bg-muted transition-colors flex items-center gap-1"
              onClick={() => setIsOpen(true)}
            >
              <span>{selectedLang.label}</span>
              <ChevronDown className="size-3" />
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const TaskItem = Node.create({
  name: 'taskItem',
  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {},
      taskListTypeName: 'taskList',
    }
  },
  content() {
    return this.options.nested ? 'paragraph block*' : 'paragraph+'
  },
  defining: true,
  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: (element) => {
          const dataChecked = element.getAttribute('data-checked')
          return dataChecked === '' || dataChecked === 'true'
        },
        renderHTML: (attributes) => ({
          'data-checked': String(attributes.checked),
        }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'li[data-type="taskItem"]', priority: 51 }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'label',
        ['input', { type: 'checkbox', checked: node.attrs.checked ? 'checked' : null }],
        ['span'],
      ],
      ['div', 0],
    ]
  },
  addKeyboardShortcuts() {
    const shortcuts = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    }
    if (!this.options.nested) return shortcuts
    return { ...shortcuts, Tab: () => this.editor.commands.sinkListItem(this.name) }
  },
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li')
      const checkboxWrapper = document.createElement('label')
      const checkbox = document.createElement('input')
      const content = document.createElement('div')

      listItem.setAttribute('data-type', 'taskItem')
      listItem.setAttribute('data-checked', String(node.attrs.checked))
      listItem.style.cssText =
        'display: flex !important; flex-direction: row !important; align-items: flex-start !important; list-style: none !important; margin: 0.2em 0 !important;'

      checkbox.type = 'checkbox'
      checkbox.checked = node.attrs.checked
      checkbox.style.cssText =
        'width: 15px !important; height: 15px !important; accent-color: var(--primary); cursor: pointer; margin: 0 !important; padding: 0 !important; flex-shrink: 0;'

      checkboxWrapper.contentEditable = 'false'
      checkboxWrapper.style.cssText =
        'flex-shrink: 0 !important; display: inline-flex !important; align-items: center; user-select: none; cursor: pointer; margin: 0; padding: 0;'
      checkboxWrapper.appendChild(checkbox)

      content.style.cssText = 'flex: 1 1 0%; min-width: 0;'
      listItem.appendChild(checkboxWrapper)
      listItem.appendChild(content)

      Object.entries(this.options.HTMLAttributes as Record<string, string>).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })
      Object.entries(HTMLAttributes as Record<string, string>).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      checkbox.addEventListener('mousedown', (e) => e.preventDefault())
      checkbox.addEventListener('change', (e) => {
        const { checked } = e.target as HTMLInputElement
        if (!editor.isEditable && typeof getPos === 'function') {
          editor
            .chain()
            .focus(undefined, { scrollIntoView: false })
            .command(({ tr }) => {
              const position = getPos()
              if (typeof position !== 'number') return false
              const currentNode = tr.doc.nodeAt(position)
              tr.setNodeMarkup(position, undefined, {
                ...currentNode?.attrs,
                checked,
              })
              return true
            })
            .run()
        }
      })

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false
          listItem.dataset.checked = String(updatedNode.attrs.checked)
          checkbox.checked = updatedNode.attrs.checked
          return true
        },
      }
    }
  },
  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: (match) => ({ checked: match[match.length - 1] === 'x' }),
      }),
    ]
  },
})

export const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { note, isLoading, updateNote, createBlock, updateBlock } = useNote(noteId)
  const { setDirty } = useKnowledgeStore()
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
      CodeBlockLowlight.configure({
        lowlight,
        addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView),
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none min-h-[300px] px-8 py-6 knowledge-prose',
      },
    },
    onUpdate: () => {
      setSaveStatus('unsaved')
      setDirty(true)
      scheduleAutoSave()
    },
  })

  const forceRerender = useState(0)[1]

  // Monitor editor container width
  useEffect(() => {
    fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:editor_mount",message:"NoteEditor mounted - width check",data:{containerWidth: document.getElementById("editor-scroll-container")?.offsetWidth, windowWidth: window.innerWidth, parentWidth: document.getElementById("editor-scroll-container")?.parentElement?.offsetWidth},timestamp:Date.now(),hypothesisId:"B",runId:"debug-run"})}).catch(()=>{});

    const handleResize = () => {
      fetch("http://127.0.0.1:7726/ingest/918adc1f-9727-420b-8c52-f776b158e8a2",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7516fd"},body:JSON.stringify({sessionId:"7516fd",location:"NoteEditor.tsx:window_resize",message:"Window resized - width check",data:{containerWidth: document.getElementById("editor-scroll-container")?.offsetWidth, windowWidth: window.innerWidth},timestamp:Date.now(),hypothesisId:"B",runId:"debug-run"})}).catch(()=>{});
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!editor) return
    const rerender = () => forceRerender((n) => n + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

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
        <ToolbarButton 
          onClick={() => editor?.chain().focus().setCodeBlock().run()} 
          active={editor?.isActive('codeBlock')} 
          title="Code block"
        >
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

      <div className="flex-1 overflow-auto" id="editor-scroll-container">
        <div className="w-full" id="editor-content-wrapper">
          <div className="px-8 pt-8 pb-2 w-full">
            <input
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Untitled"
              className="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground resize-none"
            />
          </div>
          <div className="px-8 pb-8 w-full">
            <EditorContent editor={editor} />
          </div>
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
