import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Organisation } from '../models/Organisation.js';
import { User } from '../models/User.js';
import { ApprovedFact } from '../models/ApprovedFact.js';
import { BrandDocument } from '../models/BrandDocument.js';
import { GuidelineChunk } from '../models/GuidelineChunk.js';
import { ContentSubmission } from '../models/ContentSubmission.js';
import { AnalysisReport } from '../models/AnalysisReport.js';
import { ReviewDecision } from '../models/ReviewDecision.js';
import { DocumentParserService } from './documentParser.service.js';
import { EmbeddingService } from './embedding.service.js';
import { AnalysisService } from './analysis.service.js';
import { RAGService } from './rag.service.js';

export class SeedService {
  public static async seedDemoData(force = false): Promise<any> {
    const existingOrg = await Organisation.findOne({ slug: 'apexflow' });
    if (existingOrg && !force) {
      console.log('[SeedService] Demo data already exists. Skipping seed.');
      return { message: 'Demo data already exists.' };
    }

    if (force) {
      console.log('[SeedService] Force reset requested. Cleaning up previous demo records...');
      await Organisation.deleteMany({ slug: 'apexflow' });
    }

    // 1. Create Organisation
    const org = await Organisation.create({
      name: 'ApexFlow Technologies',
      slug: 'apexflow',
      description: 'Enterprise AI Workflow Orchestration & Data Governance Platform.',
      brandVoiceSummary: 'Authoritative, precise, enterprise-ready, transparent, and customer-obsessed. Avoid hype and colloquialisms.',
    });

    // 2. Create Demo Users
    const salt = await bcrypt.genSalt(10);
    const creatorPasswordHash = await bcrypt.hash('DemoCreator123!', salt);
    const reviewerPasswordHash = await bcrypt.hash('DemoReviewer123!', salt);

    // Remove existing demo users if any
    await User.deleteMany({ email: { $in: ['creator@brandlens.demo', 'reviewer@brandlens.demo'] } });

    const creatorUser = await User.create({
      name: 'Alex Rivera (Content Creator)',
      email: 'creator@brandlens.demo',
      passwordHash: creatorPasswordHash,
      role: 'creator',
      organizationId: org._id,
    });

    const reviewerUser = await User.create({
      name: 'Elena Rostova (Brand Governance Lead)',
      email: 'reviewer@brandlens.demo',
      passwordHash: reviewerPasswordHash,
      role: 'reviewer',
      organizationId: org._id,
    });

    // 3. Create Approved Facts & Terminology Rules
    await ApprovedFact.deleteMany({ organizationId: org._id });

    const factsData = [
      {
        type: 'fact' as const,
        key: 'Platform Throughput SLA',
        value: 'ApexFlow processes up to 10,000 automated workflow tasks per second with a verified 99.99% enterprise uptime SLA.',
        context: 'Customer-facing marketing and technical collateral.',
      },
      {
        type: 'fact' as const,
        key: 'Security & Hosting',
        value: 'All customer data is encrypted in transit (TLS 1.3) and at rest (AES-256) across ISO-27001 and SOC-2 Type II certified regional facilities.',
        context: 'Security audits, whitepapers, and promotional sheets.',
      },
      {
        type: 'approved_terminology' as const,
        key: 'ApexFlow Platform',
        value: 'Always capitalize and refer to as "ApexFlow Platform". Never abbreviate as "the tool" or "the software".',
        context: 'Global brand identity standard.',
      },
      {
        type: 'approved_terminology' as const,
        key: 'Workflow Intelligence',
        value: 'Use "Workflow Intelligence" when describing our predictive automation engine rather than generic "AI tool".',
        context: 'Product messaging.',
      },
      {
        type: 'prohibited_terminology' as const,
        key: 'cheap',
        value: 'Never use the word "cheap". Replace with "cost-effective", "high-ROI", or "competitively priced".',
        context: 'Pricing pages, social posts, sales decks.',
      },
      {
        type: 'prohibited_terminology' as const,
        key: 'unlimited free',
        value: 'Strictly prohibited. We provide a 14-day fully-featured enterprise pilot, not unlimited free access.',
        context: 'Lead generation and advertising.',
      },
      {
        type: 'prohibited_terminology' as const,
        key: '100% bug-free',
        value: 'Legally prohibited claim. Replace with "rigorously tested with 99.99% reliability".',
        context: 'Legal and brand compliance.',
      },
      {
        type: 'tone_rule' as const,
        key: 'Professional & Authoritative Tone',
        value: 'Content must maintain professional, clear, and dignified tone. Avoid slang, hype words, and excessive exclamation marks.',
        context: 'All channels.',
      },
    ];

    for (const f of factsData) {
      await ApprovedFact.create({
        organizationId: org._id,
        createdBy: reviewerUser._id,
        ...f,
        isActive: true,
      });
    }

    // 4. Create Brand Document with Extracted Guidelines and Vector Chunks
    const sampleGuidelineText = `
APEXFLOW TECHNOLOGIES — GLOBAL BRAND GOVERNANCE GUIDELINES 2026

1. BRAND VOICE AND TONE PRINCIPLES
ApexFlow communicates with clarity, technical rigor, and measured confidence. Our audience consists of CTOs, Engineering Leaders, and Enterprise Operations Directors.
We respect the intelligence of our readers. We never employ exaggerated superlatives like "best in the world" or "revolutionary miracle".
Slang, informal colloquialisms (such as "bruh", "gonna", "super hyped"), and clickbait phrasing are strictly prohibited across all external touchpoints.

2. OFFICIAL PRODUCT TERMINOLOGY & BRAND ARCHITECTURE
The primary product is formally named "ApexFlow Platform".
Under no circumstances should the product be demeaned with colloquial terms like "the tool", "the script", or "the app".
When referring to our algorithmic decision layer, the approved terminology is "Workflow Intelligence".
Avoid generic descriptions like "bot" or "smart robot".

3. PRICING & PROMOTIONAL CLAIMS POLICY
Transparency and integrity dictate all promotional statements.
Do not describe our pricing tier as "cheap". Use "cost-effective", "enterprise value", or "high-ROI".
Claims of "unlimited free" usage are false and strictly forbidden; our trial model consists of a 14-day structured enterprise pilot.
Never guarantee that software is "100% bug-free" or infallible. Such statements represent severe legal liability.
Claims regarding platform metrics must strictly adhere to verified benchmarks: "ApexFlow processes up to 10,000 tasks per second with a 99.99% uptime guarantee."
    `.trim();

    const brandDoc = await BrandDocument.create({
      organizationId: org._id,
      uploadedBy: reviewerUser._id,
      filename: 'apexflow-brand-guidelines-2026.txt',
      originalName: 'ApexFlow_Global_Brand_Guidelines_2026.txt',
      fileType: 'txt',
      fileSize: Buffer.byteLength(sampleGuidelineText, 'utf-8'),
      extractedText: sampleGuidelineText,
      chunkCount: 3,
      status: 'processed',
      isActive: true,
    });

    const parsedChunks = DocumentParserService.chunkDocument(
      sampleGuidelineText,
      'ApexFlow Brand Guidelines 2026',
      450,
      80
    );

    for (const c of parsedChunks) {
      const embedding = await EmbeddingService.generateEmbedding(c.content);
      await GuidelineChunk.create({
        documentId: brandDoc._id,
        organizationId: org._id,
        chunkIndex: c.chunkIndex,
        content: c.content,
        embedding,
        metadata: {
          title: c.title,
          category: 'Brand Guidelines',
          charCount: c.charCount,
        },
        isActive: true,
      });
    }

    // 5. Create Sample Content Submission intentionally containing violations
    const samplePostContent = `Hey guys! We are super hyped to announce that the new ApexFlow tool is finally out! It is the cheapest and best in the world, guaranteed 100% bug-free with unlimited free access forever! Bruh, you gotta try this insane deal today.`;

    const submission = await ContentSubmission.create({
      organizationId: org._id,
      creatorId: creatorUser._id,
      title: 'Q2 Product Launch Social Campaign Announcement',
      contentType: 'social_media',
      originalContent: samplePostContent,
      currentContent: samplePostContent,
      status: 'needs_changes',
      version: 1,
      contentHistory: [
        {
          content: samplePostContent,
          modifiedAt: new Date(),
          reason: 'Initial creator draft submitted for brand compliance evaluation.',
        },
      ],
    });

    // 6. Run Initial Real Analysis on the sample submission
    const ragResult = await RAGService.retrieveRelevantKnowledge(org._id, samplePostContent, 5);
    const analysisResult = await AnalysisService.analyzeContent(
      samplePostContent,
      'social_media',
      submission.title,
      ragResult
    );

    const report = await AnalysisReport.create({
      submissionId: submission._id,
      organizationId: org._id,
      analyzedContent: samplePostContent,
      overallComplianceScore: analysisResult.overallComplianceScore,
      status: analysisResult.status,
      summary: analysisResult.summary,
      findings: analysisResult.findings,
      retrievedChunkIds: ragResult.guidelineChunkIds,
      aiModelUsed: 'gemini-2.5-flash',
      processingTimeMs: 850,
    });

    submission.latestAnalysisId = report._id as mongoose.Types.ObjectId;
    await submission.save();

    console.log('[SeedService] Demo data successfully initialized for ApexFlow Technologies!');
    return {
      success: true,
      organization: { id: org._id, name: org.name, slug: org.slug },
      accounts: {
        creator: { email: 'creator@brandlens.demo', password: 'DemoCreator123!', role: 'creator' },
        reviewer: { email: 'reviewer@brandlens.demo', password: 'DemoReviewer123!', role: 'reviewer' },
      },
      sampleSubmissionId: submission._id,
    };
  }
}
