/**
 * AI Provider Router
 * Routes requests to the configured AI provider (Anthropic, OpenAI, Gemini, Ollama)
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  actions: AIAction[];
  error?: string;
}

export interface AIAction {
  type: 'highlight' | 'create' | 'rename' | 'none';
  filename?: string;
  newFilename?: string;
  content?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  configured: boolean;
}

// System prompt that enables file operations
export const SYSTEM_PROMPT = `You are an intelligent AI assistant integrated into AIF-BIN Studio, a document memory system.

## Your Capabilities:
1. **Answer questions** about the user's documents
2. **Summarize** single or multiple files
3. **Analyze** documents and extract insights
4. **Create new documents** when asked (summaries, analyses, generated content)
5. **Find and highlight** relevant files
6. **Rename files** based on their content (by grantee, date, tax number, etc.)

## Special Commands (use these in your response when appropriate):
- To highlight files in the sidebar: [HIGHLIGHT:filename.aif-bin]
- To create a new file: [CREATE:filename.aif-bin]
  Then include the content between [CONTENT] and [/CONTENT] tags
- To rename a file: [RENAME:old-filename.aif-bin|new-filename.aif-bin]
  Use descriptive names based on content (kebab-case, no spaces)

## Example - Creating a summary:
User: "Summarize my property deeds"
Assistant: I've analyzed your property documents. Here's a summary:

[Property Overview]
- Total properties: 3
- Locations: Stratford, NY
- Current owner: Ostrander family

[CREATE:property-summary.aif-bin]
[CONTENT]
# Property Portfolio Summary
Generated: 2026-01-31

## Overview
Total Properties: 3
Primary Location: Town of Stratford, Fulton County, NY

## Property Details
1. **Parcel 020.000-01-03.000**
   - Owner: Stanley A. & Kathryn Ann Ostrander
   - Area: 2.0-2.5 acres
   - Location: North Side of Boyer/Edick Road
[/CONTENT]

## Example - Renaming files:
User: "Rename these deed files by grantee name and tax number"
Assistant: I'll rename the files based on the grantee information found in each document:

[RENAME:deed-001.aif-bin|ostrander-stanley-020-000-01-03.aif-bin]
[RENAME:deed-002.aif-bin|randolph-robert-021-01-22.aif-bin]

Done! I've renamed 2 files with the grantee name and tax parcel number.

## Guidelines:
- Be concise but thorough
- When creating files, use descriptive names (kebab-case)
- When renaming, extract key identifiers from content (names, numbers, dates)
- Always explain what you're doing
- If you can't find relevant information, say so
- Highlight files that are relevant to the user's query
`;

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(apiKey: string, messages: AIMessage[], context: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT + '\n\n## User\'s Documents:\n' + context,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey: string, messages: AIMessage[], context: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n## User\'s Documents:\n' + context },
        ...messages.filter(m => m.role !== 'system'),
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Google Gemini API
 */
async function callGemini(apiKey: string, messages: AIMessage[], context: string): Promise<string> {
  // Build conversation history
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT + '\n\n## User\'s Documents:\n' + context }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call Ollama (local)
 */
async function callOllama(endpoint: string, messages: AIMessage[], context: string): Promise<string> {
  const response = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3.2',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n## User\'s Documents:\n' + context },
        ...messages.filter(m => m.role !== 'system'),
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${error}`);
  }

  const data = await response.json();
  return data.message?.content || '';
}

/**
 * Parse AI response for actions (HIGHLIGHT, CREATE)
 */
export function parseActions(response: string): AIAction[] {
  const actions: AIAction[] = [];

  // Find HIGHLIGHT commands
  const highlightRegex = /\[HIGHLIGHT:([^\]]+)\]/g;
  let match;
  while ((match = highlightRegex.exec(response)) !== null) {
    actions.push({ type: 'highlight', filename: match[1].trim() });
  }

  // Find CREATE commands with content
  const createRegex = /\[CREATE:([^\]]+)\][\s\S]*?\[CONTENT\]([\s\S]*?)\[\/CONTENT\]/g;
  while ((match = createRegex.exec(response)) !== null) {
    actions.push({
      type: 'create',
      filename: match[1].trim(),
      content: match[2].trim(),
    });
  }

  // Find RENAME commands: [RENAME:old-name.aif-bin|new-name.aif-bin]
  const renameRegex = /\[RENAME:([^\]|]+)\|([^\]]+)\]/g;
  while ((match = renameRegex.exec(response)) !== null) {
    actions.push({
      type: 'rename',
      filename: match[1].trim(),
      newFilename: match[2].trim(),
    });
  }

  return actions;
}

/**
 * Clean response text (remove action tags for display)
 */
export function cleanResponse(response: string): string {
  return response
    .replace(/\[HIGHLIGHT:[^\]]+\]/g, '')
    .replace(/\[CREATE:[^\]]+\][\s\S]*?\[CONTENT\][\s\S]*?\[\/CONTENT\]/g, '')
    .replace(/\[CONTENT\][\s\S]*?\[\/CONTENT\]/g, '')
    .replace(/\[RENAME:[^\]]+\]/g, '')
    .trim();
}

/**
 * Build context from files for AI
 */
export function buildContext(files: Array<{ name: string; sourceContent?: string; source?: string }>, maxChars = 50000): string {
  let context = '';
  let charCount = 0;

  for (const file of files) {
    const fileInfo = `\n--- File: ${file.name} ---\nSource: ${file.source || 'Unknown'}\n`;
    const content = file.sourceContent?.slice(0, 5000) || '(No content available)';
    const entry = fileInfo + content + '\n';

    if (charCount + entry.length > maxChars) break;
    context += entry;
    charCount += entry.length;
  }

  return context || '(No files loaded)';
}

/**
 * Main function to call AI provider
 */
export async function callAI(
  provider: ProviderConfig,
  messages: AIMessage[],
  files: Array<{ name: string; sourceContent?: string; source?: string }>
): Promise<AIResponse> {
  try {
    const context = buildContext(files);
    let content = '';

    switch (provider.id) {
      case 'anthropic':
        content = await callAnthropic(provider.apiKey, messages, context);
        break;
      case 'openai':
        content = await callOpenAI(provider.apiKey, messages, context);
        break;
      case 'gemini':
        content = await callGemini(provider.apiKey, messages, context);
        break;
      case 'ollama':
        content = await callOllama(provider.apiKey || 'http://localhost:11434', messages, context);
        break;
      default:
        throw new Error(`Unknown provider: ${provider.id}`);
    }

    const actions = parseActions(content);
    const cleanedContent = cleanResponse(content);

    return { content: cleanedContent, actions };
  } catch (error: any) {
    return { content: '', actions: [], error: error.message };
  }
}
