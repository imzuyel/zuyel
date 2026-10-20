// clean-for-live.js
const fs = require('fs');
const path = require('path');

console.log("🚀 PTSC ERP - Live Server Cleanup Shuru Hocche...");

// 1. SMS Route theke fake student (Ripon, Sumaiya...) remove kora
const smsRoutes = [
  'app/api/communication/sms/route.ts',
  'app/api/communication/sms/send/route.ts'
];

smsRoutes.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Fake array replace kore empty array [] bosiye dewa
    content = content.replace(
      /const allStudents = institutionalDb\.students[\s\S]*?\];/g,
      'const allStudents = institutionalDb.students || [];'
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Cleaned fake students from: ${file}`);
  }
});

// 2. Admin Page theke Testing Role Switcher button remove kora
const adminPagePath = path.join(__dirname, 'app/admin/page.tsx');
if (fs.existsSync(adminPagePath)) {
  let adminContent = fs.readFileSync(adminPagePath, 'utf8');
  adminContent = adminContent.replace(
    /<button[\s\S]*?switchRole\("principal"\)[\s\S]*?<\/button>/g,
    ''
  );
  adminContent = adminContent.replace(
    /<button[\s\S]*?switchRole\("teacher"\)[\s\S]*?<\/button>/g,
    ''
  );
  fs.writeFileSync(adminPagePath, adminContent, 'utf8');
  console.log("✅ Removed testing role switcher buttons from: app/admin/page.tsx");
}

// 3. Server.js file toiri kora (cPanel Startup file)
const serverJsContent = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(\`> PTSC ERP Ready on http://\${hostname}:\${port}\`);
  });
});
`;

fs.writeFileSync(path.join(__dirname, 'server.js'), serverJsContent, 'utf8');
console.log("✅ Created cPanel startup file: server.js");

console.log("\n🎉 Obhinondon! Fake student o testing button clean hoye geche!");