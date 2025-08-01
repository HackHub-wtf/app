import { Text, Group, SegmentedControl } from '@mantine/core'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { useState } from 'react'

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
  const [previewMode, setPreviewMode] = useState<'edit' | 'live' | 'preview'>('edit')

  return (
    <div>
      {label && (
        <Group justify="space-between" mb={5}>
          <Text size="sm" fw={500}>
            {label}
            {required && <Text span c="red"> *</Text>}
          </Text>
          <SegmentedControl
            size="xs"
            value={previewMode}
            onChange={(value) => setPreviewMode(value as 'edit' | 'live' | 'preview')}
            data={[
              { label: 'Edit', value: 'edit' },
              { label: 'Live', value: 'live' },
              { label: 'Preview', value: 'preview' },
            ]}
          />
        </Group>
      )}
      {description && (
        <Text size="xs" c="dimmed" mb={5}>
          {description}
        </Text>
      )}
      <div style={{ 
        maxHeight: '60vh', 
        overflow: 'auto',
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: '4px'
      }}>
        <MDEditor
          value={value}
          onChange={(val) => onChange?.(val || '')}
          height={Math.max(minRows * 30, 200)}
          preview={previewMode}
          hideToolbar={false}
          style={{
            backgroundColor: 'var(--mantine-color-body)',
          }}
        />
      </div>
      {error && (
        <Text size="xs" c="red" mt={5}>
          {error}
        </Text>
      )}
    </div>
  )
}
