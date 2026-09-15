import fs from "fs";

let content = fs.readFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", "utf-8");

// Remove duplicate cardTendered
content = content.replace("  const [cardTendered, setCardTendered] = useState<string>('0');\\n", "");

// Remove the rogue ')}' at line 878
content = content.replace("              </div>\\n)}\\n            </div>", "              </div>\\n            </div>");

fs.writeFileSync("src/components/workspaces/M16POSRetailWorkspace.tsx", content);
console.log("Fixed M16 issues");
