/**
 * Debug Logger utility specifically for M16POSRetailWorkspace & Sales Engine
 * Intercepts fetch calls, logs request headers, raw responses, status, and state transitions.
 */

export interface M16DebugLogOptions {
  label?: string;
  extraState?: Record<string, any>;
}

export async function fetchM16Debug(url: string, options?: RequestInit, debugOptions?: M16DebugLogOptions): Promise<any> {
  const label = debugOptions?.label || 'M16_POS_FETCH';
  const headers = options?.headers || {};
  
  console.group(`[${label}] Request -> ${url}`);
  console.log('Method:', options?.method || 'GET');
  console.log('Headers:', headers);
  if (options?.body) {
    try {
      console.log('Payload:', JSON.parse(String(options.body)));
    } catch {
      console.log('Payload (raw):', options.body);
    }
  }
  if (debugOptions?.extraState) {
    console.log('State Snapshot Before Request:', debugOptions.extraState);
  }
  console.groupEnd();

  const startTime = performance.now();
  try {
    const res = await fetch(url, options);
    const duration = (performance.now() - startTime).toFixed(2);
    const clonedRes = res.clone();
    
    let rawText = '';
    try {
      rawText = await clonedRes.text();
    } catch (e) {
      rawText = '[Could not read response text]';
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = rawText;
    }

    console.group(`[${label}] Response <- ${url} (${res.status} ${res.statusText}) [${duration}ms]`);
    console.log('Status OK:', res.ok);
    console.log('Raw Data:', parsedData);
    console.groupEnd();

    return {
      response: res,
      data: parsedData,
      rawText
    };
  } catch (err) {
    console.group(`[${label}] Error <- ${url}`);
    console.error('Fetch Exception:', err);
    console.groupEnd();
    throw err;
  }
}

export function logM16StateTransition(transitionName: string, prevState: any, nextState: any) {
  console.group(`[M16_STATE_TRANSITION] ${transitionName}`);
  console.log('Previous State:', prevState);
  console.log('Next State:', nextState);
  console.groupEnd();
}
