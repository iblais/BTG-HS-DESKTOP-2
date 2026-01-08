/**
 * External Integrations Service for BTG Platform
 * Handles Google Classroom, Kami, and other third-party integrations
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface GoogleClassroomClass {
  id: string;
  name: string;
  section: string | null;
  enrollmentCode: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED';
}

export interface GoogleClassroomStudent {
  userId: string;
  profile: {
    id: string;
    name: {
      fullName: string;
    };
    emailAddress: string;
  };
}

export interface IntegrationStatus {
  googleClassroom: {
    connected: boolean;
    lastSync: string | null;
    classCount: number;
  };
  kami: {
    enabled: boolean;
    apiKey: string | null;
  };
}

// ============================================
// GOOGLE CLASSROOM INTEGRATION
// ============================================

/**
 * Check if Google Classroom is configured for a teacher
 */
export async function getGoogleClassroomStatus(teacherId: string): Promise<{
  connected: boolean;
  lastSync: string | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('google_classroom_id, updated_at')
      .eq('teacher_id', teacherId)
      .not('google_classroom_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return {
      connected: (data?.length || 0) > 0,
      lastSync: data?.[0]?.updated_at || null,
    };
  } catch (err) {
    console.error('[Integrations] Error checking Google Classroom status:', err);
    return {
      connected: false,
      lastSync: null,
      error: 'Failed to check Google Classroom status',
    };
  }
}

/**
 * Link a BTG class to a Google Classroom course
 * Note: Full implementation requires OAuth token from frontend
 */
export async function linkGoogleClassroom(
  classId: string,
  googleClassroomId: string,
  googleClassroomLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('classes')
      .update({
        google_classroom_id: googleClassroomId,
        google_classroom_link: googleClassroomLink,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[Integrations] Error linking Google Classroom:', err);
    return { success: false, error: 'Failed to link Google Classroom' };
  }
}

/**
 * Unlink a BTG class from Google Classroom
 */
export async function unlinkGoogleClassroom(
  classId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('classes')
      .update({
        google_classroom_id: null,
        google_classroom_link: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', classId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[Integrations] Error unlinking Google Classroom:', err);
    return { success: false, error: 'Failed to unlink Google Classroom' };
  }
}

/**
 * Generate a share link for Google Classroom assignment
 */
export function getGoogleClassroomShareUrl(
  weekNumber: number,
  programId: string,
  baseUrl: string = window.location.origin
): string {
  const lessonUrl = `${baseUrl}/lesson/${programId}/week/${weekNumber}`;
  return `https://classroom.google.com/share?url=${encodeURIComponent(lessonUrl)}`;
}

// ============================================
// KAMI INTEGRATION
// ============================================

/**
 * Check if content is Kami-compatible
 * Kami works best with PDF documents
 */
export function isKamiCompatible(contentType: string): boolean {
  const compatibleTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'image'];
  return compatibleTypes.some(type =>
    contentType.toLowerCase().includes(type)
  );
}

/**
 * Generate Kami viewer URL for a document
 * Note: Requires Kami API key for full functionality
 */
export function getKamiViewerUrl(documentUrl: string): string {
  return `https://web.kamihq.com/web/viewer.html?source=${encodeURIComponent(documentUrl)}`;
}

/**
 * Generate printable/PDF-friendly version of lesson content
 */
export function formatLessonForPrint(
  weekNumber: number,
  title: string,
  content: string,
  keyPoints: string[]
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Week ${weekNumber}: ${title} - Beyond The Game</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #4A5FFF;
      border-bottom: 2px solid #4A5FFF;
      padding-bottom: 10px;
    }
    h2 {
      color: #FF6B35;
      margin-top: 30px;
    }
    .week-badge {
      background: #4A5FFF;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      display: inline-block;
      margin-bottom: 10px;
    }
    .key-points {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .key-points h3 {
      margin-top: 0;
      color: #50D890;
    }
    .key-points ul {
      margin-bottom: 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    @media print {
      body { padding: 20px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="week-badge">Week ${weekNumber}</div>
  <h1>${title}</h1>

  ${content.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('\n')}

  <div class="key-points">
    <h3>Key Points</h3>
    <ul>
      ${keyPoints.map(point => `<li>${point}</li>`).join('\n')}
    </ul>
  </div>

  <div class="footer">
    <p>Beyond The Game - Financial Literacy for Athletes</p>
    <p>www.beyondthegame.io</p>
  </div>
</body>
</html>
`.trim();
}

/**
 * Export lesson as downloadable PDF (via print dialog)
 */
export function exportLessonAsPDF(
  weekNumber: number,
  title: string,
  content: string,
  keyPoints: string[]
): void {
  const html = formatLessonForPrint(weekNumber, title, content, keyPoints);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Delay print to ensure styles are loaded
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// ============================================
// LMS EXPORT (for broader compatibility)
// ============================================

/**
 * Export course content as SCORM-compatible package metadata
 * This is a simplified manifest for LMS compatibility
 */
export function generateSCORMManifest(
  programId: string,
  programTitle: string,
  totalWeeks: number
): string {
  const manifest = {
    schemaVersion: '1.2',
    manifest: {
      identifier: `btg-${programId.toLowerCase()}-${Date.now()}`,
      organizations: {
        default: {
          identifier: `btg-${programId.toLowerCase()}`,
          title: programTitle,
          items: Array.from({ length: totalWeeks }, (_, i) => ({
            identifier: `week-${i + 1}`,
            title: `Week ${i + 1}`,
            identifierref: `res-week-${i + 1}`,
          })),
        },
      },
      resources: Array.from({ length: totalWeeks }, (_, i) => ({
        identifier: `res-week-${i + 1}`,
        type: 'webcontent',
        href: `weeks/week${i + 1}/index.html`,
      })),
    },
  };

  return JSON.stringify(manifest, null, 2);
}

// ============================================
// CONTENT SHARING
// ============================================

/**
 * Generate a shareable link for a specific week's content
 */
export function getShareableLink(
  programId: string,
  weekNumber: number,
  baseUrl: string = window.location.origin
): {
  directLink: string;
  googleClassroomShare: string;
  microsoftTeamsShare: string;
  copyToClipboard: string;
} {
  const lessonUrl = `${baseUrl}/lesson/${programId.toLowerCase()}/week/${weekNumber}`;

  return {
    directLink: lessonUrl,
    googleClassroomShare: `https://classroom.google.com/share?url=${encodeURIComponent(lessonUrl)}`,
    microsoftTeamsShare: `https://teams.microsoft.com/share?href=${encodeURIComponent(lessonUrl)}`,
    copyToClipboard: lessonUrl,
  };
}

export default {
  // Google Classroom
  getGoogleClassroomStatus,
  linkGoogleClassroom,
  unlinkGoogleClassroom,
  getGoogleClassroomShareUrl,

  // Kami
  isKamiCompatible,
  getKamiViewerUrl,
  formatLessonForPrint,
  exportLessonAsPDF,

  // LMS
  generateSCORMManifest,

  // Sharing
  getShareableLink,
};
