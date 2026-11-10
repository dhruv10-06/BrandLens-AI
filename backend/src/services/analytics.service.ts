import mongoose from 'mongoose';
import { ContentSubmission } from '../models/ContentSubmission.js';
import { AnalysisReport, IFinding } from '../models/AnalysisReport.js';
import { ReviewDecision } from '../models/ReviewDecision.js';
import { BrandDocument } from '../models/BrandDocument.js';
import { ApprovedFact } from '../models/ApprovedFact.js';

export interface GovernanceMetrics {
  kpis: {
    totalSubmissions: number;
    averageComplianceScore: number;
    averageVisualScore: number;
    approvalRate: number;
    totalViolationsDetected: number;
    criticalViolationsCount: number;
    guidelinesIndexedCount: number;
    verifiedFactsCount: number;
  };
  statusDistribution: {
    approved: number;
    rejected: number;
    needs_changes: number;
    pending_review: number;
    draft: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  visualMetrics: {
    totalVisualAssets: number;
    averageVisualScore: number;
    logoViolationCount: number;
    colorViolationCount: number;
    typographyViolationCount: number;
  };
  recurringViolations: Array<{
    phraseOrRule: string;
    category: string;
    occurrences: number;
    severity: string;
    lastDetectedAt: Date;
    sampleContext: string;
  }>;
  guidelineGaps: Array<{
    topicOrClaim: string;
    frequency: number;
    recommendation: string;
    sampleText: string;
  }>;
  timelineTrend: Array<{
    date: string;
    submissionsCount: number;
    averageScore: number;
  }>;
  policyRecommendations: Array<{
    priority: 'Urgent' | 'High' | 'Medium' | 'Informational';
    area: string;
    title: string;
    description: string;
    impact: string;
  }>;
}

export class AnalyticsService {
  /**
   * Generates comprehensive organisation-level brand governance analytics from actual MongoDB records.
   * Strictly filtered by organizationId to ensure tenant data isolation.
   */
  public static async getOrganizationAnalytics(organizationId: string | mongoose.Types.ObjectId): Promise<GovernanceMetrics> {
    const orgId = new mongoose.Types.ObjectId(organizationId);

    // 1. Fetch counts & baseline data in parallel
    const [
      submissions,
      analysisReports,
      reviewDecisions,
      documentCount,
      factCount,
    ] = await Promise.all([
      ContentSubmission.find({ organizationId: orgId }).lean(),
      AnalysisReport.find({ organizationId: orgId }).sort({ createdAt: -1 }).lean(),
      ReviewDecision.find({ organizationId: orgId }).lean(),
      BrandDocument.countDocuments({ organizationId: orgId, isActive: true }),
      ApprovedFact.countDocuments({ organizationId: orgId, isActive: true }),
    ]);

    const totalSubmissions = submissions.length;

    // Status distribution
    const statusDistribution = {
      approved: 0,
      rejected: 0,
      needs_changes: 0,
      pending_review: 0,
      draft: 0,
    };

    submissions.forEach((sub) => {
      if (sub.status in statusDistribution) {
        statusDistribution[sub.status as keyof typeof statusDistribution]++;
      }
    });

    const reviewedCount = statusDistribution.approved + statusDistribution.rejected + statusDistribution.needs_changes;
    const approvalRate = reviewedCount > 0 ? Math.round((statusDistribution.approved / reviewedCount) * 100) : 100;

    // Scores & Findings Aggregation
    let totalScore = 0;
    let totalVisualScore = 0;
    let visualAssetCount = 0;
    let totalViolationsDetected = 0;

    const categoryMap: Record<string, number> = {};
    const severityMap = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const visualCategoryMap = { logo: 0, color: 0, typography: 0 };
    const recurringMap: Record<string, { count: number; category: string; severity: string; lastAt: Date; sample: string }> = {};
    const gapMap: Record<string, { count: number; sample: string }> = {};

    analysisReports.forEach((report) => {
      totalScore += report.overallComplianceScore || 0;

      if (report.visualAnalysis) {
        visualAssetCount++;
        totalVisualScore += report.visualAnalysis.overallVisualScore || 0;

        if (report.visualAnalysis.logoAnalysis?.complianceStatus === 'violation') {
          visualCategoryMap.logo++;
        }

        report.visualAnalysis.visualFindings?.forEach((vf) => {
          totalViolationsDetected++;
          if (vf.severity in severityMap) {
            severityMap[vf.severity as keyof typeof severityMap]++;
          }
          if (vf.category === 'Color palette consistency') visualCategoryMap.color++;
          if (vf.category === 'Typography inconsistency') visualCategoryMap.typography++;

          // Track visual recurring
          const key = `[Visual] ${vf.element}`;
          if (!recurringMap[key]) {
            recurringMap[key] = {
              count: 0,
              category: vf.category,
              severity: vf.severity,
              lastAt: report.createdAt,
              sample: vf.explanation,
            };
          }
          recurringMap[key].count++;
        });
      }

      // Text Findings
      report.findings?.forEach((f) => {
        totalViolationsDetected++;
        categoryMap[f.category] = (categoryMap[f.category] || 0) + 1;

        if (f.severity in severityMap) {
          severityMap[f.severity as keyof typeof severityMap]++;
        }

        // Track recurring phrases or rules
        const phraseKey = f.originalText.trim().toLowerCase();
        if (phraseKey.length > 2 && phraseKey.length < 50) {
          if (!recurringMap[phraseKey]) {
            recurringMap[phraseKey] = {
              count: 0,
              category: f.category,
              severity: f.severity,
              lastAt: report.createdAt,
              sample: f.explanation,
            };
          }
          recurringMap[phraseKey].count++;
        }

        // Track guideline gaps (unsupported claims)
        if (f.evidenceStatus === 'unsupported_claim') {
          const gapKey = f.originalText.trim().slice(0, 60);
          if (!gapMap[gapKey]) {
            gapMap[gapKey] = { count: 0, sample: f.explanation };
          }
          gapMap[gapKey].count++;
        }
      });
    });

    const averageComplianceScore = analysisReports.length > 0
      ? Math.round(totalScore / analysisReports.length)
      : 100;

    const averageVisualScore = visualAssetCount > 0
      ? Math.round(totalVisualScore / visualAssetCount)
      : 100;

    // Category breakdown list
    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
      percentage: totalViolationsDetected > 0 ? Math.round((count / totalViolationsDetected) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // Recurring violations list (top 6)
    const recurringViolations = Object.entries(recurringMap)
      .map(([phraseOrRule, data]) => ({
        phraseOrRule,
        category: data.category,
        occurrences: data.count,
        severity: data.severity,
        lastDetectedAt: data.lastAt,
        sampleContext: data.sample,
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 6);

    // Guideline gaps list
    const guidelineGaps = Object.entries(gapMap)
      .map(([topicOrClaim, data]) => ({
        topicOrClaim,
        frequency: data.count,
        recommendation: `Add explicit verified benchmark or policy documentation regarding "${topicOrClaim}" to prevent unsupported marketing claims.`,
        sampleText: data.sample,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Timeline trend (last 7 days or reports grouped by date)
    const timelineMap: Record<string, { total: number; sum: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timelineMap[dateStr] = { total: 0, sum: 0 };
    }

    analysisReports.forEach((rep) => {
      const dateStr = new Date(rep.createdAt).toISOString().split('T')[0];
      if (timelineMap[dateStr]) {
        timelineMap[dateStr].total++;
        timelineMap[dateStr].sum += rep.overallComplianceScore;
      }
    });

    const timelineTrend = Object.entries(timelineMap).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissionsCount: data.total,
      averageScore: data.total > 0 ? Math.round(data.sum / data.total) : averageComplianceScore,
    }));

    // Synthesize Actionable Policy Recommendations based on empirical data
    const policyRecommendations: GovernanceMetrics['policyRecommendations'] = [];

    if (severityMap.Critical > 0) {
      policyRecommendations.push({
        priority: 'Urgent',
        area: 'Prohibited Claims & Legal Liability',
        title: `Mitigate ${severityMap.Critical} Critical Brand Violations`,
        description: `Critical issues such as false guarantees or defamatory terms were detected across active drafts. Creators should be mandated to review before queue submission.`,
        impact: 'High legal and reputational risk protection',
      });
    }

    if (categoryMap['Terminology violation'] && categoryMap['Terminology violation'] > 2) {
      policyRecommendations.push({
        priority: 'High',
        area: 'Product Terminology Consistency',
        title: 'Reinforce Official Product Naming Standards',
        description: `Terminology inconsistencies were flagged ${categoryMap['Terminology violation']} times. Integrate the approved terms dictionary into copywriter onboarding.`,
        impact: 'Elevates market authority and search consistency',
      });
    }

    if (guidelineGaps.length > 0) {
      policyRecommendations.push({
        priority: 'Medium',
        area: 'Brand Guideline Documentation Gap',
        title: 'Expand Facts for Frequently Claimed Metrics',
        description: `${guidelineGaps.length} recurring promotional statements currently lack cited proof in approved brand documents.`,
        impact: 'Enables faster review approvals and grounded marketing',
      });
    }

    if (visualCategoryMap.color > 0 || visualCategoryMap.logo > 0) {
      policyRecommendations.push({
        priority: 'Medium',
        area: 'Visual Asset Palette & Logo Governance',
        title: 'Standardize Design System Palette Assets',
        description: `Detected visual drift in creative submissions (${visualCategoryMap.color} palette inconsistencies, ${visualCategoryMap.logo} logo placement alerts).`,
        impact: 'Harmonizes omnichannel visual presentation across social & ads',
      });
    }

    if (policyRecommendations.length === 0) {
      policyRecommendations.push({
        priority: 'Informational',
        area: 'General Brand Governance',
        title: 'Maintain Stellar Brand Alignment Standards',
        description: 'Submissions are demonstrating strong adherence to approved voice, terminology, and visual rules.',
        impact: 'High brand integrity sustained',
      });
    }

    return {
      kpis: {
        totalSubmissions,
        averageComplianceScore,
        averageVisualScore,
        approvalRate,
        totalViolationsDetected,
        criticalViolationsCount: severityMap.Critical,
        guidelinesIndexedCount: documentCount,
        verifiedFactsCount: factCount,
      },
      statusDistribution,
      categoryBreakdown,
      severityBreakdown: severityMap,
      visualMetrics: {
        totalVisualAssets: visualAssetCount,
        averageVisualScore,
        logoViolationCount: visualCategoryMap.logo,
        colorViolationCount: visualCategoryMap.color,
        typographyViolationCount: visualCategoryMap.typography,
      },
      recurringViolations,
      guidelineGaps,
      timelineTrend,
      policyRecommendations,
    };
  }
}

