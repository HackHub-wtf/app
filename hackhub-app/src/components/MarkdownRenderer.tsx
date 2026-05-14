import ReactMarkdown from 'react-markdown'
import { TypographyStylesProvider } from '@mantine/core'

interface MarkdownRendererProps {
  children: string
  className?: string
  maxHeight?: string | number
  enableScroll?: boolean
}

export function MarkdownRenderer({ 
  children, 
  className, 
  maxHeight = '50vh',
  enableScroll = false 
}: MarkdownRendererProps) {
  const scrollStyle = enableScroll ? {
    maxHeight,
    overflow: 'auto',
    border: '1px solid var(--mantine-color-gray-3)',
    borderRadius: '4px',
    padding: '12px'
  } : {}

  return (
    <div style={scrollStyle}>
      <TypographyStylesProvider className={className}>
        <ReactMarkdown>{children}</ReactMarkdown>
      </TypographyStylesProvider>
    </div>
  )
}
