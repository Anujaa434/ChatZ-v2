# ChatZ — Unified Knowledge Library
### Phase 2 · Hierarchical Workspace with Context-Aware AI Assistance
 
 
---
 
ChatZ v2 is a complete rebuild of [ChatZ v1](https://github.com/Anujaa434/Chat_Z) — evolving from a basic AI chat app into a **Unified Knowledge Library** where your notes and conversations live together in organized workspaces, and the AI reads your folder before responding.
 
**Stack:** PostgreSQL 14+ · pgvector · Node.js · Express.js · React · LangChain
 
---
 
### What You Can Do
 
- **Organize in folders** — Create nested workspaces to any depth. Example: `MCA → Semester 2 → OS`. Chats and notes live together, not in flat lists.
- **AI that knows your folder** — The AI reads your notes and past messages from the active folder before responding. Context-aware, not generic.
- **Save AI responses as notes** — Any AI reply can be saved as a note in one click. Saved notes are indexed for future RAG retrieval.
- **Switch AI models mid-conversation** — Change between Gemini, Groq, and OpenAI without losing the conversation thread.
- **Bring Your Own API Key (BYOK)** — Use your own keys for any provider. Stored encrypted, never in plaintext.
- **Split-screen workspace** — Chat and notes side by side, both scoped to the active folder.
- **Soft delete** — Nothing is permanently gone unless you choose to delete it.
- **Secure sessions** — Logout actually invalidates your token server-side.
- **Voice input** *(optional)* — Transcribe audio into notes or chat via OpenAI Whisper.
 
---
 
### What's New in Phase 2
 
| Area | Phase 1 | Phase 2 |
|---|---|---|
| Database | MySQL — flat tables | PostgreSQL + pgvector |
| Organisation | Flat list | Hierarchical folders, unlimited nesting |
| AI Memory | Live context only | RAG semantic search over notes + messages |
| AI Models | Single provider | Gemini / Groq / OpenAI via LangChain |
| API Keys | System keys only | BYOK — AES-256-GCM encrypted |
| Sessions | Stateless JWT | Refresh token store — proper revocation |
 
---
 
 
> Phase 1 repo: [ChatZ v1](https://github.com/Anujaa434/Chat_Z) — original MySQL implementation
 
*Anuja Patil · Akshata Shrivastava · IMCC Pune · 2026*
