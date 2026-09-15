import re

with open('src/routes/sales.routes.ts', 'r') as f:
    code = f.read()

target_start = '    if (orders.length === 0) {\n      const defaultSamples ='
target_end = '      orders = await db.select().from(schema.salesOrders).orderBy(desc(schema.salesOrders.createdAt)).all();\n    }'

start_idx = code.find(target_start)
end_idx = code.find(target_end, start_idx) + len(target_end)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + "" + code[end_idx:]
    print("Default samples removed.")
else:
    print("Could not find defaultSamples block.")

with open('src/routes/sales.routes.ts', 'w') as f:
    f.write(code)

