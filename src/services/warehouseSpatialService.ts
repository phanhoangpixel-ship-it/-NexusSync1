import { db } from "../../db/index";
import * as schema from "../../db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

export interface SpatialLocationNode {
  id: number;
  warehouseId: number;
  type: 'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN';
  parentId: number | null;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  zoneType: 'GENERAL' | 'DRY' | 'COLD' | 'BULKY' | 'QUARANTINE' | 'HAZMAT';
  maxWeightCapacity: number;
  currentWeight: number;
  weightUtilizationPct: number;
  maxVolumeCapacity: number;
  currentVolume: number;
  volumeUtilizationPct: number;
  barcode?: string | null;
  aisleCode?: string | null;
  rackCode?: string | null;
  shelfCode?: string | null;
  binCode?: string | null;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  humidityMax?: number | null;
  isPicking: boolean;
  isReceiving: boolean;
  isQuarantine: boolean;
  isDamaged: boolean;
  children?: SpatialLocationNode[];
  assignedProductsCount?: number;
}

export interface ZoneCompatibilityResult {
  isCompatible: boolean;
  productCondition: string;
  zoneType: string;
  status: 'COMPATIBLE' | 'WARNING' | 'REJECTED';
  message: string;
}

export interface WeightCapacityCheckResult {
  fits: boolean;
  currentWeight: number;
  incomingWeight: number;
  newTotalWeight: number;
  maxWeightCapacity: number;
  newUtilizationPct: number;
  status: 'SAFE' | 'WARNING_NEAR_CAPACITY' | 'BLOCKED_OVER_CAPACITY';
  message: string;
  canOverride: boolean;
}

export interface PlacementValidationResult {
  isValid: boolean;
  zoneCompatibility: ZoneCompatibilityResult;
  weightCapacity: WeightCapacityCheckResult;
  overallStatus: 'APPROVED' | 'REQUIRES_CONFIRMATION' | 'BLOCKED';
  errors: string[];
  warnings: string[];
}

export class WarehouseSpatialService {
  /**
   * 1. Get Flat Location List with enriched computed metrics
   */
  static async getLocations(warehouseId?: number): Promise<SpatialLocationNode[]> {
    let query = db.select().from(schema.warehouseLocations);
    const rawList = warehouseId 
      ? await query.where(eq(schema.warehouseLocations.warehouseId, warehouseId)).all()
      : await query.all();

    return rawList.map(loc => {
      const maxW = loc.maxWeightCapacity || 1000;
      const curW = loc.currentWeight || 0;
      const maxV = loc.maxVolumeCapacity || 5;
      const curV = loc.currentVolume || 0;

      return {
        id: loc.id,
        warehouseId: loc.warehouseId,
        type: loc.type as any,
        parentId: loc.parentId,
        code: loc.code,
        name: loc.name,
        description: loc.description,
        isActive: Boolean(loc.isActive),
        zoneType: (loc.zoneType || 'GENERAL') as any,
        maxWeightCapacity: maxW,
        currentWeight: curW,
        weightUtilizationPct: maxW > 0 ? Number(((curW / maxW) * 100).toFixed(1)) : 0,
        maxVolumeCapacity: maxV,
        currentVolume: curV,
        volumeUtilizationPct: maxV > 0 ? Number(((curV / maxV) * 100).toFixed(1)) : 0,
        barcode: loc.barcode || loc.code,
        aisleCode: loc.aisleCode,
        rackCode: loc.rackCode,
        shelfCode: loc.shelfCode,
        binCode: loc.binCode,
        temperatureMin: loc.temperatureMin,
        temperatureMax: loc.temperatureMax,
        humidityMax: loc.humidityMax,
        isPicking: Boolean(loc.isPicking),
        isReceiving: Boolean(loc.isReceiving),
        isQuarantine: Boolean(loc.isQuarantine),
        isDamaged: Boolean(loc.isDamaged),
      };
    });
  }

