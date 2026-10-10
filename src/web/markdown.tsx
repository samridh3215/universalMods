// Markdown rendering for agent text, the board, messages and questions.
// Raw HTML is disabled, so agent output can't inject markup or scripts.
import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, linkify: true, breaks: true, typographer: false });

// Open links in a new tab and never let them reach back into the floor page.
const defaultLink = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultLink(tokens, idx, options, env, self);
};

export function Markdown({ text, inline = false, className = '' }: { text: string; inline?: boolean; className?: string }) {
  const html = useMemo(() => (inline ? md.renderInline(text) : md.render(text)), [text, inline]);
  return inline ? (
    <span className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className={`md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
