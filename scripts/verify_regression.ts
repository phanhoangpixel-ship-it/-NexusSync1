import fs from "fs";
import path from "path";

async function runRegressionDeclaration() {
  const declaration = {
    statement: "Không có regression test tự động cho các module M08/M09/M10/M13/M15/M16. Số liệu 147/147 trong báo cáo trước là nhận định tự phát không có căn cứ từ test suite tự động.",
    timestamp: new Date().toISOString(),
    automatedTestsExist: false
  };

  const outDir = path.resolve("docs/evidence");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "m16_regression_RAW_output.json");
  fs.writeFileSync(outFile, JSON.stringify(declaration, null, 2), "utf-8");
  console.log("Regression declaration generated at:", outFile);
}

runRegressionDeclaration().catch(console.error);
