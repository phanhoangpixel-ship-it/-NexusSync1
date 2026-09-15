import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ColumnDef } from '../components/common/EnterpriseTable';

export interface ColumnPreset {
  id: string;
  name: string;
  isSystem?: boolean;
  isDefault?: boolean;
  columnKeys: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TableColumnStorageState {
  activePresetId: string;
  customPresets: ColumnPreset[];
  visibleColumnKeys: string[];
  lastUpdated?: string;
}

export interface UseColumnPresetsOptions {
  moduleId?: string;
  tableId?: string;
  columns: ColumnDef[];
  defaultHiddenKeys?: string[];
  mandatoryKeys?: string[]; // Keys that cannot be hidden (e.g. selection, ID)
  onColumnsChange?: (visibleKeys: string[]) => void;
}

const STORAGE_PREFIX = 'nexussync_table_cols_v1';
const EMPTY_ARRAY: string[] = [];
const DEFAULT_MANDATORY_ARRAY: string[] = ['_selection_checkbox'];

function areArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function loadInitialStorage(
  storageKey: string,
  allColumnKeys: string[],
  defaultHiddenKeys: string[],
  mandatoryKeys: string[]
): { initialPresets: ColumnPreset[]; initialActiveId: string; initialVisibleKeys: string[] } {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    if (stored) {
      const parsed: TableColumnStorageState = JSON.parse(stored);
      const custom = Array.isArray(parsed.customPresets) ? parsed.customPresets : [];
      const activeId = parsed.activePresetId || 'system_all';
      if (Array.isArray(parsed.visibleColumnKeys) && parsed.visibleColumnKeys.length > 0) {
        const validKeys = parsed.visibleColumnKeys.filter((k) => allColumnKeys.includes(k));
        const withMandatory = Array.from(
          new Set([...mandatoryKeys.filter((k) => allColumnKeys.includes(k)), ...validKeys])
        );
        const resolved = withMandatory.length > 0 ? withMandatory : allColumnKeys;
        return { initialPresets: custom, initialActiveId: activeId, initialVisibleKeys: resolved };
      }
      return {
        initialPresets: custom,
        initialActiveId: activeId,
        initialVisibleKeys: allColumnKeys.filter((k) => !defaultHiddenKeys.includes(k)),
      };
    }
  } catch (e) {
    console.warn(`[useColumnPresets] Failed to read initial presets from storage for key ${storageKey}`, e);
  }

  return {
    initialPresets: [],
    initialActiveId: 'system_all',
    initialVisibleKeys: allColumnKeys.filter((k) => !defaultHiddenKeys.includes(k)),
  };
}

