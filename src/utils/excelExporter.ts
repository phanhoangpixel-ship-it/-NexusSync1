import * as XLSX from 'xlsx';

export interface ScannedTableData {
  id: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  totalRows: number;
  totalColumns: number;
}

export interface ExportMetadata {
  workspaceCode?: string;
  workspaceName?: string;
  branchName?: string;
  userName?: string;
  exportDate?: string;
}

/**
 * Clean text from table cells, removing action buttons and extraneous whitespace
 */
function cleanCellText(cell: HTMLElement): string | number {
  // Clone element to manipulate without affecting DOM
  const clone = cell.cloneNode(true) as HTMLElement;

  // Remove elements typically used for row actions / dropdowns / tooltips
  const toRemove = clone.querySelectorAll('button, svg, .action-cell, .hidden, [aria-hidden="true"]');
  toRemove.forEach((el) => {
    // If it's a badge with text, keep text; if it's an action button/icon, remove
    if (el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'button') {
      el.remove();
    }
  });

  const rawText = clone.innerText || clone.textContent || '';
  const cleaned = rawText
    .replace(/\r\n/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Scan DOM for active tables and extract structured data
 */
export function scanTablesInDOM(containerSelector = '#nexus-l4-main'): ScannedTableData[] {
  let container = document.querySelector(containerSelector) as HTMLElement;
  if (!container) {
    container = document.querySelector('#nexus-l2-workspace') as HTMLElement || document.body;
  }

  const tableElements = Array.from(container.querySelectorAll('table'));
  const results: ScannedTableData[] = [];

  tableElements.forEach((table, index) => {
    // Check if table is visible
    if (table.offsetParent === null && table.offsetWidth === 0 && table.offsetHeight === 0) {
      return; // Skip hidden tables
    }

    // Try finding an intelligent title from surrounding headers or captions
    let title = '';
    const caption = table.querySelector('caption');
    if (caption && caption.textContent?.trim()) {
      title = caption.textContent.trim();
    } else {
      // Look at previous siblings or parent headings
      let parent: HTMLElement | null = table.parentElement;
      let headingFound = false;
      
      for (let depth = 0; depth < 4 && parent && !headingFound; depth++) {
        const heading = parent.querySelector('h1, h2, h3, h4, h5, .table-title, [data-table-title]');
        if (heading && heading.textContent?.trim() && !heading.contains(table)) {
          title = heading.textContent.trim().split('\n')[0].trim();
          headingFound = true;
          break;
        }
        parent = parent.parentElement;
      }
    }

    if (!title) {
      title = `Bảng Dữ Liệu ${index + 1}`;
    }

    // Extract Headers
    let headerRow = table.querySelector('thead tr');
    let headerCells: HTMLElement[] = [];

    if (headerRow) {
      headerCells = Array.from(headerRow.querySelectorAll('th, td'));
    } else {
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        headerCells = Array.from(firstRow.querySelectorAll('th, td'));
      }
    }

    // Filter out action columns
    const validColIndices: number[] = [];
    const headers: string[] = [];

    headerCells.forEach((th, colIdx) => {
      const text = cleanCellText(th).toString();
      // Skip empty or action header columns
      const isActionCol = /^(thao tác|hành động|action|actions|chi tiết|chức năng|\s*)$/i.test(text);
      if (!isActionCol || text.length > 0) {
        validColIndices.push(colIdx);
        headers.push(text || `Cột ${colIdx + 1}`);
      }
    });

    if (headers.length === 0) {
      return; // Skip empty table
    }

    // Extract Rows
    const bodyRows = Array.from(table.querySelectorAll('tbody tr'));
    const rowsToProcess = bodyRows.length > 0 ? bodyRows : Array.from(table.querySelectorAll('tr')).slice(1);
    const rows: (string | number)[][] = [];

    rowsToProcess.forEach((tr) => {
      // Skip empty rows or nested expanders
      const cells = Array.from(tr.querySelectorAll('td, th'));
      if (cells.length === 0) return;

      const rowData: (string | number)[] = [];
      validColIndices.forEach((colIdx) => {
        const cell = cells[colIdx];
        if (cell) {
          const val = cleanCellText(cell as HTMLElement);
          rowData.push(val);
        } else {
          rowData.push('');
        }
      });

      // Only push if row contains at least one non-empty string
      if (rowData.some((v) => v !== '')) {
        rows.push(rowData);
      }
    });

    results.push({
      id: table.id || `table_${index + 1}`,
      title,
      headers,
      rows,
      totalRows: rows.length,
      totalColumns: headers.length,
    });
  });

  return results;
}

/**
 * Generate CSV string with UTF-8 BOM for perfect Vietnamese character display in Excel
 */
export function generateCsvContent(table: ScannedTableData, metadata?: ExportMetadata): string {
  const lines: string[] = [];

  // Optional Metadata header
  if (metadata) {
    if (metadata.workspaceName) {
      lines.push(`"# Phân hệ: ${escapeCsv(metadata.workspaceName)}"`);
    }
    if (metadata.branchName) {
      lines.push(`"# Chi nhánh: ${escapeCsv(metadata.branchName)}"`);
    }
    if (metadata.exportDate) {
      lines.push(`"# Thời gian xuất: ${escapeCsv(metadata.exportDate)}"`);
    }
    if (metadata.userName) {
      lines.push(`"# Người xuất báo cáo: ${escapeCsv(metadata.userName)}"`);
    }
    lines.push(''); // Empty line separator
  }

  // Table Headers
  lines.push(table.headers.map(escapeCsv).join(','));

  // Data Rows
  table.rows.forEach((row) => {
    lines.push(row.map((val) => escapeCsv(String(val))).join(','));
  });

  // Prepend UTF-8 BOM
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Escape field for CSV
 */
function escapeCsv(field: string): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generate TSV (Tab-Separated Values) for easy pasting to Excel / Google Sheets
 */
export function generateTsvContent(table: ScannedTableData): string {
  const lines: string[] = [];
  lines.push(table.headers.map((h) => h.replace(/\t/g, ' ')).join('\t'));
  table.rows.forEach((row) => {
    lines.push(row.map((cell) => String(cell).replace(/\t/g, ' ')).join('\t'));
  });
  return lines.join('\r\n');
}

/**
 * Export table data to Excel (.xlsx) file using SheetJS (XLSX)
 */
export function downloadExcelFile(
  tables: ScannedTableData[],
  fileName: string,
  metadata?: ExportMetadata
): void {
  const workbook = XLSX.utils.book_new();

  tables.forEach((table, index) => {
    // Sheet data array of arrays
    const sheetData: any[][] = [];

    // Header metadata block
    if (metadata) {
      sheetData.push(['NEXUSSYNC ENTERPRISE ERP - BÁO CÁO DỮ LIỆU']);
      sheetData.push([`Phân hệ: ${metadata.workspaceName || 'ERP'}`]);
      sheetData.push([`Chi nhánh: ${metadata.branchName || 'Tổng công ty'}`]);
      sheetData.push([`Thời gian xuất: ${metadata.exportDate || new Date().toLocaleString('vi-VN')}`]);
      sheetData.push([`Người lập: ${metadata.userName || 'System User'}`]);
      sheetData.push([]); // Empty row
    }

    // Add Column Headers
    sheetData.push(table.headers);

    // Add Data Rows
    table.rows.forEach((row) => {
      sheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Calculate auto column widths
    const colWidths = table.headers.map((header, colIdx) => {
      let maxLen = header.length;
      table.rows.forEach((row) => {
        const valStr = String(row[colIdx] || '');
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });

    worksheet['!cols'] = colWidths;

    // Clean sheet name (Excel limits sheet names to 31 chars and no special chars)
    let sheetName = table.title
      .replace(/[\\/*?:[\]]/g, '')
      .trim()
      .substring(0, 28);
    if (!sheetName) sheetName = `Sheet${index + 1}`;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalFileName);
}

/**
 * Trigger download of text file in browser
 */
export function downloadTextFile(content: string, fileName: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
