import fs from "fs";

let content = fs.readFileSync("src/routes/auth.routes.ts", "utf-8");

const jwtImport = `import jwt from 'jsonwebtoken';\nconst JWT_SECRET = process.env.JWT_SECRET || 'nexus_erp_super_secret_key_2026';\n`;

content = content.replace('const router = Router();', jwtImport + 'const router = Router();');

content = content.replace(
  `token: "simulated_jwt_token_nexus_erp",`,
  `token: jwt.sign({
        id: 1,
        username: username || "admin",
        role: role || "SUPER_ADMIN",
        name: username === "cfo" ? "Nguyễn Thị Hương (CFO)" : "Hoàng Nam (Admin)",
        department: role === "CFO" ? "Tài chính - Kế toán" : "Quản trị hệ thống",
      }, JWT_SECRET, { expiresIn: '8h' }),`
);

fs.writeFileSync("src/routes/auth.routes.ts", content);
