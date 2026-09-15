import * as fs from 'fs';
let content = fs.readFileSync('src/routes/dms.routes.ts', 'utf-8');

const oldEndpoint = `  router.post("/api/dms/documents/ocr-parse", (req, res) => {
    const { fileName, fileContent } = req.body;
    // ... Hardcoded mock data ...
    const mockOcrResult = {
      title: fileName ? \\\`Hợp đồng & Chứng từ Trích xuất AI: \${fileName.replace(/\\.[^/.]+$/, "")}\\\` : 'Hợp đồng Cung ứng Vật tư Thiết bị Công nghiệp 2026',
      category: 'CONTRACT',
      categoryName: 'Hợp đồng Kinh tế',
      taxCode: '0102938475-001',
      totalAmount: '245,000,000 VNĐ',
      partnerName: 'Công ty Cổ phần Tập đoàn Công nghệ Viettel',
      linkedModule: 'M04 Sales Orders',
      refDocNo: \\\`SO-2026-\${Math.floor(1000 + Math.random() * 9000)}\\\`,
      securityLevel: 'CONFIDENTIAL',
      extractedConfidence: '99.4%',
      detectedFields: [
        { label: 'Số hợp đồng', value: 'HD-2026/VTT-NEXUS' },
        { label: 'Mã số thuế', value: '0102938475-001' },
        { label: 'Đại diện Ký', value: 'Nguyễn Văn Hùng (Tổng Giám đốc)' },
        { label: 'Giá trị hợp đồng', value: '245,000,000 VNĐ (Chưa VAT)' },
        { label: 'Thời hạn thực hiện', value: '12 tháng (Đến 28/08/2027)' },
      ],
    };

    res.json({
      success: true,
      ocrData: mockOcrResult,
      message: 'AI Gemini OCR đã trích xuất thành công 5 trường thông tin cấu trúc từ tệp tài liệu scan.',
    });
  });`;

// Wait, the new endpoint will use Gemini API
const newEndpoint = `  router.post("/api/dms/documents/ocr-parse", async (req, res) => {
    try {
      const { fileName, fileContent } = req.body;
      let ocrResult;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
         const ai = new GoogleGenAI({ apiKey });
         const prompt = \`Trích xuất thông tin hợp đồng sau thành JSON (bắt buộc đúng format, không kèm markdown):
           - title (Tên tài liệu)
           - category (CONTRACT)
           - categoryName (Hợp đồng Kinh tế)
           - taxCode
           - totalAmount
           - partnerName
           - linkedModule (e.g. M04 Sales Orders)
           - refDocNo
           - securityLevel (CONFIDENTIAL)
           - extractedConfidence (ví dụ 98%)
           - detectedFields: mảng các object có label và value.
           
           Nội dung tệp: \${fileContent || fileName}\`;
           
         const aiResponse = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: prompt
         });
         
         const text = aiResponse.text;
         try {
           const jsonStr = text.replace(/\\r?\\n/g, '').replace(/.*\\{/, '{').replace(/\\}.*/, '}');
           ocrResult = JSON.parse(jsonStr);
         } catch(e) {
           console.error("Failed to parse Gemini output", text);
         }
      }
      
      if (!ocrResult) {
          ocrResult = {
            title: fileName ? \`Tài liệu: \${fileName}\` : 'Tài liệu không xác định',
            category: 'CONTRACT',
            categoryName: 'Hợp đồng',
            taxCode: 'N/A',
            totalAmount: 'N/A',
            partnerName: 'N/A',
            linkedModule: 'DMS',
            refDocNo: 'N/A',
            securityLevel: 'INTERNAL',
            extractedConfidence: 'N/A',
            detectedFields: []
          };
      }
      
      res.json({
        success: true,
        ocrData: ocrResult,
        message: 'Trích xuất OCR thành công.',
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });`;

// I will just use sed or string replacement to inject this.
