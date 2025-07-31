import { RichTextEditor, Link } from '@mantine/tiptap'
import { useEditor } from '@tiptap/react'
import Highlight from '@tiptap/extension-highlight'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Superscript from '@tiptap/extension-superscript'
import SubScript from '@tiptap/extension-subscript'
import { Text } from '@mantine/core'
import { useEffect } from 'react'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  label?: string
  description?: string
  error?: string
  required?: boolean
  minRows?: number
}

export function MarkdownEditor({
  value = '',
  onChange,
  label,
  description,
  error,
  required = false,
  minRows = 5
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure StarterKit to include the basic markdown elements
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Get HTML content for rich display
      const html = editor.getHTML()
      onChange?.(html)
    },
  })

  // Sync external value changes with editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return (
    <div>
      {label && (
        <Text size="sm" fw={500} mb={5}>
          {label}
          {required && <Text span c="red"> *</Text>}
        </Text>
      )}
      {description && (
        <Text size="xs" c="dimmed" mb={5}>
          {description}
        </Text>
      )}
      {editor ? (
        <RichTextEditor 
          editor={editor} 
          style={{ minHeight: `${minRows * 20}px` }}
        >
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>
      ) : (
        <div style={{ 
          minHeight: `${minRows * 20}px`,
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '10px',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text c="dimmed">Loading editor...</Text>
        </div>
      )}
      {error && (
        <Text size="xs" c="red" mt={5}>
          {error}
        </Text>
      )}
    </div>
  )
}
