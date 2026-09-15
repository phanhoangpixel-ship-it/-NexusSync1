import re

with open('engines/shiftEngine.ts', 'r') as f:
    code = f.read()

# Replace openShift
def repl_openShift(m):
    body = m.group(1)
    body = body.replace('txObj.', 'tx.')
    return """  static async openShift(params: {
    cashDrawerId: number;
    cashierUserId: string;
    cashierName: string;
    openingFloat: number;
    notes?: string;
  }) {
    return await db.transaction(async (tx) => {""" + body + """
    });
  }"""

code = re.sub(r'  static async openShift\(params: \{\s*cashDrawerId: number;\s*cashierUserId: string;\s*cashierName: string;\s*openingFloat: number;\s*notes\?: string;\s*\}\) \{(.*?)\n  \}', repl_openShift, code, flags=re.DOTALL)


def repl_closeShift(m):
    body = m.group(1)
    body = body.replace('txObj.', 'tx.')
    body = body.replace('await db.select', 'await tx.select')
    body = body.replace('await db.update', 'await tx.update')
    body = body.replace('this.reconstructExpectedCash(shift[0].id)', 'this.reconstructExpectedCash(shift[0].id, tx)')
    return """  static async closeShift(shiftId: string, denominations: DenominationLine[], notes?: string) {
    return await db.transaction(async (tx) => {""" + body + """
    });
  }"""

code = re.sub(r'  static async closeShift\(shiftId: string, denominations: DenominationLine\[\], notes\?: string\) \{(.*?)\n  \}', repl_closeShift, code, flags=re.DOTALL)

with open('engines/shiftEngine.ts', 'w') as f:
    f.write(code)