export function useColumnPresets({
  moduleId = 'general',
  tableId = 'default_table',
  columns,
  defaultHiddenKeys = EMPTY_ARRAY,
  mandatoryKeys = DEFAULT_MANDATORY_ARRAY,
  onColumnsChange,
}: UseColumnPresetsOptions) {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}_${moduleId.toLowerCase()}_${tableId.toLowerCase()}`,
    [moduleId, tableId]
  );

  // Primitive strings for stable comparisons
  const allKeysString = useMemo(() => columns.map((col) => col.key).join(','), [columns]);
  const defaultHiddenString = useMemo(() => defaultHiddenKeys.join(','), [defaultHiddenKeys]);
  const mandatoryKeysString = useMemo(() => mandatoryKeys.join(','), [mandatoryKeys]);

  // All valid column keys from definition
  const allColumnKeys = useMemo(
    () => (allKeysString ? allKeysString.split(',') : []),
    [allKeysString]
  );

  // System Built-in Presets
  const systemPresets = useMemo<ColumnPreset[]>(() => {
    // 1. All columns preset
    const allPreset: ColumnPreset = {
      id: 'system_all',
      name: 'Toàn bộ cột',
      isSystem: true,
      isDefault: true,
      columnKeys: allColumnKeys,
    };

    // 2. Compact / Essential columns preset (first 5-7 core columns + mandatory)
    const compactKeys = allColumnKeys.filter((k, idx) => {
      if (mandatoryKeys.includes(k)) return true;
      const col = columns.find((c) => c.key === k);
      if (!col) return idx < 5;
      const keyLower = k.toLowerCase();
      return (
        idx < 5 ||
        keyLower.includes('code') ||
        keyLower.includes('name') ||
        keyLower.includes('status') ||
        keyLower.includes('total') ||
        keyLower.includes('amount') ||
        keyLower.includes('balance')
      );
    });

    const compactPreset: ColumnPreset = {
      id: 'system_compact',
      name: 'Tối giản & Rút gọn',
      isSystem: true,
      columnKeys: Array.from(new Set([...mandatoryKeys, ...compactKeys])).slice(0, 7),
    };

    // 3. Financial & Valuation columns preset (numeric/currency + identifiers)
    const financialKeys = allColumnKeys.filter((k, idx) => {
      if (mandatoryKeys.includes(k) || idx < 2) return true;
      const col = columns.find((c) => c.key === k);
      return (
        col?.type === 'currency' ||
        col?.type === 'number' ||
        col?.isNumeric ||
        col?.align === 'right' ||
        k.toLowerCase().includes('cost') ||
        k.toLowerCase().includes('price') ||
        k.toLowerCase().includes('amount') ||
        k.toLowerCase().includes('value') ||
        k.toLowerCase().includes('vat')
      );
    });

    const financialPreset: ColumnPreset = {
      id: 'system_financial',
      name: 'Tài chính & Giá trị',
      isSystem: true,
      columnKeys: Array.from(new Set([...mandatoryKeys, ...financialKeys])),
    };

    return [allPreset, compactPreset, financialPreset];
  }, [allColumnKeys, columns, mandatoryKeys]);

  // Synchronous initialization from storage
  const [customPresets, setCustomPresets] = useState<ColumnPreset[]>(() => {
    return loadInitialStorage(storageKey, allColumnKeys, defaultHiddenKeys, mandatoryKeys).initialPresets;
  });
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    return loadInitialStorage(storageKey, allColumnKeys, defaultHiddenKeys, mandatoryKeys).initialActiveId;
  });
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return loadInitialStorage(storageKey, allColumnKeys, defaultHiddenKeys, mandatoryKeys).initialVisibleKeys;
  });

  // Track previous key signature to prevent infinite update cycles
  const prevSignatureRef = useRef<string>(`${storageKey}__${allKeysString}__${defaultHiddenString}__${mandatoryKeysString}`);

  useEffect(() => {
    const currentSignature = `${storageKey}__${allKeysString}__${defaultHiddenString}__${mandatoryKeysString}`;
    if (prevSignatureRef.current === currentSignature) {
      return;
    }
    prevSignatureRef.current = currentSignature;

    const { initialPresets, initialActiveId, initialVisibleKeys } = loadInitialStorage(
      storageKey,
      allColumnKeys,
      defaultHiddenKeys,
      mandatoryKeys
    );

    setCustomPresets((prev) => (areArraysEqual(prev.map(p => p.id), initialPresets.map(p => p.id)) ? prev : initialPresets));
    setActivePresetId((prev) => (prev === initialActiveId ? prev : initialActiveId));
    setVisibleColumnKeys((prev) => (areArraysEqual(prev, initialVisibleKeys) ? prev : initialVisibleKeys));
  }, [storageKey, allKeysString, defaultHiddenString, mandatoryKeysString, allColumnKeys, defaultHiddenKeys, mandatoryKeys]);

  // Helper to persist state
  const persistState = useCallback(
    (newVisibleKeys: string[], newActivePresetId: string, newCustomPresets: ColumnPreset[]) => {
      try {
        const stateToSave: TableColumnStorageState = {
          activePresetId: newActivePresetId,
          customPresets: newCustomPresets,
          visibleColumnKeys: newVisibleKeys,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn(`[useColumnPresets] Failed to save column presets to storage for key ${storageKey}`, e);
      }
    },
    [storageKey]
  );

  // All available presets (system + custom)
  const allPresets = useMemo(() => {
    return [...systemPresets, ...customPresets];
  }, [systemPresets, customPresets]);

  // Active preset object
  const activePreset = useMemo(() => {
    return allPresets.find((p) => p.id === activePresetId) || null;
  }, [allPresets, activePresetId]);

  // Check if a specific column is currently visible
  const isColumnVisible = useCallback(
    (key: string) => {
      if (mandatoryKeys.includes(key)) return true;
      return visibleColumnKeys.includes(key);
    },
    [visibleColumnKeys, mandatoryKeys]
  );

  // Toggle single column
  const toggleColumn = useCallback(
    (key: string) => {
      if (mandatoryKeys.includes(key)) return;
      setVisibleColumnKeys((prev) => {
        let updated: string[];
        if (prev.includes(key)) {
          const nonMandatoryCount = prev.filter((k) => !mandatoryKeys.includes(k)).length;
          if (nonMandatoryCount <= 1) {
            return prev;
          }
          updated = prev.filter((k) => k !== key);
        } else {
          updated = [...prev, key];
        }

        const matched = allPresets.find(
          (p) =>
            p.columnKeys.length === updated.length &&
            p.columnKeys.every((k) => updated.includes(k))
        );
        const newPresetId = matched ? matched.id : 'custom_adhoc';
        setActivePresetId(newPresetId);
        persistState(updated, newPresetId, customPresets);
        onColumnsChange?.(updated);
        return updated;
      });
    },
    [mandatoryKeys, allPresets, customPresets, persistState, onColumnsChange]
  );

  // Set column visibility directly
  const setColumnVisibility = useCallback(
    (key: string, visible: boolean) => {
      if (mandatoryKeys.includes(key)) return;
      setVisibleColumnKeys((prev) => {
        let updated: string[];
        if (visible) {
          if (!prev.includes(key)) {
            updated = [...prev, key];
          } else {
            return prev;
          }
        } else {
          if (prev.includes(key)) {
            const nonMandatoryCount = prev.filter((k) => !mandatoryKeys.includes(k)).length;
            if (nonMandatoryCount <= 1) return prev;
            updated = prev.filter((k) => k !== key);
          } else {
            return prev;
          }
        }
        const matched = allPresets.find(
          (p) =>
            p.columnKeys.length === updated.length &&
            p.columnKeys.every((k) => updated.includes(k))
        );
        const newPresetId = matched ? matched.id : 'custom_adhoc';
        setActivePresetId(newPresetId);
        persistState(updated, newPresetId, customPresets);
        onColumnsChange?.(updated);
        return updated;
      });
    },
    [mandatoryKeys, allPresets, customPresets, persistState, onColumnsChange]
  );

  // Show all columns
  const showAllColumns = useCallback(() => {
    setVisibleColumnKeys(allColumnKeys);
    setActivePresetId('system_all');
    persistState(allColumnKeys, 'system_all', customPresets);
    onColumnsChange?.(allColumnKeys);
  }, [allColumnKeys, customPresets, persistState, onColumnsChange]);

  // Apply a specific preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const target = allPresets.find((p) => p.id === presetId);
      if (!target) return;

      const valid = target.columnKeys.filter((k) => allColumnKeys.includes(k));
      const withMandatory = Array.from(new Set([...mandatoryKeys.filter((k) => allColumnKeys.includes(k)), ...valid]));
      
      setVisibleColumnKeys(withMandatory);
      setActivePresetId(presetId);
      persistState(withMandatory, presetId, customPresets);
      onColumnsChange?.(withMandatory);
    },
    [allPresets, allColumnKeys, mandatoryKeys, customPresets, persistState, onColumnsChange]
  );

  // Save current column selection as a new custom preset
  const saveCurrentAsPreset = useCallback(
    (name: string, isDefault = false): ColumnPreset => {
      const trimmedName = name.trim() || `Mẫu tùy chỉnh ${customPresets.length + 1}`;
      const newPreset: ColumnPreset = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        isSystem: false,
        isDefault,
        columnKeys: [...visibleColumnKeys],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedCustom = [...customPresets, newPreset];
      setCustomPresets(updatedCustom);
      setActivePresetId(newPreset.id);
      persistState(visibleColumnKeys, newPreset.id, updatedCustom);
      return newPreset;
    },
    [visibleColumnKeys, customPresets, persistState]
  );

  // Delete a custom preset
  const deletePreset = useCallback(
    (presetId: string) => {
      const updatedCustom = customPresets.filter((p) => p.id !== presetId);
      setCustomPresets(updatedCustom);

      if (activePresetId === presetId) {
        setActivePresetId('system_all');
        setVisibleColumnKeys(allColumnKeys);
        persistState(allColumnKeys, 'system_all', updatedCustom);
        onColumnsChange?.(allColumnKeys);
      } else {
        persistState(visibleColumnKeys, activePresetId, updatedCustom);
      }
    },
    [customPresets, activePresetId, allColumnKeys, visibleColumnKeys, persistState, onColumnsChange]
  );

  // Reset to original default configuration
  const resetToDefault = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn(e);
    }
    const defaultKeys = allColumnKeys.filter((k) => !defaultHiddenKeys.includes(k));
    setVisibleColumnKeys(defaultKeys);
    setActivePresetId('system_all');
    setCustomPresets([]);
    onColumnsChange?.(defaultKeys);
  }, [storageKey, allColumnKeys, defaultHiddenKeys, onColumnsChange]);

  // Visible columns array filtered for rendering
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => isColumnVisible(col.key));
  }, [columns, isColumnVisible]);

  return {
    visibleColumns,
    visibleColumnKeys,
    allColumnKeys,
    presets: allPresets,
    customPresets,
    activePresetId,
    activePreset,
    isColumnVisible,
    toggleColumn,
    setColumnVisibility,
    showAllColumns,
    applyPreset,
    saveCurrentAsPreset,
    deletePreset,
    resetToDefault,
    totalColumnCount: columns.length,
    visibleColumnCount: visibleColumns.length,
  };
}
