import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organisation } from '../src/models/Organisation.js';
import { ContentSubmission } from '../src/models/ContentSubmission.js';
import { AnalysisReport } from '../models/AnalysisReport.js';
import { VisualAnalysisService } from '../src/services/visualAnalysis.service.js';
import { AnalyticsService } from '../src/services/analytics.service.js';
import { PublishingIntegrationService } from '../src/services/publishingIntegration.service.js';

const app = createApp();

describe('Round 3 Mandatory Improvements: Visual Compliance, Analytics & Multi-Format Intelligence', () => {
  let creatorToken = '';
  let reviewerToken = '';
  let creatorUser: any;
  let reviewerUser: any;
  let org: any;
  let foreignOrg: any;
  let foreignToken = '';

  beforeAll(async () => {
    await connectDB();

    // Clean test records
    await Organisation.deleteMany({ slug: { $in: ['round3-test-org', 'round3-foreign-org'] } });
    await User.deleteMany({ email: { $in: ['r3creator@brandlens.io', 'r3reviewer@brandlens.io', 'foreign@brandlens.io'] } });

    org = await Organisation.create({
      name: 'Round 3 Apex Enterprises',
      slug: 'round3-test-org',
      brandVoiceSummary: 'Authoritative, technical, clear.',
      brandVisualRules: {
        primaryColors: ['#4F46E5', '#0F172A', '#FFFFFF'],
        secondaryColors: ['#10B981', '#6366F1'],
        prohibitedColors: ['#FF1493', '#FFFF00'],
        logoGuidelines: 'Top-left placement with clear margin.',
        typographyRules: 'Modern sans-serif typefaces.',
      },
      publishingWebhookUrl: 'https://webhook.site/brandlens-test-endpoint',
    });

    foreignOrg = await Organisation.create({
      name: 'Foreign Org Ltd',
      slug: 'round3-foreign-org',
    });

    // Register creator in org
    const cRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'R3 Creator',
        email: 'r3creator@brandlens.io',
        password: 'Password123!',
        orgSlug: 'round3-test-org',
      });
    creatorToken = cRes.body.token;
    creatorUser = cRes.body.user;

    // Register foreign user
    const fRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Foreign User',
        email: 'foreign@brandlens.io',
        password: 'Password123!',
        orgSlug: 'round3-foreign-org',
      });
    foreignToken = fRes.body.token;

    // Create Reviewer in org directly
    const salt = '$2a$10$abcdefghijklmnopqrstuu';
    reviewerUser = await User.create({
      name: 'R3 Reviewer',
      email: 'r3reviewer@brandlens.io',
      passwordHash: '$2a$10$7Z8qM8sJ8sJ8sJ8sJ8sJ8e7Z8qM8sJ8sJ8sJ8sJ8sJ8e7Z8qM8sJ',
      role: 'reviewer',
      organizationId: org._id,
    });

    // Log in reviewer to get valid JWT
    const rRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'r3creator@brandlens.io', password: 'Password123!' });
    // Use jwt signed manually with reviewer role
    const jwt = (await import('jsonwebtoken')).default;
    const { ENV } = await import('../src/config/env.js');
    reviewerToken = jwt.sign(
      { id: reviewerUser._id.toString(), email: reviewerUser.email, role: 'reviewer', organizationId: org._id.toString() },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await disconnectDB();
  });

  // ----------------------------------------------------
  // IMPROVEMENT 1: Visual Brand Compliance Engine Tests
  // ----------------------------------------------------
  describe('Improvement 1: Visual Brand Compliance Engine', () => {
    it('should analyze image asset and flag unapproved colors and missing logo', async () => {
      const sampleSvg = `<svg><rect fill="#FF1493" width="100" height="100"/><text>Test</text></svg>`;
      const base64 = Buffer.from(sampleSvg).toString('base64');

      const result = await VisualAnalysisService.analyzeImage(
        base64,
        'image/svg+xml',
        org,
        'Test Ad Banner',
        'We are super hyped about this!'
      );

      expect(result).toBeDefined();
      expect(result.overallVisualScore).toBeLessThan(90);
      expect(result.status).toBe('violations_found');
      expect(result.detectedColors.length).toBeGreaterThan(0);
      expect(result.visualFindings.length).toBeGreaterThan(0);

      const colorViolation = result.visualFindings.find((f) => f.category === 'Color palette consistency');
      expect(colorViolation).toBeDefined();
      expect(colorViolation?.severity).toBe('High');

      const logoFinding = result.visualFindings.find((f) => f.category === 'Logo usage & placement');
      expect(logoFinding).toBeDefined();
    });

    it('should submit multi-format content (copy + visual asset) and generate composite compliance report', async () => {
      const sampleSvg = `<svg><rect fill="#FF1493" width="100" height="100"/></svg>`;
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(sampleSvg).toString('base64')}`;

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Q3 Visual Ad Campaign',
          contentType: 'advertisement',
          submissionFormat: 'multi_format',
          content: 'Brand new ApexFlow Platform enterprise announcement.',
          visualAsset: {
            filename: 'ad_banner.svg',
            fileType: 'image/svg+xml',
            fileSize: 1024,
            dataUrl,
            dimensions: { width: 800, height: 418 },
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.submissionFormat).toBe('multi_format');
      expect(res.body.submission.visualAsset).toBeDefined();
      expect(res.body.analysis.visualAnalysis).toBeDefined();
      expect(res.body.analysis.visualAnalysis.detectedColors.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------
  // IMPROVEMENT 2: Intelligent Brand Governance & Analytics
  // ----------------------------------------------------
  describe('Improvement 2: Intelligent Brand Governance & Analytics', () => {
    it('should generate real organization analytics metrics with category breakdowns and recurring issues', async () => {
      const metrics = await AnalyticsService.getOrganizationAnalytics(org._id);

      expect(metrics).toBeDefined();
      expect(metrics.kpis.totalSubmissions).toBeGreaterThan(0);
      expect(metrics.categoryBreakdown).toBeInstanceOf(Array);
      expect(metrics.severityBreakdown).toBeDefined();
      expect(metrics.severityBreakdown.Critical).toBeGreaterThanOrEqual(0);
      expect(metrics.timelineTrend.length).toBe(7);
      expect(metrics.policyRecommendations.length).toBeGreaterThan(0);
    });

    it('should expose /api/analytics endpoint strictly isolated to authenticated user organization', async () => {
      const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.kpis.totalSubmissions).toBeGreaterThanOrEqual(1);

      // Foreign user should see 0 submissions for their own empty org
      const foreignRes = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${foreignToken}`);

      expect(foreignRes.status).toBe(200);
      expect(foreignRes.body.metrics.kpis.totalSubmissions).toBe(0);
    });
  });

  // ----------------------------------------------------
  // IMPROVEMENT 3: Multi-Format Content & Publishing Integrations
  // ----------------------------------------------------
  describe('Improvement 3: Multi-Format Content & Publishing Integrations', () => {
    let testSubId = '';

    beforeAll(async () => {
      const sub = await ContentSubmission.create({
        organizationId: org._id,
        creatorId: creatorUser.id,
        title: 'Publishable Product Release',
        contentType: 'blog',
        submissionFormat: 'text',
        originalContent: 'Verified ApexFlow Platform release notes for enterprise clients.',
        currentContent: 'Verified ApexFlow Platform release notes for enterprise clients.',
        status: 'pending_review',
        version: 1,
      });
      testSubId = sub._id.toString();
    });

    it('should allow reviewer to preview publishing payload before approving', async () => {
      const res = await request(app)
        .get(`/api/review/preview-publish/${testSubId}`)
        .set('Authorization', `Bearer ${reviewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.payload.title).toBe('Publishable Product Release');
      expect(res.body.payload.metadata.governanceStatus).toBe('Human-Approved');
    });

    it('should execute publishing dispatch when reviewer approves submission', async () => {
      const res = await request(app)
        .post(`/api/review/decision/${testSubId}`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({
          decision: 'approved',
          comments: 'Brand guidelines verified. Approved for immediate publication.',
          publishChannel: 'internal',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.submission.status).toBe('approved');
      expect(res.body.publishingResult).toBeDefined();
      expect(res.body.publishingResult.success).toBe(true);
      expect(res.body.submission.publishingDetails.status).toBe('published');
    });

    it('should extract text from uploaded document draft via /upload-draft-document', async () => {
      const draftContent = Buffer.from('ApexFlow Platform Q3 Overview\nClean enterprise governance copy.');

      const res = await request(app)
        .post('/api/submissions/upload-draft-document')
        .set('Authorization', `Bearer ${creatorToken}`)
        .attach('file', draftContent, 'draft_announcement.txt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.extractedText).toContain('ApexFlow Platform Q3 Overview');
      expect(res.body.charCount).toBeGreaterThan(0);
    });
  });
});

