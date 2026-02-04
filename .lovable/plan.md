
# Plan: Connect "Ask Ridel AI" Button to Real AI Chat

## Overview

Currently, the "Ask Ridel AI" button redirects to an external website (`https://ridelai.lovable.app/`). This plan will replace that behavior with a fully integrated AI chat experience within your app, powered by Lovable AI.

## What Will Be Built

### 1. AI Chat Dialog Component
A modal/drawer chat interface that appears when clicking "Ask Ridel AI":
- Floating chat window with RidelL branding
- Message history display with user/assistant bubbles
- Text input with send button
- Real-time streaming responses (tokens appear as they're generated)
- Loading states and error handling
- Text-to-speech option for AI responses (using existing speech synthesis)

### 2. Edge Function for AI Chat
A new `ridel-chat` edge function that:
- Receives user messages and conversation history
- Uses Lovable AI (Google Gemini model) to generate responses
- Streams responses back to the frontend for real-time display
- Handles rate limiting (429) and payment errors (402) gracefully

### 3. Integration Points
- Replace current `handleAskAI` to open the chat dialog instead of redirecting
- Pre-populate the chat with the current search query (if any)
- Option to include search results as context for AI responses

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/RidelAIChat.tsx` | Main chat dialog component with message UI, input, and streaming logic |
| `supabase/functions/ridel-chat/index.ts` | Edge function for Lovable AI with streaming support |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add chat dialog state, update `handleAskAI` to open dialog with optional query context |
| `supabase/config.toml` | Add `ridel-chat` function configuration |

---

## Technical Details

### Edge Function Design

The `ridel-chat` function will:

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Frontend  │────▶│  ridel-chat      │────▶│  Lovable AI Gateway │
│   (React)   │◀────│  Edge Function   │◀────│  (Gemini 3 Flash)   │
└─────────────┘     └──────────────────┘     └─────────────────────┘
     Stream              Stream                    Stream
```

- Model: `google/gemini-3-flash-preview` (fast, balanced)
- System prompt: Helpful search assistant that provides concise answers
- Streaming: SSE format for real-time token display
- Error handling: 429 (rate limit) and 402 (payment) errors surfaced to user

### Frontend Streaming Implementation

The chat component will:
1. Send POST request with message history to edge function
2. Parse SSE stream line-by-line
3. Update assistant message content incrementally
4. Handle `[DONE]` marker and errors

### UI/UX Features

- Slide-up drawer on mobile, centered dialog on desktop
- Message bubbles with user (right) and AI (left) alignment
- Typing indicator while streaming
- Copy response button
- Optional voice playback (using existing speech synthesis)
- Context from current search query

## Implementation Order

1. Create `ridel-chat` edge function with Lovable AI integration
2. Create `RidelAIChat` component with streaming support
3. Update `Index.tsx` to manage chat state and pass context
4. Update `config.toml` to register new function
