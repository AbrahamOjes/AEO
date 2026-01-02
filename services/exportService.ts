import { AEOReport, QueryResult } from '../types';

export const exportToCSV = (report: AEOReport): void => {
  const headers = [
    'Query',
    'AI Model',
    'Mentioned',
    'Position',
    'Sentiment',
    'Competitors Mentioned',
    'Citation URL',
    'Raw Response'
  ];

  const rows = report.results.map((r: QueryResult) => [
    `"${r.query_text.replace(/"/g, '""')}"`,
    r.model,
    r.mentioned ? 'Yes' : 'No',
    r.position,
    r.sentiment,
    `"${r.competitors_mentioned.join(', ')}"`,
    r.citation_url || '',
    `"${r.raw_response.replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ]);

  const csvContent = [
    `AEO Visibility Report - ${report.brand_name}`,
    `Generated: ${new Date(report.created_at).toLocaleString()}`,
    `Overall Score: ${report.overall_score}%`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  downloadFile(csvContent, `aeo-report-${report.brand_name.toLowerCase().replace(/\s+/g, '-')}.csv`, 'text/csv');
};

export const exportToPDF = (report: AEOReport): void => {
  const htmlContent = generatePDFHTML(report);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
};

const generatePDFHTML = (report: AEOReport): string => {
  const getScoreColor = (score: number) => {
    if (score >= 60) return '#10b981';
    if (score >= 30) return '#f59e0b';
    return '#ef4444';
  };

  const getPositionBadge = (position: string) => {
    const colors: Record<string, string> = {
      primary: '#dcfce7',
      secondary: '#dbeafe',
      tertiary: '#f3f4f6',
      none: '#fee2e2'
    };
    return colors[position] || '#f3f4f6';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <title>AEO Report - ${report.brand_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #4f46e5; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 14px; }
    .score-section { display: flex; justify-content: space-around; margin-bottom: 40px; }
    .score-card { text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; min-width: 150px; }
    .score-card .label { font-size: 12px; text-transform: uppercase; color: #9ca3af; font-weight: 600; }
    .score-card .value { font-size: 36px; font-weight: 800; margin: 8px 0; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #374151; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f9fafb; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-weight: 600; text-transform: uppercase; color: #6b7280; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .playbook-item { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 12px; }
    .playbook-item h4 { font-size: 14px; margin-bottom: 8px; }
    .playbook-item p { font-size: 12px; color: #6b7280; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>AEO Vision Report</h1>
    <p><strong>${report.brand_name}</strong> ${report.brand_url ? `• ${report.brand_url}` : ''}</p>
    <p>Generated: ${new Date(report.created_at).toLocaleString()}</p>
  </div>

  <div class="score-section">
    <div class="score-card">
      <div class="label">Overall Score</div>
      <div class="value" style="color: ${getScoreColor(report.overall_score)}">${report.overall_score}%</div>
    </div>
    ${Object.entries(report.model_scores).map(([model, score]) => `
      <div class="score-card">
        <div class="label">${model}</div>
        <div class="value" style="color: ${getScoreColor(score as number)}">${score}%</div>
      </div>
    `).join('')}
  </div>

  ${report.playbook ? `
  <div class="section">
    <h2>Strategic Summary</h2>
    <p style="color: #4b5563; line-height: 1.6;">${report.playbook.summary}</p>
  </div>

  <div class="section">
    <h2>Recommended Actions</h2>
    ${report.playbook.actions.map(action => `
      <div class="playbook-item">
        <h4>${action.title} <span class="badge" style="background: ${action.impact === 'High' ? '#dcfce7' : '#fef3c7'}; color: ${action.impact === 'High' ? '#166534' : '#92400e'}">${action.impact} Impact</span></h4>
        <p>${action.description}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Query Results</h2>
    <table>
      <thead>
        <tr>
          <th>Query</th>
          <th>Model</th>
          <th>Position</th>
          <th>Sentiment</th>
          <th>Competitors</th>
        </tr>
      </thead>
      <tbody>
        ${report.results.map(r => `
          <tr>
            <td>${r.query_text.length > 50 ? r.query_text.substring(0, 50) + '...' : r.query_text}</td>
            <td>${r.model}</td>
            <td><span class="badge" style="background: ${getPositionBadge(r.position)}">${r.mentioned ? r.position : 'None'}</span></td>
            <td>${r.mentioned ? r.sentiment : '-'}</td>
            <td>${r.competitors_mentioned.join(', ') || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${report.competitor_intel.length > 0 ? `
  <div class="section">
    <h2>Competitor Intelligence</h2>
    ${report.competitor_intel.map(comp => `
      <div class="playbook-item">
        <h4>${comp.name}</h4>
        <p><strong>Market Summary:</strong> ${comp.market_summary}</p>
        <p style="margin-top: 8px;"><strong>Strengths:</strong> ${comp.perceived_strength}</p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by AEO Vision • Answer Engine Optimization Tool</p>
  </div>
</body>
</html>
  `;
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
