import { useMemo } from 'react';

export default function Markdown({ text }) {
  const html = useMemo(() => {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  }, [text]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
