/**
 * PDF Export Utility for BTG Platform
 * Generates printable PDFs of lessons and worksheets for Kami compatibility
 *
 * Features:
 * - Export individual modules as worksheets
 * - Export weekly summary sheets
 * - Student-friendly print layout
 * - Compatible with Kami annotation tools
 */

import { isFeatureEnabled } from './featureFlags';
import type { Module, WeekContent } from './types';

// ============================================
// TYPES
// ============================================

interface PDFOptions {
  includeVocabulary?: boolean;
  includeActivity?: boolean;
  includeAssignment?: boolean;
  includeKeyPoints?: boolean;
  studentName?: string;
  className?: string;
  date?: string;
}

interface WorksheetData {
  title: string;
  subtitle?: string;
  studentName?: string;
  date?: string;
  sections: Array<{
    heading: string;
    content: string;
    type: 'text' | 'lines' | 'box';
    lines?: number;
  }>;
}

// ============================================
// HTML TEMPLATE
// ============================================

function generatePDFHTML(data: WorksheetData): string {
  const sections = data.sections.map((section) => {
    if (section.type === 'lines') {
      const lineCount = section.lines || 5;
      const lines = Array(lineCount)
        .fill('<div class="answer-line"></div>')
        .join('');
      return `
        <div class="section">
          <h2>${section.heading}</h2>
          ${section.content ? `<p class="instruction">${section.content}</p>` : ''}
          <div class="answer-area">${lines}</div>
        </div>
      `;
    } else if (section.type === 'box') {
      return `
        <div class="section">
          <h2>${section.heading}</h2>
          ${section.content ? `<p class="instruction">${section.content}</p>` : ''}
          <div class="answer-box"></div>
        </div>
      `;
    } else {
      return `
        <div class="section">
          <h2>${section.heading}</h2>
          <div class="content">${section.content}</div>
        </div>
      `;
    }
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    @page {
      margin: 1in;
      size: letter;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 7.5in;
      margin: 0 auto;
      padding: 0.5in;
    }

    header {
      border-bottom: 2px solid #333;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 24pt;
      margin: 0 0 8px 0;
      color: #1a365d;
    }

    .subtitle {
      font-size: 14pt;
      color: #4a5568;
      margin: 0;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .meta-item {
      font-size: 10pt;
    }

    .meta-label {
      color: #718096;
    }

    .meta-line {
      border-bottom: 1px solid #333;
      min-width: 150px;
      display: inline-block;
      margin-left: 8px;
    }

    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    h2 {
      font-size: 14pt;
      color: #2d3748;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 0 0 12px 0;
    }

    .instruction {
      font-style: italic;
      color: #4a5568;
      margin: 0 0 12px 0;
    }

    .content {
      margin: 0;
    }

    .content p {
      margin: 0 0 12px 0;
    }

    .answer-line {
      border-bottom: 1px solid #cbd5e0;
      height: 32px;
      margin-bottom: 4px;
    }

    .answer-box {
      border: 1px solid #cbd5e0;
      min-height: 150px;
      border-radius: 4px;
    }

    .answer-area {
      margin-top: 8px;
    }

    .vocabulary-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .vocabulary-list li {
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
    }

    .vocabulary-list li:last-child {
      border-bottom: none;
    }

    .vocab-term {
      font-weight: bold;
      color: #2d3748;
    }

    .key-points {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .key-points li {
      padding: 8px 0 8px 24px;
      position: relative;
    }

    .key-points li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #48bb78;
    }

    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 10pt;
      color: #718096;
      text-align: center;
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <header>
    <h1>${data.title}</h1>
    ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}
    <div class="meta">
      <span class="meta-item">
        <span class="meta-label">Name:</span>
        <span class="meta-line">${data.studentName || ''}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Date:</span>
        <span class="meta-line">${data.date || ''}</span>
      </span>
    </div>
  </header>

  <main>
    ${sections}
  </main>

  <footer>
    Beyond The Game Financial Literacy Program
  </footer>
</body>
</html>
`;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export a single module as a printable worksheet
 */
export async function exportModuleAsPDF(
  module: Module,
  options: PDFOptions = {}
): Promise<Blob> {
  if (!isFeatureEnabled('pdfExport')) {
    throw new Error('PDF export is not enabled');
  }

  const sections: WorksheetData['sections'] = [];

  // Lesson content
  sections.push({
    heading: 'Today\'s Lesson',
    content: module.lesson_content,
    type: 'text',
  });

  // Vocabulary
  if (options.includeVocabulary !== false && module.vocabulary?.length > 0) {
    const vocabHTML = `
      <ul class="vocabulary-list">
        ${module.vocabulary.map((v) => `
          <li><span class="vocab-term">${v.term}:</span> ${v.definition}</li>
        `).join('')}
      </ul>
    `;
    sections.push({
      heading: 'Key Vocabulary',
      content: vocabHTML,
      type: 'text',
    });
  }

  // Key Points
  if (options.includeKeyPoints !== false && module.key_points?.length > 0) {
    const pointsHTML = `
      <ul class="key-points">
        ${module.key_points.map((p) => `<li>${p}</li>`).join('')}
      </ul>
    `;
    sections.push({
      heading: 'Key Takeaways',
      content: pointsHTML,
      type: 'text',
    });
  }

  // Activity
  if (options.includeActivity !== false && module.activity_description) {
    sections.push({
      heading: 'Class Activity',
      content: module.activity_description,
      type: 'text',
    });
  }

  // Assignment
  if (options.includeAssignment !== false && module.assignment_prompt) {
    sections.push({
      heading: 'Written Assignment',
      content: module.assignment_prompt,
      type: 'lines',
      lines: 8,
    });
  }

  const worksheetData: WorksheetData = {
    title: module.title,
    subtitle: `Week ${module.week_number} • Day ${module.day_number} • Module ${module.module_number}`,
    studentName: options.studentName,
    date: options.date || new Date().toLocaleDateString(),
    sections,
  };

  const html = generatePDFHTML(worksheetData);
  return new Blob([html], { type: 'text/html' });
}

/**
 * Export a daily worksheet (all 4 modules for a day)
 */
export async function exportDayAsPDF(
  weekNumber: number,
  dayNumber: number,
  modules: Module[],
  options: PDFOptions = {}
): Promise<Blob> {
  if (!isFeatureEnabled('pdfExport')) {
    throw new Error('PDF export is not enabled');
  }

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const sections: WorksheetData['sections'] = [];

  modules.forEach((module, index) => {
    sections.push({
      heading: `Module ${index + 1}: ${module.title}`,
      content: module.lesson_content.slice(0, 500) + '...',
      type: 'text',
    });

    if (module.assignment_prompt) {
      sections.push({
        heading: `Reflection ${index + 1}`,
        content: module.assignment_prompt,
        type: 'lines',
        lines: 4,
      });
    }
  });

  const worksheetData: WorksheetData = {
    title: `Day ${dayNumber}: ${dayNames[dayNumber - 1]}`,
    subtitle: `Week ${weekNumber} Daily Worksheet`,
    studentName: options.studentName,
    date: options.date || new Date().toLocaleDateString(),
    sections,
  };

  const html = generatePDFHTML(worksheetData);
  return new Blob([html], { type: 'text/html' });
}

/**
 * Export a weekly summary sheet
 */
export async function exportWeekSummaryAsPDF(
  weekContent: WeekContent,
  options: PDFOptions = {}
): Promise<Blob> {
  if (!isFeatureEnabled('pdfExport')) {
    throw new Error('PDF export is not enabled');
  }

  const sections: WorksheetData['sections'] = [];

  // Week overview
  sections.push({
    heading: 'This Week\'s Topics',
    content: weekContent.days
      .map((day) => `<p><strong>Day ${day.day_number}:</strong> ${day.modules.map((m) => m.title).join(', ')}</p>`)
      .join(''),
    type: 'text',
  });

  // Reflection questions
  sections.push({
    heading: 'Weekly Reflection',
    content: 'What was the most important thing you learned this week?',
    type: 'lines',
    lines: 4,
  });

  sections.push({
    heading: '',
    content: 'How can you apply what you learned to your own financial decisions?',
    type: 'lines',
    lines: 4,
  });

  sections.push({
    heading: '',
    content: 'What questions do you still have about this week\'s topics?',
    type: 'lines',
    lines: 3,
  });

  const worksheetData: WorksheetData = {
    title: `Week ${weekContent.week_number}: ${weekContent.week_title}`,
    subtitle: 'Weekly Summary & Reflection',
    studentName: options.studentName,
    date: options.date || new Date().toLocaleDateString(),
    sections,
  };

  const html = generatePDFHTML(worksheetData);
  return new Blob([html], { type: 'text/html' });
}

/**
 * Open print dialog for a PDF
 */
export function printPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Download a PDF file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  exportModuleAsPDF,
  exportDayAsPDF,
  exportWeekSummaryAsPDF,
  printPDF,
  downloadPDF,
};
