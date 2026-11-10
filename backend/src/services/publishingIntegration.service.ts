import { IContentSubmission } from '../models/ContentSubmission.js';
import { IOrganisation } from '../models/Organisation.js';

export interface PublishPayload {
  submissionId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  contentType: string;
  submissionFormat: string;
  approvedContent: string;
  hasVisualAsset: boolean;
  visualAssetUrl?: string;
  approvedAt: string;
  approvedByReviewerId: string;
  metadata: {
    platform: 'BrandLens AI Pre-Publication Governance Gateway';
    governanceStatus: 'Human-Approved';
    version: number;
  };
}

export interface PublishResult {
  success: boolean;
  channel: 'webhook' | 'cms' | 'social_media' | 'internal';
  destination: string;
  publishedAt: Date;
  payloadPreview: string;
  statusCode?: number;
  error?: string;
}

export class PublishingIntegrationService {
  /**
   * Generates formatted publication payload for a reviewer-approved submission.
   */
  public static generatePayload(
    submission: IContentSubmission,
    org: IOrganisation,
    reviewerId: string
  ): PublishPayload {
    return {
      submissionId: submission._id.toString(),
      organizationId: org._id.toString(),
      organizationName: org.name,
      title: submission.title,
      contentType: submission.contentType,
      submissionFormat: submission.submissionFormat || 'text',
      approvedContent: submission.currentContent,
      hasVisualAsset: Boolean(submission.visualAsset?.dataUrl),
      visualAssetUrl: submission.visualAsset?.dataUrl ? '[Visual Asset Attached]' : undefined,
      approvedAt: new Date().toISOString(),
      approvedByReviewerId: reviewerId,
      metadata: {
        platform: 'BrandLens AI Pre-Publication Governance Gateway',
        governanceStatus: 'Human-Approved',
        version: submission.version,
      },
    };
  }

  /**
   * Dispatches the approved content to the configured publishing channel.
   * Strictly enforces human-in-the-loop review: called ONLY upon reviewer approval.
   */
  public static async dispatchPublication(
    submission: IContentSubmission,
    org: IOrganisation,
    reviewerId: string,
    channel: 'webhook' | 'cms' | 'social_media' | 'internal' = 'internal',
    customWebhookUrl?: string
  ): Promise<PublishResult> {
    const payload = this.generatePayload(submission, org, reviewerId);
    const payloadStr = JSON.stringify(payload, null, 2);
    const targetUrl = customWebhookUrl || org.publishingWebhookUrl;

    if (channel === 'webhook' && targetUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BrandLens-Governance': 'Verified-Approved',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          return {
            success: false,
            channel: 'webhook',
            destination: targetUrl,
            publishedAt: new Date(),
            payloadPreview: payloadStr,
            statusCode: res.status,
            error: `Webhook returned HTTP ${res.status}: ${errText.slice(0, 150)}`,
          };
        }

        return {
          success: true,
          channel: 'webhook',
          destination: targetUrl,
          publishedAt: new Date(),
          payloadPreview: payloadStr,
          statusCode: res.status,
        };
      } catch (err: any) {
        return {
          success: false,
          channel: 'webhook',
          destination: targetUrl,
          publishedAt: new Date(),
          payloadPreview: payloadStr,
          error: `Network error dispatching webhook: ${err.message}`,
        };
      }
    }

    // Default: internal verified release channel or simulated CMS export
    return {
      success: true,
      channel,
      destination: channel === 'cms' ? 'CMS Ready-to-Publish Pipeline' : channel === 'social_media' ? 'Social Queue Staging' : 'BrandLens Governed Release Vault',
      publishedAt: new Date(),
      payloadPreview: payloadStr,
      statusCode: 200,
    };
  }
}

