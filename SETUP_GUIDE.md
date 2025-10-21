# EezyCourt - Setup Guide

## Quick Start

Follow these steps to get EezyCourt up and running:

### 1. Prerequisites

Make sure you have:
- Node.js 18+ installed
- npm or yarn package manager
- An OpenAI API key or Anthropic API key

### 2. Install Dependencies

```bash
cd ~/ezzycourt
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API key:

```env
# Use one of these:
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

PORT=3000
MCP_PORT=3001
```

To get an API key:
- **OpenAI**: Visit https://platform.openai.com/api-keys
- **Anthropic**: Visit https://console.anthropic.com/settings/keys

### 4. Build the Project

```bash
npm run build
```

### 5. Start the Server

```bash
npm run dev
```

The server will start on http://localhost:3000

### 6. Open the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the EezyCourt interface with the green logo!

## Testing the Application

### Using Sample Documents

We've included sample dispute documents in the `sample-documents/` folder:

1. Open http://localhost:3000
2. Click on the upload area or drag and drop files
3. Upload both sample documents:
   - `contract-dispute-party-a.txt` (assign to Party A)
   - `contract-dispute-party-b.txt` (assign to Party B)
4. Click "Analyze Dispute & Generate Verdict"
5. Wait for the AI agents to process the documents
6. Review the generated verdict

### Creating Your Own Test Documents

You can create your own dispute documents in PDF or TXT format:

1. Create documents representing each party's position
2. Include relevant claims, evidence, and legal arguments
3. Upload them through the web interface
4. Assign each document to the appropriate party

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│                  (http://localhost:3000)                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │           EezyCourt UI (index.html)                │   │
│  │  - Document Upload (drag & drop)                   │   │
│  │  - Party Assignment                                │   │
│  │  - Verdict Display                                 │   │
│  └────────────────┬───────────────────────────────────┘   │
└───────────────────┼───────────────────────────────────────┘
                    │ HTTP POST /api/upload
                    │ HTTP POST /api/analyze/:caseId
                    ▼
┌─────────────────────────────────────────────────────────────┐
│               Express.js Server (port 3000)                 │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │            API Endpoints (server.ts)               │   │
│  │  - /api/upload - Handle file uploads              │   │
│  │  - /api/analyze - Trigger AI analysis             │   │
│  │  - /api/case/:id - Get case details               │   │
│  └────────────────┬───────────────────────────────────┘   │
└───────────────────┼───────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│          DisputeOrchestrator (agent-forge)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Document    │  │   Evidence   │  │    Legal     │    │
│  │  Analyzer    │─▶│  Evaluator   │─▶│   Advisor    │    │
│  │    Agent     │  │    Agent     │  │    Agent     │    │
│  └──────────────┘  └──────────────┘  └──────┬───────┘    │
│                                               │             │
│                                               ▼             │
│                                    ┌──────────────────┐    │
│                                    │   Judicial       │    │
│                                    │  Recommender     │    │
│                                    │     Agent        │    │
│                                    └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │  LLM Provider      │
         │  (OpenAI/Anthropic)│
         └────────────────────┘
```

## Agent Workflow

The DisputeOrchestrator uses **agent-forge** to coordinate four specialized AI agents in a sequential workflow:

1. **DocumentAnalyzer Agent**
   - Extracts key information from legal documents
   - Identifies parties, claims, evidence, and legal arguments
   - Outputs: Structured document analysis

2. **EvidenceEvaluator Agent**
   - Assesses the strength and validity of evidence
   - Identifies corroborating and conflicting evidence
   - Outputs: Evidence quality assessment

3. **LegalAdvisor Agent**
   - Provides legal context and applicable laws
   - References relevant precedents
   - Outputs: Legal framework analysis

4. **JudicialRecommender Agent**
   - Synthesizes all analyses
   - Generates balanced verdict recommendation
   - Outputs: Final verdict with reasoning

## MCP Server (Optional)

The MCP (Model Context Protocol) server provides specialized tools for document analysis:

To run the MCP server separately:

```bash
npm run mcp:dev
```

### Available MCP Tools:

- `extract_document_text` - Extract text from PDF/TXT files
- `analyze_legal_document` - Analyze document structure
- `compare_arguments` - Compare parties' arguments
- `generate_verdict_recommendation` - Generate verdict

## Project Structure

```
ezzycourt/
├── src/
│   ├── server.ts                    # Express API server
│   ├── agents/
│   │   └── DisputeOrchestrator.ts  # Agent-forge orchestration
│   └── mcp/
│       └── server.ts                # MCP server (optional)
├── public/
│   └── index.html                   # Web UI
├── sample-documents/                # Sample test files
│   ├── contract-dispute-party-a.txt
│   └── contract-dispute-party-b.txt
├── uploads/                         # Uploaded files (auto-created)
├── dist/                           # Compiled JavaScript (auto-created)
├── package.json
├── tsconfig.json
├── .env                            # Your API keys (create this)
└── README.md
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```env
PORT=3001
```

### API Key Not Working

Make sure your API key is correctly set in `.env`:

```env
OPENAI_API_KEY=sk-proj-...your-full-key-here
```

No quotes needed!

### Build Errors

If you encounter build errors, try:

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Agent Analysis Takes Too Long

The AI analysis may take 30-60 seconds depending on:
- Document length
- API response time
- Model selected (gpt-4o-mini is faster than gpt-4)

### Cannot Upload Files

Check that:
- Files are PDF or TXT format
- Files are under 10MB
- The `uploads/` directory exists (created automatically)

## Development

### Watch Mode

For development with auto-reload:

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Changing AI Models

Edit [src/agents/DisputeOrchestrator.ts](src/agents/DisputeOrchestrator.ts:42) to change models:

```typescript
model: 'gpt-4o',  // or 'gpt-4', 'claude-3-opus', etc.
```

## API Reference

### Upload Documents

```
POST /api/upload
Content-Type: multipart/form-data

Form Data:
- documents: File[] (multiple files)
- party_0: string (Party A/Party B/Evidence)
- party_1: string
- ...

Response:
{
  "success": true,
  "caseId": "1234567890",
  "documents": [...]
}
```

### Analyze Case

```
POST /api/analyze/:caseId

Response:
{
  "success": true,
  "caseId": "1234567890",
  "verdict": {
    "verdict": "...",
    "reasoning": "...",
    "recommendations": [...],
    "confidence": "..."
  }
}
```

### Get Case Details

```
GET /api/case/:caseId

Response:
{
  "caseId": "1234567890",
  "documents": [...],
  "status": "completed",
  "verdict": {...}
}
```

## Security Notes

- This is a demo application for educational purposes
- In production, implement:
  - User authentication
  - Document encryption
  - Rate limiting
  - Input validation
  - Secure file storage
  - HTTPS

## Support

For issues or questions:
1. Check this guide first
2. Review the main [README.md](README.md)
3. Check the agent-forge docs: https://github.com/frostlogic-ab/agent-forge

## Next Steps

1. Test with sample documents
2. Create your own test cases
3. Experiment with different AI models
4. Explore the agent-forge framework
5. Customize the agents for your use case

Happy judging! ⚖️
