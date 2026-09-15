import * as fs from 'fs';
import * as path from 'path';

const m09Path = 'src/modules/purchase/m09-suppliers/components/M09SuppliersSRMWorkspace.tsx';
let m09Content = fs.readFileSync(m09Path, 'utf8');

m09Content = m09Content.replace(
  "import React, { useState, useEffect, useMemo } from 'react';",
  "import React, { useState, useEffect, useMemo } from 'react';\nimport { ENTERPRISE_MASTER_SUPPLIERS } from '../../../../data/enterpriseMaster';"
);

// M09 currently uses api, let's just make sure it has the import if needed.
// Wait, if M09 already fetches from `/api/suppliers`, I don't need to change its mock data.
// Let's check how it initializes.
fs.writeFileSync(m09Path, m09Content);
console.log("M09 Refactored");
