import { Agent, AgentForge, LLM, Workflow } from 'agent-forge';

interface DisputeCase {
  documents: Array<{
    name: string;
    path: string;
    party: string;
  }>;
  caseId: string;
}

interface VerdictResult {
  verdict: string;
  reasoning: string;
  recommendations: string[];
  confidence: string;
}

export class DisputeOrchestrator {
  private forge: AgentForge;
  private llmProvider: LLM;
  private documentAnalyzer: Agent;
  private evidenceEvaluator: Agent;
  private legalAdvisor: Agent;
  private judicialRecommender: Agent;

  constructor(apiKey: string, provider: 'openai' | 'anthropic' = 'openai') {
    // Create LLM provider
    this.llmProvider = new LLM(provider, { apiKey });

    // Create AgentForge instance
    this.forge = new AgentForge(this.llmProvider);

    // Create specialized agents
    this.documentAnalyzer = new Agent(
      {
        name: 'DocumentAnalyzer',
        role: 'Legal Document Analyst',
        description:
          'Extracts and analyzes key information from legal documents including parties, claims, evidence, and legal arguments',
        objective: 'Analyze legal documents and extract key information',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.evidenceEvaluator = new Agent(
      {
        name: 'EvidenceEvaluator',
        role: 'Evidence Assessment Specialist',
        description:
          'Evaluates the strength and validity of evidence presented by both parties, identifies supporting and contradicting evidence',
        objective: 'Assess evidence quality and credibility',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.legalAdvisor = new Agent(
      {
        name: 'LegalAdvisor',
        role: 'Legal Precedent and Law Specialist',
        description:
          'Provides legal context, relevant laws, precedents, and contractual interpretation for the dispute',
        objective: 'Provide legal context and applicable laws',
        model: 'gpt-4o-mini',
        temperature: 0.3,
      },
      [],
      this.llmProvider
    );

    this.judicialRecommender = new Agent(
      {
        name: 'JudicialRecommender',
        role: 'Judicial Decision Recommender',
        description:
          'Synthesizes all analyses to provide a balanced judicial recommendation based on evidence, law, and fairness principles',
        objective: 'Generate balanced judicial recommendations',
        model: 'gpt-4o-mini',
        temperature: 0.4,
      },
      [],
      this.llmProvider
    );

    // Register agents with forge
    this.forge.registerAgent(this.documentAnalyzer);
    this.forge.registerAgent(this.evidenceEvaluator);
    this.forge.registerAgent(this.legalAdvisor);
    this.forge.registerAgent(this.judicialRecommender);
  }

  async analyzeDispute(disputeCase: DisputeCase): Promise<VerdictResult> {
    try {
      console.log(`Starting analysis for case: ${disputeCase.caseId}`);

      // Create a workflow for the dispute analysis
      const workflow = new Workflow('DisputeAnalysisWorkflow');

      // Step 1: Document Analysis
      workflow.addStep(this.documentAnalyzer);

      // Step 2: Evidence Evaluation
      workflow.addStep(this.evidenceEvaluator);

      // Step 3: Legal Advisory
      workflow.addStep(this.legalAdvisor);

      // Step 4: Judicial Recommendation
      workflow.addStep(this.judicialRecommender);

      // Prepare initial context
      const initialPrompt = this.buildInitialPrompt(disputeCase);

      // Run the workflow
      console.log('Running agent workflow...');
      const result = await workflow.run(initialPrompt);

      // Parse the final result into a structured verdict
      const verdict = this.parseVerdictFromResult(result.output || result.toString());

      return verdict;
    } catch (error) {
      console.error('Error in dispute analysis:', error);
      throw error;
    }
  }

  private buildInitialPrompt(disputeCase: DisputeCase): string {
    const docList = disputeCase.documents
      .map(
        (doc, idx) =>
          `${idx + 1}. Document: ${doc.name} (Party: ${doc.party}, Path: ${doc.path})`
      )
      .join('\n');

    return `
Analyze the following legal dispute case between companies:

Case ID: ${disputeCase.caseId}

Documents submitted:
${docList}

Your task is to:
1. Analyze all documents thoroughly and extract key claims, evidence, and legal arguments
2. Evaluate the strength and validity of evidence from both parties
3. Identify relevant legal principles, laws, and precedents that apply
4. Provide a comprehensive judicial recommendation based on your analysis

Please provide a thorough analysis considering:
- Contractual obligations and their interpretation
- Quality and credibility of evidence
- Legal precedents and applicable laws
- Fairness and equity considerations
- Potential remedies and resolutions

Note: This is an AI-assisted analysis for demonstration purposes. In a real scenario, you would have access to the actual document contents through MCP tools.
    `;
  }

  private parseVerdictFromResult(result: string): VerdictResult {
    // For a production system, you would parse the LLM's structured response
    // For now, we'll create a structured verdict from the workflow output

    // Check if the result contains key information
    const hasAnalysis = result.length > 100;

    if (hasAnalysis) {
      return {
        verdict: 'AI-Assisted Judicial Recommendation',
        reasoning: result,
        recommendations: [
          'Review all submitted documents carefully',
          'Consider contractual obligations and evidence quality',
          'Consult with legal professionals for final decision',
          'Ensure all parties have been heard fairly',
        ],
        confidence: 'Medium - AI Analysis Complete',
      };
    }

    // Fallback verdict
    return {
      verdict: 'Further Review Required',
      reasoning:
        'The AI analysis has been completed. The dispute involves complex legal issues that require detailed examination of the submitted documents. Both parties have presented their positions, and a thorough evaluation of evidence, contractual obligations, and applicable laws is needed.',
      recommendations: [
        'Conduct detailed review of all submitted evidence',
        'Verify authenticity of documents',
        'Consider mediation or settlement options',
        'Consult legal precedents for similar cases',
        'Ensure compliance with jurisdictional requirements',
      ],
      confidence: 'Requires Human Expert Review',
    };
  }
}
