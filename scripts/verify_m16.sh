#!/usr/bin/env bash
mkdir -p docs/evidence
LOG_FILE="docs/evidence/m16_time_verification_RAW.log"

echo "=== M16 TIME VERIFICATION RAW EVIDENCE LOG ===" > "$LOG_FILE"
echo "Generated at: $(date)" >> "$LOG_FILE"
echo "--------------------------------------------------" >> "$LOG_FILE"

echo "[1] System Date & Time (date):" >> "$LOG_FILE"
date >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "[2] System Timezone & Clock Check (timedatectl / TZ):" >> "$LOG_FILE"
if command -v timedatectl &> /dev/null; then
  timedatectl status >> "$LOG_FILE" 2>&1
else
  echo "timedatectl not available in container." >> "$LOG_FILE"
  echo "TZ environment: ${TZ:-Not set}" >> "$LOG_FILE"
  date +%Z >> "$LOG_FILE"
  date +%z >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

echo "[3] Database Current Timestamp (nexus_erp.db):" >> "$LOG_FILE"
node -e "
  const { createClient } = require('@libsql/client');
  async function run() {
    try {
      const client = createClient({ url: 'file:nexus_erp.db' });
      const rs = await client.execute(\"SELECT datetime('now') as db_utc, datetime('now', 'localtime') as db_local, strftime('%s', 'now') as db_epoch\");
      console.log('DB Time Result:', JSON.stringify(rs.rows, null, 2));
    } catch (e) {
      console.error('DB Error:', e.message);
    }
  }
  run();
" >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "=== END OF TIME VERIFICATION ===" >> "$LOG_FILE"
echo "Verification log successfully generated at $LOG_FILE"
