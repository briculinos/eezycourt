# EezyCourt - AI Legal Dispute Resolution System

An AI-powered application that analyzes legal disputes between companies and provides judicial recommendations using agent orchestration and MCP (Model Context Protocol) servers.

## Features

- **Document Upload**: Upload dispute documents (PDF, TXT) from both parties
- **AI Agent Orchestration**: Uses [agent-forge](https://github.com/frostlogic-ab/agent-forge) for coordinating specialized AI agents:
  - Document Analyzer: Extracts key information from legal documents
  - Evidence Evaluator: Assesses the strength and validity of evidence
  - Legal Advisor: Provides legal context and precedents
  - Judicial Recommender: Synthesizes analysis into a verdict recommendation
- **MCP Server**: Custom Model Context Protocol server with tools for document analysis
- **Clean UI**: Simple, intuitive interface with green EezyCourt branding

## Architecture

```
┌─────────────────┐
│   Web UI        │
│  (index.html)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │
│  (server.ts)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Agent-Forge     │◄────►│  MCP Server      │
│ Orchestrator    │      │  (Document Tools)│
└─────────────────┘      └──────────────────┘
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key or Anthropic API key

### Installation

1. Clone the repository and navigate to the project:

```bash
cd ezzycourt
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file with your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3000
MCP_PORT=3001
```

4. Build the TypeScript code:

```bash
npm run build
```

## Running the Application

### Development Mode

Run the Express server in development mode with hot reload:

```bash
npm run dev
```

The application will be available at: http://localhost:3000

### Production Mode

Build and run in production:

```bash
npm run build
npm start
```

### Running the MCP Server

In a separate terminal, run the MCP server:

```bash
npm run mcp:dev
```

## Usage

1. Open http://localhost:3000 in your browser
2. Upload dispute documents from both parties (PDF or TXT format)
3. Assign each document to a party (Party A, Party B, or Evidence)
4. Click "Analyze Dispute & Generate Verdict"
5. Wait for the AI agents to analyze the documents
6. Review the generated verdict and recommendations

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload dispute documents
- `POST /api/analyze/:caseId` - Analyze case and generate verdict
- `GET /api/case/:caseId` - Get case details
- `GET /api/cases` - List all cases

## MCP Tools

The MCP server provides the following tools:

- `extract_document_text` - Extract text from PDF/TXT files
- `analyze_legal_document` - Analyze document structure and content
- `compare_arguments` - Compare arguments from both parties
- `generate_verdict_recommendation` - Generate judicial recommendation

## Technology Stack

- **Backend**: Node.js, Express, TypeScript
- **AI Orchestration**: [agent-forge](https://github.com/frostlogic-ab/agent-forge)
- **MCP**: Model Context Protocol SDK
- **File Upload**: Multer
- **Document Parsing**: pdf-parse
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Project Structure

```
ezzycourt/
├── src/
│   ├── server.ts              # Express API server
│   ├── agents/
│   │   └── DisputeOrchestrator.ts  # Agent-forge orchestration
│   └── mcp/
│       └── server.ts          # MCP server with tools
├── public/
│   └── index.html            # Web UI
├── uploads/                  # Document uploads (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Important Notes

- This is an AI-assisted analysis tool for demonstration and research purposes
- Final legal decisions should always be made by qualified legal professionals
- The system uses AI models that may have biases or limitations
- Always verify AI-generated recommendations with legal experts
- Document uploads are stored locally in the `uploads/` directory

## Development

To modify the AI agents, edit [src/agents/DisputeOrchestrator.ts](src/agents/DisputeOrchestrator.ts)

To add new MCP tools, edit [src/mcp/server.ts](src/mcp/server.ts)

To customize the UI, edit [public/index.html](public/index.html)

## License

MIT

## Disclaimer

This application is for educational and demonstration purposes only. It does not constitute legal advice and should not be used as a substitute for professional legal counsel.