  /**
   * 2. Get Recursive 5-Tier Spatial Tree (Warehouse -> Zone -> Aisle -> Rack -> Bin)
   */
  static async getSpatialTree(warehouseId: number): Promise<SpatialLocationNode[]> {
    const allLocations = await this.getLocations(warehouseId);
    
    // Map by ID
    const map = new Map<number, SpatialLocationNode>();
    allLocations.forEach(node => {
      node.children = [];
      map.set(node.id, node);
    });

    const roots: SpatialLocationNode[] = [];

    allLocations.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        const parent = map.get(node.parentId)!;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * 3. Validate Zone Compatibility between Product and Storage Location
   */
  static validateZoneCompatibility(productStorageCondition: string = 'DRY', zoneType: string = 'GENERAL'): ZoneCompatibilityResult {
    const prodCond = productStorageCondition.toUpperCase();
    const zType = zoneType.toUpperCase();

    // Cold / Frozen goods strictly require COLD zone
    if (prodCond === 'COLD' || prodCond === 'FROZEN') {
      if (zType !== 'COLD') {
        return {
          isCompatible: false,
          productCondition: prodCond,
          zoneType: zType,
          status: 'REJECTED',
          message: `LỖI RÀNG BUỘC: Mặt hàng yêu cầu bảo quản LẠNH (2-8°C hoặc âm sâu) không thể xếp vào khu vực ${zType}! Bắt buộc xếp vào Zone COLD.`
        };
      }
      return {
        isCompatible: true,
        productCondition: prodCond,
        zoneType: zType,
        status: 'COMPATIBLE',
        message: 'Tương thích hoàn hảo với khu vực kho lạnh chuyên dụng.'
      };
    }

    // Bulky goods should be in BULKY zone
    if (prodCond === 'BULKY') {
      if (zType === 'COLD') {
        return {
          isCompatible: false,
          productCondition: prodCond,
          zoneType: zType,
          status: 'REJECTED',
          message: 'LỖI RÀNG BUỘC: Hàng cồng kềnh/Pallet tải nặng không được đưa vào khu vực Kệ Lạnh hẹp!'
        };
      }
      if (zType !== 'BULKY') {
        return {
          isCompatible: true,
          productCondition: prodCond,
          zoneType: zType,
          status: 'WARNING',
          message: 'CẢNH BÁO: Hàng cồng kềnh nên ưu tiên lưu trữ tại khu vực BULKY / Pallet nền.'
        };
      }
      return {
        isCompatible: true,
        productCondition: prodCond,
        zoneType: zType,
        status: 'COMPATIBLE',
        message: 'Tương thích hoàn hảo với khu vực lưu trữ hàng cồng kềnh.'
      };
    }

    // Quarantine goods strictly restricted to QUARANTINE zone
    if (prodCond === 'QUARANTINE_ONLY') {
      if (zType !== 'QUARANTINE') {
        return {
          isCompatible: false,
          productCondition: prodCond,
          zoneType: zType,
          status: 'REJECTED',
          message: 'LỖI CÁCH LY: Hàng hóa thuộc diện cách ly KCS/IQC bắt buộc phải lưu trữ tại Zone QUARANTINE!'
        };
      }
      return {
        isCompatible: true,
        productCondition: prodCond,
        zoneType: zType,
        status: 'COMPATIBLE',
        message: 'Tương thích với khu vực cách ly KCS.'
      };
    }

    // Normal goods placed into QUARANTINE zone -> Warning
    if (zType === 'QUARANTINE') {
      return {
        isCompatible: true,
        productCondition: prodCond,
        zoneType: zType,
        status: 'WARNING',
        message: 'LƯU Ý: Đang xếp hàng thông thường vào khu vực Cách Ly KCS (Quarantine). Chỉ thực hiện nếu có chỉ định đặc biệt.'
      };
    }

    return {
      isCompatible: true,
      productCondition: prodCond,
      zoneType: zType,
      status: 'COMPATIBLE',
      message: 'Điều kiện bảo quản phù hợp với vị trí lưu kho.'
    };
  }

  /**
   * 4. Check Weight Capacity Enforcement (Safety Limits)
   */
  static checkWeightCapacity(
    currentWeight: number,
    maxWeightCapacity: number,
    quantityToAdd: number,
    unitWeightKg: number = 1.0
  ): WeightCapacityCheckResult {
    const incomingWeight = Number((quantityToAdd * unitWeightKg).toFixed(2));
    const newTotalWeight = Number((currentWeight + incomingWeight).toFixed(2));
    const maxW = maxWeightCapacity > 0 ? maxWeightCapacity : 1000;
    const utilizationPct = Number(((newTotalWeight / maxW) * 100).toFixed(1));

    if (newTotalWeight > maxW) {
      const overKg = Number((newTotalWeight - maxW).toFixed(2));
      return {
        fits: false,
        currentWeight,
        incomingWeight,
        newTotalWeight,
        maxWeightCapacity: maxW,
        newUtilizationPct: utilizationPct,
        status: 'BLOCKED_OVER_CAPACITY',
        message: `NGUY HIỂM VƯỢT TẢI TRỌNG: Tổng tải mới (${newTotalWeight} kg) vượt quá sức chịu tải tối đa của giá kệ (${maxW} kg). Quá tải +${overKg} kg (${utilizationPct}%). Hệ thống chặn thao tác để đảm bảo an toàn kết cấu!`,
        canOverride: false
      };
    }

    if (utilizationPct >= 80.0) {
      return {
        fits: true,
        currentWeight,
        incomingWeight,
        newTotalWeight,
        maxWeightCapacity: maxW,
        newUtilizationPct: utilizationPct,
        status: 'WARNING_NEAR_CAPACITY',
        message: `CẢNH BÁO TẢI TRỌNG CAO: Vị trí sau khi xếp sẽ đạt ${utilizationPct}% tải trọng định mức (${newTotalWeight}/${maxW} kg). Cần chú ý phân bố đều tải trọng.`,
        canOverride: true
      };
    }

    return {
      fits: true,
      currentWeight,
      incomingWeight,
      newTotalWeight,
      maxWeightCapacity: maxW,
      newUtilizationPct: utilizationPct,
      status: 'SAFE',
      message: `Tải trọng an toàn (${utilizationPct}% định mức: ${newTotalWeight}/${maxW} kg).`,
      canOverride: true
    };
  }

  /**
   * 5. Comprehensive Placement & Slotting Validation
   */
  static async validatePlacement(
    locationId: number,
    productId: number,
    quantity: number
  ): Promise<PlacementValidationResult> {
    const loc = await db.select().from(schema.warehouseLocations).where(eq(schema.warehouseLocations.id, locationId)).get();
    if (!loc) {
      throw new Error(`Không tìm thấy vị trí lưu kho ID ${locationId}`);
    }

    const prod = await db.select().from(schema.products).where(eq(schema.products.id, productId)).get();
    if (!prod) {
      throw new Error(`Không tìm thấy sản phẩm ID ${productId}`);
    }

    const zoneComp = this.validateZoneCompatibility(prod.storageCondition || 'DRY', loc.zoneType || 'GENERAL');
    const weightComp = this.checkWeightCapacity(
      loc.currentWeight || 0,
      loc.maxWeightCapacity || 1000,
      quantity,
      prod.unitWeightKg || 1.0
    );

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!zoneComp.isCompatible) {
      errors.push(zoneComp.message);
    } else if (zoneComp.status === 'WARNING') {
      warnings.push(zoneComp.message);
    }

    if (!weightComp.fits) {
      errors.push(weightComp.message);
    } else if (weightComp.status === 'WARNING_NEAR_CAPACITY') {
      warnings.push(weightComp.message);
    }

    let overallStatus: 'APPROVED' | 'REQUIRES_CONFIRMATION' | 'BLOCKED' = 'APPROVED';
    if (errors.length > 0) {
      overallStatus = 'BLOCKED';
    } else if (warnings.length > 0) {
      overallStatus = 'REQUIRES_CONFIRMATION';
    }

    return {
      isValid: errors.length === 0,
      zoneCompatibility: zoneComp,
      weightCapacity: weightComp,
      overallStatus,
      errors,
      warnings
    };
  }

