import React, { lazy } from 'react';

/**
 * Enterprise-grade lazy loader with automatic retry mechanism.
 * Mitigates transient network dropouts, dev server restarts, and container wake-ups.
 * Also seamlessly supports both default and named export module conventions.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  componentName?: string,
  retries = 4,
  baseDelayMs = 600
): React.LazyExoticComponent<T> {
  return lazy(() => {
    const attempt = (retriesLeft: number): Promise<{ default: T }> => {
      return factory()
        .then((module: any) => {
          if (!module) {
            throw new Error(`Module failed to resolve`);
          }
          const component =
            (componentName && module[componentName]) ||
            module.default ||
            module[Object.keys(module)[0]];

          if (!component) {
            throw new Error(
              `Module does not export ${componentName || 'default'} component (keys: ${Object.keys(module).join(', ')})`
            );
          }
          return { default: component };
        })
        .catch((error: any) => {
          const isChunkError =
            !error ||
            error?.message?.includes('dynamically imported module') ||
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('Importing a module script failed') ||
            error?.name === 'TypeError';

          console.warn(
            `[NexusSync LazyLoader] Dynamic import failed for ${componentName || 'workspace module'} (retries left: ${retriesLeft}):`,
            error?.message || error
          );

          if (retriesLeft > 0 && isChunkError) {
            const currentDelay = baseDelayMs * (5 - retriesLeft);
            return new Promise((resolve) => setTimeout(resolve, currentDelay)).then(() =>
              attempt(retriesLeft - 1)
            );
          }
          throw error;
        });
    };

    return attempt(retries);
  });
}
