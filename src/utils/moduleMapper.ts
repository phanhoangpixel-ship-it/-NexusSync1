import { MODULE_REGISTRY, ModuleDefinition } from '../config/moduleRegistry';

export interface ModuleInfo {
  code: string;
  name: string;
  shortLabel: string;
  fullLabel: string;
  route?: string;
  domain?: string;
  group?: string;
}

/**
 * Extract normalized module identifier (e.g. M17, M25, M08)
 */
export function extractModuleCode(sourceModuleStr: string): string {
  if (!sourceModuleStr) return 'M00';
  const bracketMatch = sourceModuleStr.match(/\[(M\d{1,2}[A-Z]?)\]/i);
  if (bracketMatch && bracketMatch[1]) return bracketMatch[1].toUpperCase();

  const tokenMatch = sourceModuleStr.match(/\b(M\d{1,2}[A-Z]?)\b/i);
  if (tokenMatch && tokenMatch[1]) return tokenMatch[1].toUpperCase();

  const startMatch = sourceModuleStr.match(/^(M\d+)/i);
  if (startMatch && startMatch[1]) return startMatch[1].toUpperCase();

  return sourceModuleStr.trim();
}

/**
 * Resolve friendly module label and metadata from MODULE_REGISTRY
 */
export function getModuleInfo(modStr: string): ModuleInfo {
  const code = extractModuleCode(modStr);
  const matched = MODULE_REGISTRY.find(
    (m: ModuleDefinition) => m.moduleId.toUpperCase() === code.toUpperCase() || m.code.toUpperCase() === code.toUpperCase()
  );
  if (matched) {
    const cleanName = matched.moduleName.replace(/\(.*?\)/g, '').trim();
    return {
      code: matched.moduleId,
      name: matched.moduleName,
      shortLabel: `${matched.moduleId} • ${cleanName}`,
      fullLabel: `[${matched.moduleId}] ${matched.moduleName}`,
      route: matched.route,
      domain: matched.domain,
      group: matched.group,
    };
  }
  return {
    code,
    name: modStr,
    shortLabel: modStr,
    fullLabel: modStr,
    route: `/${code.toLowerCase()}`,
  };
}

/**
 * Resolve router path for a module code
 */
export function resolveModuleRoute(moduleId: string): string {
  const info = getModuleInfo(moduleId);
  return info.route || `/${extractModuleCode(moduleId).toLowerCase()}`;
}

/**
 * Get readable label formatted as 'M17 • Inventory Core'
 */
export function getModuleLabel(moduleId: string): string {
  const info = getModuleInfo(moduleId);
  return info.shortLabel;
}