  /**
   * 6. Assign Stock to Location & Update Physical Weights
   */
  static async assignStockToLocation(
    locationId: number,
    productId: number,
    quantity: number,
    operator: string = 'WMS_OPERATOR'
  ): Promise<{ success: boolean; newWeight: number; location: SpatialLocationNode }> {
    const validation = await this.validatePlacement(locationId, productId, quantity);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    const prod = await db.select().from(schema.products).where(eq(schema.products.id, productId)).get();
    const loc = await db.select().from(schema.warehouseLocations).where(eq(schema.warehouseLocations.id, locationId)).get();
    
    const addedWeight = Number((quantity * (prod?.unitWeightKg || 1.0)).toFixed(2));
    const newWeight = Number(((loc?.currentWeight || 0) + addedWeight).toFixed(2));
    const addedVol = Number((quantity * (prod?.unitVolumeM3 || 0.005)).toFixed(3));
    const newVol = Number(((loc?.currentVolume || 0) + addedVol).toFixed(3));

    // Update location physical weight and volume
    await db.update(schema.warehouseLocations)
      .set({
        currentWeight: newWeight,
        currentVolume: newVol
      })
      .where(eq(schema.warehouseLocations.id, locationId));

    // Also update parent rack and zone weights if parentId exists
    if (loc?.parentId) {
      const parentLoc = await db.select().from(schema.warehouseLocations).where(eq(schema.warehouseLocations.id, loc.parentId)).get();
      if (parentLoc) {
        await db.update(schema.warehouseLocations)
          .set({
            currentWeight: Number(((parentLoc.currentWeight || 0) + addedWeight).toFixed(2)),
            currentVolume: Number(((parentLoc.currentVolume || 0) + addedVol).toFixed(3))
          })
          .where(eq(schema.warehouseLocations.id, loc.parentId));
      }
    }

    const updatedNodeList = await this.getLocations(loc?.warehouseId);
    const updatedNode = updatedNodeList.find(n => n.id === locationId)!;

    return {
      success: true,
      newWeight,
      location: updatedNode
    };
  }

