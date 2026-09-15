import fs from "fs";

let content = fs.readFileSync("src/components/common/SimulatedLoginModal.tsx", "utf-8");
content = content.replace(
  `                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}`,
  `                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: user.username, role: user.role })
                    });
                    const data = await res.json();
                    if (data.token) localStorage.setItem('nexus_jwt', data.token);
                  } catch(e) { console.error(e); }
                  onSelectUser(user);
                  onClose();
                }}`
);
fs.writeFileSync("src/components/common/SimulatedLoginModal.tsx", content);
