import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Organisation } from '../src/models/Organisation.js';
import { ContentSubmission } from '../src/models/ContentSubmission.js';
import { AnalysisReport } from '../src/models/AnalysisReport.js';
import { AnalysisService } from '../src/services/analysis.service.js';

const app = createApp();

describe('Submission Lifecycle & Self-Healing Regression Tests', () => {
  let creatorToken = '';
  let creatorUser: any;
  let org: any;

  beforeAll(async () => {
    await connectDB();

    // Clean test records
    await Organisation.deleteMany({ slug: 'lifecycle-test-org' });
    await User.deleteMany({ email: 'lifecycle-creator@brandlens.io' });
    await ContentSubmission.deleteMany({});
    await AnalysisReport.deleteMany({});

    org = await Organisation.create({
      name: 'Lifecycle Test Org',
      slug: 'lifecycle-test-org',
      brandVoiceSummary: 'Professional, direct, clear enterprise software tone.',
    });

    const cRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Lifecycle Creator',
        email: 'lifecycle-creator@brandlens.io',
        password: 'Password123!',
        orgSlug: 'lifecycle-test-org',
      });

    creatorToken = cRes.body.token;
    creatorUser = cRes.body.user;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('1. Successful AI analysis updates the submission to the appropriate completed state', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Quarterly Cloud Migration Overview',
        contentType: 'blog',
        submissionFormat: 'text',
        content: 'ApexFlow Platform delivers secure, reliable infrastructure for enterprise software systems.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.status).not.toBe('analysing');
    expect(['pending_review', 'needs_changes']).toContain(res.body.submission.status);
    expect(res.body.submission.latestAnalysisId).toBeDefined();

    // Verify in MongoDB
    const sub = await ContentSubmission.findById(res.body.submission._id);
    expect(sub).toBeDefined();
    expect(sub!.status).not.toBe('analysing');
    expect(sub!.status).toBe(res.body.submission.status);
    expect(sub!.latestAnalysisId).toBeDefined();
  });

  it('2. Failed initial analysis does not leave the submission stuck in analysing (saves as draft fallback)', async () => {
    // Force AnalysisService.analyzeContent to throw
    const originalAnalyze = AnalysisService.analyzeContent;
    vi.spyOn(AnalysisService, 'analyzeContent').mockRejectedValueOnce(
      new Error('Gemini API network timeout simulated for test')
    );

    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Draft Submission With Failing AI Service',
        contentType: 'social_media',
        submissionFormat: 'text',
        content: 'Check out our new release notes and architectural whitepapers today.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.submission.status).toBe('draft');
    expect(res.body.analysis).toBeNull();
    expect(res.body.warning).toContain('Gemini API network timeout simulated');

    // Verify MongoDB status is 'draft', not 'analysing'
    const sub = await ContentSubmission.findById(res.body.submission._id);
    expect(sub).toBeDefined();
    expect(sub!.status).toBe('draft');
    expect(sub!.latestAnalysisId).toBeUndefined();

    // Restore original
    vi.restoreAllMocks();
  });

  it('3. Failed re-analysis preserves the previous valid status', async () => {
    // Create a submission in 'needs_changes' state
    const sub = await ContentSubmission.create({
      organizationId: org._id,
      creatorId: creatorUser.id,
      title: 'Revision In Progress Test',
      contentType: 'email',
      submissionFormat: 'text',
      originalContent: 'Initial draft copy needing revision.',
      currentContent: 'Revised copy awaiting brand re-analysis.',
      status: 'needs_changes',
      version: 1,
      contentHistory: [{ content: 'Initial draft copy', modifiedAt: new Date() }],
    });

    // Mock re-analysis failure
    vi.spyOn(AnalysisService, 'analyzeContent').mockRejectedValueOnce(
      new Error('Gemini 503 Service Unavailable simulated')
    );

    const res = await request(app)
      .post(`/api/submissions/${sub._id}/reanalyze`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Re-analysis failed');

    // Verify MongoDB status is restored to 'needs_changes', NOT stuck in 'analysing'
    const updatedSub = await ContentSubmission.findById(sub._id);
    expect(updatedSub!.status).toBe('needs_changes');
    expect(updatedSub!.status).not.toBe('analysing');

    vi.restoreAllMocks();
  });

  it('4. Existing submissions with a valid report but analysing status are reconciled correctly', async () => {
    // Simulate legacy/stuck submission: score 95, no violations, but status stuck in 'analysing'
    const stuckSub = await ContentSubmission.create({
      organizationId: org._id,
      creatorId: creatorUser.id,
      title: 'Legacy Stuck Submission With Report',
      contentType: 'blog',
      submissionFormat: 'text',
      originalContent: 'Compliant content that completed analysis but stayed analysing.',
      currentContent: 'Compliant content that completed analysis but stayed analysing.',
      status: 'analysing',
      version: 1,
      contentHistory: [{ content: 'Content', modifiedAt: new Date() }],
    });

    const report = await AnalysisReport.create({
      submissionId: stuckSub._id,
      organizationId: org._id,
      analyzedContent: stuckSub.currentContent,
      overallComplianceScore: 95,
      status: 'passed',
      summary: 'Fully compliant brand copy.',
      findings: [],
      retrievedChunkIds: [],
      aiModelUsed: 'gemini-3.8-flash',
    });

    await ContentSubmission.updateOne(
      { _id: stuckSub._id },
      { $set: { latestAnalysisId: report._id, status: 'analysing', updatedAt: new Date(Date.now() - 40000) } },
      { timestamps: false }
    );

    // Call GET /api/submissions - triggers proactive reconciliation
    const listRes = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(listRes.status).toBe(200);
    const targetInList = listRes.body.submissions.find((s: any) => s._id === stuckSub._id.toString());
    expect(targetInList).toBeDefined();
    expect(targetInList.status).toBe('pending_review');

    // Verify persisted record in MongoDB was reconciled
    const refreshed = await ContentSubmission.findById(stuckSub._id);
    expect(refreshed!.status).toBe('pending_review');
  });

  it('5. Submissions without a report are not falsely presented as compliant (reconciled to draft)', async () => {
    // Simulate orphaned submission: analysis crashed during creation, no report ever created
    const orphanedSub = await ContentSubmission.create({
      organizationId: org._id,
      creatorId: creatorUser.id,
      title: 'Orphaned Submission Without Analysis Report',
      contentType: 'advertisement',
      submissionFormat: 'text',
      originalContent: 'Unanalyzed promotional claim copy.',
      currentContent: 'Unanalyzed promotional claim copy.',
      status: 'analysing',
      version: 1,
      contentHistory: [{ content: 'Unanalyzed promotional claim copy.', modifiedAt: new Date() }],
    });

    await ContentSubmission.updateOne(
      { _id: orphanedSub._id },
      { $set: { updatedAt: new Date(Date.now() - 45000), createdAt: new Date(Date.now() - 45000) } },
      { timestamps: false }
    );

    // Call GET /api/submissions/:id - triggers single-item reconciliation
    const getRes = await request(app)
      .get(`/api/submissions/${orphanedSub._id}`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.submission.status).toBe('draft');
    expect(getRes.body.submission.latestAnalysisId).toBeFalsy();

    // Verify in MongoDB
    const refreshed = await ContentSubmission.findById(orphanedSub._id);
    expect(refreshed!.status).toBe('draft');
    expect(refreshed!.status).not.toBe('pending_review');
    expect(refreshed!.status).not.toBe('approved');
  });
});

