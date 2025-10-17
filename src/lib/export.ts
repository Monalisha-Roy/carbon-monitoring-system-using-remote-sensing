import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { stringify } from 'csv-stringify/sync';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

export function exportToCSV(data: any[], filename: string) {
  const csv = stringify(data, {
    header: true,
    columns: Object.keys(data[0] || {}),
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToPDF(
  data: {
    title: string;
    polygonArea?: number;
    satelliteData?: any;
    classificationData?: any;
    carbonData?: any;
  },
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Area Information
  if (data.polygonArea) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Area Information', 14, yPosition);
    yPosition += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Area: ${data.polygonArea.toFixed(2)} hectares`, 14, yPosition);
    yPosition += 10;
  }

  // Satellite Data Section
  if (data.satelliteData) {
    addSatelliteDataSection(doc, data.satelliteData, yPosition);
    yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 15;
  }

  // Classification Section
  if (data.classificationData) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    addClassificationSection(doc, data.classificationData, yPosition);
    yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 15;
  }

  // Carbon Credits Section
  if (data.carbonData) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    addCarbonSection(doc, data.carbonData, yPosition);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
}

function addSatelliteDataSection(doc: jsPDF, data: any, startY: number) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Satellite Data Analysis', 14, startY);
  startY += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Date Range: ${data.dateRange?.startDate || 'N/A'} to ${data.dateRange?.endDate || 'N/A'}`,
    14,
    startY
  );
  startY += 7;

  if (data.statistics) {
    const statsData = [
      ['Metric', 'Value'],
      ['Mean NDVI', data.statistics.NDVI_mean?.toFixed(3) || 'N/A'],
      ['Min NDVI', data.statistics.NDVI_min?.toFixed(3) || 'N/A'],
      ['Max NDVI', data.statistics.NDVI_max?.toFixed(3) || 'N/A'],
    ];

    autoTable(doc, {
      startY: startY,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    });
  }
}

function addClassificationSection(doc: jsPDF, data: any, startY: number) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Land Cover Classification', 14, startY);
  startY += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Source: ${data.classification?.source || 'N/A'}`, 14, startY);
  startY += 5;

  if (data.classification?.year) {
    doc.text(`Year: ${data.classification.year}`, 14, startY);
    startY += 5;
  }

  if (data.areaStatistics && data.areaStatistics.length > 0) {
    const tableData = data.areaStatistics.map((item: any) => [
      item.className,
      item.areaHectares.toFixed(2),
      ((item.areaHectares / data.areaStatistics.reduce((sum: number, i: any) => sum + i.areaHectares, 0)) * 100).toFixed(1) + '%',
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Land Cover Type', 'Area (Hectares)', 'Percentage']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    });
  }
}

function addCarbonSection(doc: jsPDF, data: any, startY: number) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Carbon Credit Estimation', 14, startY);
  startY += 10;

  // Eligibility
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Eligibility: ${data.credits?.eligibility || 'N/A'}`, 14, startY);
  startY += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.credits?.reason || '', 14, startY, { maxWidth: 180 });
  startY += 12;

  // Carbon Change Statistics
  const carbonStats = [
    ['Metric', 'Value'],
    ['Total Carbon Change', `${data.carbonChange?.totalChange?.toFixed(2) || 0} tons CO2e`],
    ['Annual Change', `${data.carbonChange?.annualChange?.toFixed(2) || 0} tons CO2e/year`],
    ['Percent Change', `${data.carbonChange?.percentChange?.toFixed(1) || 0}%`],
  ];

  if (data.credits?.potentialCredits > 0) {
    carbonStats.push(['Potential Credits', `${data.credits.potentialCredits.toFixed(2)} tons CO2e`]);
    carbonStats.push([
      'Estimated Value',
      `$${data.credits.estimatedValue.min.toLocaleString()} - $${data.credits.estimatedValue.max.toLocaleString()} USD`,
    ]);
  }

  autoTable(doc, {
    startY: startY,
    head: [carbonStats[0]],
    body: carbonStats.slice(1),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  // Notes
  if (data.credits?.notes && data.credits.notes.length > 0) {
    startY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Notes:', 14, startY);
    startY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    data.credits.notes.forEach((note: string, index: number) => {
      doc.text(`${index + 1}. ${note}`, 14, startY, { maxWidth: 180 });
      startY += 5;
    });
  }
}

export function exportGeoJSON(geometry: any, properties: any, filename: string) {
  const geoJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: geometry,
        properties: properties,
      },
    ],
  };

  const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${filename}.geojson`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
