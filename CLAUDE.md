# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EezyCourt is an AI-powered legal dispute resolution system that analyzes documents from disputing parties and generates judicial recommendations. It uses agent-forge for orchestrating specialized AI agents and implements the Model Context Protocol (MCP) for document analysis tools.

## Development Commands

### Building and Running

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode with hot reload (main server)
npm run dev

# Production mode
npm start

# Run MCP server (optional, separate terminal)
npm run mcp:dev
```

### Environment Setup

Create `.env` file based on `.env.example`:
- Required: Either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- Optional: `PORT` (default: 3000), `MCP_PORT` (default: 3001)

## Architecture

### Core Components

**Express API Server** (`src/server.ts`)
- Handles document uploads via multer
- Manages case data (in-memory Map, not persisted)
- Coordinates with DisputeOrchestrator for AI analysis
- Serves static UI from `public/`

**DisputeOrchestrator** (`src/agents/DisputeOrchestrator.ts`)
- Uses agent-forge to orchestrate 4 sequential agents:
  1. DocumentAnalyzer - Extracts parties, claims, evidence from documents
  2. EvidenceEvaluator - Assesses evidence strength and validity
  3. LegalAdvisor - Provides legal context and precedents
  4. JudicialRecommender - Synthesizes analysis into verdict
- Workflow runs sequentially: each agent builds on previous agent's output
- Provider detection: Uses OpenAI if `OPENAI_API_KEY` set, otherwise Anthropic
- All agents use `gpt-4o-mini` model with low temperature (0.3-0.4)

**MCP Server** (`src/mcp/server.ts`)
- Standalone server providing 4 tools for document analysis:
  - `extract_document_text`: Reads PDF/TXT files using pdf-parse
  - `analyze_legal_document`: Pattern matching for parties, claims, evidence
  - `compare_arguments`: Compares both parties' positions
  - `generate_verdict_recommendation`: Generates structured verdict
- Uses basic regex patterns for legal document parsing
- Maintains document cache in memory

### Data Flow

1. User uploads documents (PDF/TXT, max 10MB) via web UI
2. Multer stores files in `uploads/` directory
3. Case created with unique ID (timestamp) in `cases` Map
4. When analysis requested:
   - DisputeOrchestrator initializes with appropriate LLM provider
   - Agent workflow executes sequentially through all 4 agents
   - Verdict result stored in case object
5. UI polls or displays verdict

### File Structure

```
src/
├── server.ts                  # Express API (port 3000)
├── agents/
│   └── DisputeOrchestrator.ts # Agent-forge workflow
└── mcp/
    └── server.ts              # MCP server (port 3001)
public/
└── index.html                 # Web UI with drag-drop upload
uploads/                       # Runtime file storage (gitignored)
sample-documents/              # Test files for development
```

## Important Implementation Details

### Agent Workflow Configuration

- The workflow in DisputeOrchestrator runs agents sequentially via `workflow.addStep()`
- Each agent receives context from previous agents in the workflow
- Initial prompt is built in `buildInitialPrompt()` with document metadata
- Verdict parsing happens in `parseVerdictFromResult()` - currently uses simple heuristics

### API Key Detection

The server auto-detects provider in `src/server.ts:127`:
```typescript
const provider = process.env.OPENAI_API_KEY ? 'openai' : 'anthropic';
```

### Case Storage

Cases are stored in-memory in a Map at `src/server.ts:53`. This means:
- Cases lost on server restart
- Not suitable for production without database integration
- Case IDs are timestamps (not UUIDs)

### File Upload Constraints

- Allowed types: `.pdf`, `.txt` only (enforced in multer filter)
- Max size: 10MB per file (configurable in `src/server.ts:43`)
- Max files: 10 per upload
- Files stored with timestamp prefix for uniqueness

### MCP Server Usage

The MCP server currently runs independently and is not integrated with the main analysis flow. The DisputeOrchestrator sends document metadata to agents but doesn't actually extract document text using MCP tools. This is noted in the initial prompt at `src/agents/DisputeOrchestrator.ts:163`.

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload dispute documents (multipart/form-data)
- `POST /api/analyze/:caseId` - Trigger AI analysis workflow
- `GET /api/case/:caseId` - Retrieve case details and verdict
- `GET /api/cases` - List all cases

## Known Limitations

- Document text not actually read during analysis (agents work from metadata only)
- No database persistence
- No authentication or authorization
- No rate limiting
- Single-instance in-memory storage
- MCP server not integrated with main workflow

## Modifying AI Behavior

To change agent models, edit `src/agents/DisputeOrchestrator.ts` and update the `model` field in each Agent constructor (lines 42, 56, 71, 85).

To adjust analysis flow, modify the workflow steps in `analyzeDispute()` method or update agent prompts in their configurations.
