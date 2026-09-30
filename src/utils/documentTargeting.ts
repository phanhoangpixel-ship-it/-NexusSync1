/**
 * NEXUSSYNC ERP - AUTHORITATIVE DOCUMENT TARGETING & AUTO-FOCUS ENGINE
 * 
 * Handles 'nexus-target-document' events to automatically:
 * 1. Find the target document row/card in tables, grids, and audit timeline feeds.
 * 2. Attach the 'highlight-active-row' class with pulsing glow animation.
 * 3. Smoothly center the row into view without manual user scrolling.
 */

export interface DocumentTargetOptions {
  docCode: string;
  maxRetries?: number;
  intervalMs?: number;
  autoScroll?: boolean;
}

/**
 * Searches the DOM for the document element by code and attaches 'highlight-active-row'
 */
export function applyTargetDocumentHighlight(docCode: string, options?: Partial<DocumentTargetOptions>): void {
  if (!docCode) return;
  const cleanCode = docCode.trim().toUpperCase();
  if (!cleanCode) return;

  const maxRetries = options?.maxRetries ?? 12;
  const intervalMs = options?.intervalMs ?? 200;
  const autoScroll = options?.autoScroll ?? true;

  let attempts = 0;

  // Clear previous highlights across the application
  document.querySelectorAll('.highlight-active-row').forEach((el) => {
    el.classList.remove('highlight-active-row');
  });

  const searchAndHighlight = () => {
    attempts++;

    // High-priority attribute selectors matching NexusSync ERP modules
    const selectors = [
      `[data-doc-ref*="${cleanCode}"]`,
      `[data-adj-code*="${cleanCode}"]`,
      `[data-po-id*="${cleanCode}"]`,
      `[data-so-id*="${cleanCode}"]`,
      `[data-entity-code*="${cleanCode}"]`,
      `[data-entity-id*="${cleanCode}"]`,
      `[data-code*="${cleanCode}"]`,
      `[data-serial*="${cleanCode}"]`,
      `#target-focused-item`,
      `#target-focused-adj`,
      `#today-timeline-item`,
    ];

    let targetElement: HTMLElement | null = null;

    for (const sel of selectors) {
      try {
        const found = document.querySelector<HTMLElement>(sel);
        if (found) {
          targetElement = found;
          break;
        }
      } catch {}
    }

    // Secondary search: scan table rows, role="row", or cards
    if (!targetElement) {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('tr, [role="row"], .card-document-row, .timeline-item')
      );
      for (const row of candidates) {
        const text = row.textContent || '';
        if (text.toUpperCase().includes(cleanCode)) {
          targetElement = row;
          break;
        }
      }
    }

    if (targetElement) {
      // Add the highlight class
      targetElement.classList.add('highlight-active-row');

      if (autoScroll) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
      return;
    }

    // Retry if DOM is still asynchronously rendering
    if (attempts < maxRetries) {
      setTimeout(searchAndHighlight, intervalMs);
    }
  };

  searchAndHighlight();
}

/**
 * Initializes the global window event listener for 'nexus-target-document'
 */
export function initDocumentTargetingListener(): () => void {
  const handleEvent = (event: Event) => {
    const custom = event as CustomEvent<{ code?: string; item?: any }>;
    const code = custom.detail?.code || custom.detail?.item?.businessReference || custom.detail?.item?.entityId;
    if (code) {
      applyTargetDocumentHighlight(String(code));
    }
  };

  window.addEventListener('nexus-target-document', handleEvent);

  // Check pending targeted document in sessionStorage
  try {
    const raw = sessionStorage.getItem('nexus_target_doc');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.code && Date.now() - (parsed.timestamp || 0) < 60000) {
        setTimeout(() => applyTargetDocumentHighlight(String(parsed.code)), 350);
      }
    }
  } catch {}

  return () => {
    window.removeEventListener('nexus-target-document', handleEvent);
  };
}
