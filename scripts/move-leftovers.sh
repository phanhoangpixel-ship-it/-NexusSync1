#!/bin/bash
set -e

if [ -d "src/components/workspaces/eventbus" ]; then mv src/components/workspaces/eventbus/* src/modules/governance/m05-eventbus/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/lotsBatches" ]; then mv src/components/workspaces/lotsBatches/* src/modules/inventory/m22-lots/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/m10" ]; then mv src/components/workspaces/m10/* src/modules/purchase/m10-strategic-sourcing/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/m11" ]; then mv src/components/workspaces/m11/* src/modules/purchase/m11-srm/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/m12" ]; then mv src/components/workspaces/m12/* src/modules/sales/m12-crm/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/m13" ]; then mv src/components/workspaces/m13/* src/modules/sales/m13-sales-orders/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/m16" ]; then mv src/components/workspaces/m16/* src/modules/sales/m16-pos/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/pos" ]; then mv src/components/workspaces/pos/* src/modules/sales/m16-pos/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/manufacturing" ]; then mv src/components/workspaces/manufacturing/* src/modules/manufacturing/m25-mes/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/pricing" ]; then mv src/components/workspaces/pricing/* src/modules/pricing/m41-pricing-management/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/stockAdjustment" ]; then mv src/components/workspaces/stockAdjustment/* src/modules/inventory/m20-adjustment/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/stocktake" ]; then mv src/components/workspaces/stocktake/* src/modules/inventory/m19-stocktake/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/superAdmin" ]; then mv src/components/workspaces/superAdmin/* src/modules/admin/m04-super-admin/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/systemSettings" ]; then mv src/components/workspaces/systemSettings/* src/modules/admin/m03-system-settings/components/ 2>/dev/null || true; fi
if [ -d "src/components/workspaces/transfers" ]; then mv src/components/workspaces/transfers/* src/modules/inventory/m21-transfers/components/ 2>/dev/null || true; fi
