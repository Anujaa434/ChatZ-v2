# ChatZ — Phase 2 Documentation

 
## Documents

| File | Description |
|------|-------------|
| `ERD_v15.svg` | Entity Relationship Diagram — 9 tables, 18 relationships, crow's foot notation |
| `DataDict_Phase2_Final.docx` | Full data dictionary — all columns, types, constraints, FK behaviour |
| `ChatZ_ProjectScope_v3.docx` | Project scope — requirements, modules, tech stack, design decisions |
| `Use Case Diagram` | UML 2.5 — actors, use cases, Phase 2 functional coverage |

## Phase 2 Highlights
- PostgreSQL 14+ with pgvector (RAG semantic search)
- Hierarchical folders with unlimited nesting depth
- BYOK API key storage with AES-256-GCM encryption
- JWT refresh token revocation via user_sessions table
- Daily token usage tracking per user
