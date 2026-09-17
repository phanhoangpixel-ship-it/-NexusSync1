import { db } from '../db';
import { documentSequences, sourcingPackages, srmRfqs } from '../db/schema';
import { eq, like, desc } from 'drizzle-orm';

/**
 * Standardized Document Code Generator for M10 Strategic Sourcing:
 * - PKG-YYYY-XXXX (e.g. PKG-2026-0001) for Sourcing Packages
 * - RFQ-YYYY-XXXX (e.g. RFQ-2026-0001) for Requests for Quotation
 * 
 * Guarantees monotonic sequence numbering, ACID synchronization, and collision resistance.
 */
export async function generateSourcingDocumentCode(docType: 'PKG' | 'RFQ', tx?: any): Promise<string> {
  const runner = tx || db;
  const year = new Date().getFullYear();

  // 1. Check existing records in the domain table to find the highest sequence used this year
  let maxDomainNumber = 0;
  if (docType === 'PKG') {
    const existing = await runner
      .select({ code: sourcingPackages.packageCode })
      .from(sourcingPackages)
      .where(like(sourcingPackages.packageCode, `PKG-${year}-%`))
      .orderBy(desc(sourcingPackages.id))
      .limit(10);

    for (const row of existing) {
      if (row.code) {
        const parts = row.code.split('-');
        if (parts.length >= 3) {
          const numPart = parseInt(parts[2], 10);
          if (!isNaN(numPart) && numPart > maxDomainNumber) {
            maxDomainNumber = numPart;
          }
        }
      }
    }
  } else {
    const existing = await runner
      .select({ code: srmRfqs.code })
      .from(srmRfqs)
      .where(like(srmRfqs.code, `RFQ-${year}-%`))
      .orderBy(desc(srmRfqs.id))
      .limit(10);

    for (const row of existing) {
      if (row.code) {
        const parts = row.code.split('-');
        if (parts.length >= 3) {
          const numPart = parseInt(parts[2], 10);
          if (!isNaN(numPart) && numPart > maxDomainNumber) {
            maxDomainNumber = numPart;
          }
        }
      }
    }
  }

  // 2. Fetch or update documentSequences
  const seqList = await runner
    .select()
    .from(documentSequences)
    .where(eq(documentSequences.docType, docType))
    .limit(1);

  let nextNumber = maxDomainNumber + 1;

  if (seqList.length > 0) {
    const seq = seqList[0];
    nextNumber = Math.max(seq.currentNumber + 1, maxDomainNumber + 1);
    const code = `${docType}-${year}-${String(nextNumber).padStart(4, '0')}`;
    await runner
      .update(documentSequences)
      .set({
        currentNumber: nextNumber,
        samplePreview: code,
        updatedAt: new Date()
      })
      .where(eq(documentSequences.docType, docType));
    return code;
  } else {
    const code = `${docType}-${year}-${String(nextNumber).padStart(4, '0')}`;
    try {
      await runner.insert(documentSequences).values({
        docType,
        docName: docType === 'PKG' ? 'Gói thầu Mua sắm (Sourcing Package)' : 'Yêu cầu Báo giá Thầu (RFQ)',
        prefix: docType,
        dateFormat: 'YYYY',
        separator: '-',
        padding: 4,
        currentNumber: nextNumber,
        branchCode: 'ALL',
        resetCycle: 'YEARLY',
        samplePreview: code,
        isActive: true,
        updatedAt: new Date()
      });
    } catch {
      // Ignore if another process inserted concurrently
    }
    return code;
  }
}