  /**
   * 7. Create or Update Location with automatic hierarchy barcode
   */
  static async saveLocation(data: {
    id?: number;
    warehouseId: number;
    type: 'ZONE' | 'AISLE' | 'RACK' | 'SHELF' | 'BIN';
    parentId?: number | null;
    code: string;
    name: string;
    description?: string;
    zoneType?: string;
    maxWeightCapacity?: number;
    maxVolumeCapacity?: number;
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMax?: number;
    isPicking?: boolean;
    isReceiving?: boolean;
    isQuarantine?: boolean;
    isActive?: boolean;
  }): Promise<SpatialLocationNode> {
    const barcode = data.code ? `BC-${data.code}` : `BC-LOC-${Date.now()}`;

    if (data.id) {
      await db.update(schema.warehouseLocations)
        .set({
          name: data.name,
          description: data.description,
          zoneType: data.zoneType || 'GENERAL',
          maxWeightCapacity: data.maxWeightCapacity || 1000,
          maxVolumeCapacity: data.maxVolumeCapacity || 5,
          temperatureMin: data.temperatureMin,
          temperatureMax: data.temperatureMax,
          humidityMax: data.humidityMax,
          isPicking: Boolean(data.isPicking),
          isReceiving: Boolean(data.isReceiving),
          isQuarantine: Boolean(data.isQuarantine),
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        })
        .where(eq(schema.warehouseLocations.id, data.id));

      const updated = await this.getLocations(data.warehouseId);
      return updated.find(n => n.id === data.id)!;
    } else {
      const inserted = await db.insert(schema.warehouseLocations)
        .values({
          warehouseId: data.warehouseId,
          type: data.type,
          parentId: data.parentId || null,
          code: data.code,
          name: data.name,
          description: data.description || '',
          zoneType: data.zoneType || 'GENERAL',
          maxWeightCapacity: data.maxWeightCapacity || 1000,
          currentWeight: 0,
          maxVolumeCapacity: data.maxVolumeCapacity || 5,
          currentVolume: 0,
          barcode,
          temperatureMin: data.temperatureMin,
          temperatureMax: data.temperatureMax,
          humidityMax: data.humidityMax,
          isPicking: Boolean(data.isPicking),
          isReceiving: Boolean(data.isReceiving),
          isQuarantine: Boolean(data.isQuarantine),
          isActive: true,
        })
        .returning();

      const created = await this.getLocations(data.warehouseId);
      return created.find(n => n.id === inserted[0].id)!;
    }
  }

  /**
   * 8. Delete Location with Child Node safety check
   */
  static async deleteLocation(id: number): Promise<{ success: boolean; message: string }> {
    // Check if child locations exist
    const children = await db.select().from(schema.warehouseLocations).where(eq(schema.warehouseLocations.parentId, id)).all();
    if (children.length > 0) {
      throw new Error(`Không thể xóa vị trí này vì đang có ${children.length} vị trí con cấp dưới (Aisle/Rack/Bin)!`);
    }

    // Check if location has stock
    const loc = await db.select().from(schema.warehouseLocations).where(eq(schema.warehouseLocations.id, id)).get();
    if (loc && (loc.currentWeight || 0) > 0) {
      throw new Error(`Không thể xóa vị trí đang có hàng tồn (${loc.currentWeight} kg)! Vui lòng điều chuyển hết hàng trước khi xóa.`);
    }

    await db.delete(schema.warehouseLocations).where(eq(schema.warehouseLocations.id, id));
    return { success: true, message: 'Đã xóa vị trí lưu kho thành công.' };
  }
}
