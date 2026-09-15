import { M15ReturnsRMAWorkspaceProps, RmaRecord } from "./types";

export const INITIAL_RMA_SEED: RmaRecord[] = [
      {
        id: 'RMA-2026-0084',
        customerName: 'Công ty Cổ phần Thương mại Kỹ thuật Hưng Thịnh',
        originalSo: 'SO-2026-00120',
        deliveryCode: 'DEL-2026-0155',
        productCode: 'SKU-ENG-088',
        productName: 'Bơm thủy lực cao áp P-1000',
        quantity: 2,
        uom: 'Cái',
        lotSerial: 'LOT-2026-X889',
        reason: 'Áp suất đầu ra không đạt định mức kỹ thuật cam kết',
        requestedResolution: 'REPLACE (Đổi mới sản phẩm)',
        status: 'APPROVED',
        inspectionResult: 'DEFECTIVE',
        disposition: 'REPLACE',
        financialStatus: 'CREDIT_NOTE_ISSUED',
        date: '2026-08-28'
      },
      {
        id: 'RMA-2026-0085',
        customerName: 'Tập đoàn Chế tạo Máy & Thiết bị Công nghiệp Hòa Phát',
        originalSo: 'SO-2026-00142',
        deliveryCode: 'DEL-2026-0180',
        productCode: 'SKU-AUT-204',
        productName: 'Cụm cảm biến nhiệt độ đa điểm IoT Sensor v3',
        quantity: 10,
        uom: 'Bộ',
        lotSerial: 'LOT-2026-S441',
        reason: 'Giao nhầm mã chủng loại cảm biến so với hợp đồng',
        requestedResolution: 'RESTOCK (Nhập kho hoàn trả)',
        status: 'UNDER_REVIEW',
        inspectionResult: 'GOOD',
        disposition: 'RESTOCK',
        financialStatus: 'PENDING',
        date: '2026-09-02'
      },
      {
        id: 'RMA-2026-0086',
        customerName: 'Công ty TNHH Cơ điện Lạnh Đông Nam Á',
        originalSo: 'SO-2026-00168',
        deliveryCode: 'DEL-2026-0205',
        productCode: 'SKU-VAL-012',
        productName: 'Van điều áp khí nén 2 chiều SMC-Series',
        quantity: 5,
        uom: 'Chiếc',
        lotSerial: 'LOT-2026-V112',
        reason: 'Vỏ van bị trầy xước và biến dạng trong quá trình vận chuyển',
        requestedResolution: 'CREDIT (Cấn trừ công nợ / Hoàn tiền)',
        status: 'REQUESTED',
        inspectionResult: 'DAMAGED',
        disposition: 'PENDING',
        financialStatus: 'PENDING',
        date: '2026-09-08'
      }
    ];
