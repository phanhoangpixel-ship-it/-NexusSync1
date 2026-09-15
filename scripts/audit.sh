#!/bin/bash

REPORT="docs/reports/FULL_SYSTEM_AUDIT.md"
mkdir -p docs/reports

echo "# FULL SYSTEM AUDIT REPORT - MODULAR ERP PLATFORM" > $REPORT
echo "Date: $(date)" >> $REPORT
echo "" >> $REPORT

echo "## 1. System Overview" >> $REPORT
echo "- **Total API Endpoints (Backend)**: $(grep -rn 'router\.\(get\|post\|put\|delete\|patch\)' src/routes | wc -l)" >> $REPORT
echo "- **Total API Calls (Frontend)**: $(grep -rn 'fetch(' src/components src/App.tsx 2>/dev/null | wc -l)" >> $REPORT
echo "- **Total TODOs/FIXMEs**: $(grep -rni 'TODO\|FIXME' src/ db/ engines/ server.ts | wc -l)" >> $REPORT
echo "- **Total Mock/Fake usage**: $(grep -rni 'mock\|fake' src/ db/ engines/ server.ts | wc -l)" >> $REPORT
echo "" >> $REPORT

echo "## 2. All Declared APIs" >> $REPORT
grep -rh 'router\.\(get\|post\|put\|delete\|patch\)' src/routes | sed 's/.*router\./- /g' | sed 's/(/ /g' | sed 's/,.*//g' | sed 's/;//g' >> $REPORT
echo "" >> $REPORT

echo "## 12 & 13. Technical Debt: TODOs, FIXMEs, and Mocks" >> $REPORT
echo "### TODOs / FIXMEs" >> $REPORT
grep -rni 'TODO\|FIXME' src/ db/ engines/ server.ts | sed 's/^/- /g' >> $REPORT
echo "" >> $REPORT

echo "### Mock/Fake Implementations Detected" >> $REPORT
grep -rni 'mock\|fake' src/ db/ engines/ server.ts | grep -v 'mockData"' | sed 's/^/- /g' >> $REPORT
echo "" >> $REPORT

echo "Report generated."
