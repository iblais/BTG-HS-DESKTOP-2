/**
 * Feature Flags System for BTG Platform
 *
 * Priority order:
 * 1. URL overrides (dev only, ?ff_flagName=true)
 * 2. Supabase feature_flags table (production source of truth)
 * 3. Local defaults (fallback when offline/not authenticated)
 *
 * Usage in components:
 *   import { useFeatureFlag } from '@/lib/featureFlags';
 *   const isEnabled = useFeatureFlag('newModuleStructure');
 *
 * Admin UI available in Account Settings for admins.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
}

// Feature flag definitions with defaults (fallback when DB unavailable)
export const FLAG_DEFAULTS: Record<string, boolean> = {
  // Phase A: Foundation
  newModuleStructure: false,
  fridayQuizOnly: false,
  removeIntermediate: false,

  // Phase B: Content
  videoContainers: false,
  moduleNavigation: false,

  // Phase C: Assessment
  assignmentWorkflow: false,
  aiGrading: false,

  // Phase D: Teacher
  teacherDashboard: false,
  classManagement: false,

  // Phase E: Platform
  pdfExport: false,
  googleClassroom: false,
  spanishLanguage: false,

  // Debug
  debugMode: false,
  mockAiGrading: false,
};

export type FeatureFlagKey = keyof typeof FLAG_DEFAULTS;

// ============================================
// STATE
// ============================================

const CACHE_KEY = 'btg_feature_flags_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface FlagCache {
  flags: Record<string, boolean>;
  timestamp: number;
}

let dbFlags: Record<string, boolean> = {};
let dbFlagsLoaded = false;
let dbFlagsLoading = false;
let flagListeners: Array<() => void> = [];

// ============================================
// CACHE HELPERS
// ============================================

function getCachedFlags(): FlagCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: FlagCache = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      return null; // Cache expired
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedFlags(flags: Record<string, boolean>): void {
  try {
    const cache: FlagCache = { flags, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// URL OVERRIDES (DEV ONLY)
// ============================================

function getUrlOverrides(): Partial<Record<string, boolean>> {
  // Only allow URL overrides in development
  if (!import.meta.env.DEV) return {};
  if (typeof window === 'undefined') return {};

  const overrides: Partial<Record<string, boolean>> = {};
  const params = new URLSearchParams(window.location.search);

  for (const key of Object.keys(FLAG_DEFAULTS)) {
    const paramValue = params.get(`ff_${key}`);
    if (paramValue !== null) {
      overrides[key] = paramValue === 'true' || paramValue === '1';
    }
  }

  return overrides;
}

// ============================================
// LOAD FLAGS FROM SUPABASE
// ============================================

export async function loadFlagsFromDb(): Promise<void> {
  if (dbFlagsLoading) return;

  dbFlagsLoading = true;

  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('flag_key, enabled');

    if (error) {
      console.warn('[FeatureFlags] Failed to load from DB:', error.message);
      // Fall back to cache
      const cached = getCachedFlags();
      if (cached) {
        dbFlags = cached.flags;
      }
    } else if (data) {
      dbFlags = {};
      data.forEach((row: { flag_key: string; enabled: boolean }) => {
        dbFlags[row.flag_key] = row.enabled;
      });
      setCachedFlags(dbFlags);
    }

    dbFlagsLoaded = true;
  } catch (err) {
    console.warn('[FeatureFlags] Error loading flags:', err);
    const cached = getCachedFlags();
    if (cached) {
      dbFlags = cached.flags;
    }
    dbFlagsLoaded = true;
  } finally {
    dbFlagsLoading = false;
    notifyListeners();
  }
}

function notifyListeners(): void {
  flagListeners.forEach((listener) => listener());
}

// ============================================
// GET FLAGS
// ============================================

export function getAllFlags(): Record<FeatureFlagKey, boolean> {
  const urlOverrides = getUrlOverrides();

  // Load from cache if DB not yet loaded
  if (!dbFlagsLoaded) {
    const cached = getCachedFlags();
    if (cached) {
      dbFlags = cached.flags;
    }
  }

  return {
    ...FLAG_DEFAULTS,
    ...dbFlags,
    ...urlOverrides,
  } as Record<FeatureFlagKey, boolean>;
}

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  const flags = getAllFlags();
  return flags[flag] ?? false;
}

// ============================================
// ADMIN: UPDATE FLAGS
// ============================================

export async function setFlagEnabled(
  flagKey: FeatureFlagKey,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('feature_flags')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('flag_key', flagKey);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update local state
    dbFlags[flagKey] = enabled;
    setCachedFlags(dbFlags);
    notifyListeners();

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}

export async function getAllFlagsFromDb(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_key');

  if (error) {
    console.error('[FeatureFlags] Failed to load all flags:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CHECK IF USER IS ADMIN
// ============================================

export async function isUserAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_admin');

    if (error) {
      // If RPC doesn't exist yet, fall back to direct query
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userData.user.id)
        .single();

      return !!adminData;
    }

    return data === true;
  } catch {
    return false;
  }
}

// ============================================
// REACT HOOKS
// ============================================

export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag));

  useEffect(() => {
    // Load from DB if not yet loaded
    if (!dbFlagsLoaded && !dbFlagsLoading) {
      loadFlagsFromDb();
    }

    // Subscribe to changes
    const listener = () => {
      setEnabled(isFeatureEnabled(flag));
    };

    flagListeners.push(listener);

    // Initial check
    setEnabled(isFeatureEnabled(flag));

    return () => {
      flagListeners = flagListeners.filter((l) => l !== listener);
    };
  }, [flag]);

  return enabled;
}

export function useFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const [flags, setFlags] = useState(() => getAllFlags());

  useEffect(() => {
    if (!dbFlagsLoaded && !dbFlagsLoading) {
      loadFlagsFromDb();
    }

    const listener = () => {
      setFlags(getAllFlags());
    };

    flagListeners.push(listener);
    setFlags(getAllFlags());

    return () => {
      flagListeners = flagListeners.filter((l) => l !== listener);
    };
  }, []);

  return flags;
}

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    isUserAdmin().then(setIsAdmin);
  }, []);

  return isAdmin;
}

// Hook for admin flag management
export function useFeatureFlagAdmin() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const admin = await isUserAdmin();
      setIsAdmin(admin);

      if (admin) {
        const allFlags = await getAllFlagsFromDb();
        setFlags(allFlags);
      }

      setLoading(false);
    };

    load();
  }, []);

  const toggleFlag = useCallback(async (flagKey: string, enabled: boolean) => {
    const result = await setFlagEnabled(flagKey as FeatureFlagKey, enabled);
    if (result.success) {
      setFlags((prev) =>
        prev.map((f) =>
          f.flag_key === flagKey ? { ...f, enabled } : f
        )
      );
    }
    return result;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadFlagsFromDb();
    const allFlags = await getAllFlagsFromDb();
    setFlags(allFlags);
    setLoading(false);
  }, []);

  return { flags, loading, isAdmin, toggleFlag, refresh };
}

// ============================================
// DEV TOOLS (development only)
// ============================================

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).BTG_FLAGS = {
    list: () => {
      const flags = getAllFlags();
      console.table(flags);
      return flags;
    },
    isEnabled: isFeatureEnabled,
    reload: loadFlagsFromDb,

    // Dev-only local overrides (don't affect production)
    _devEnable: (flag: FeatureFlagKey) => {
      dbFlags[flag] = true;
      notifyListeners();
      console.log(`[DEV] Enabled: ${flag}`);
    },
    _devDisable: (flag: FeatureFlagKey) => {
      dbFlags[flag] = false;
      notifyListeners();
      console.log(`[DEV] Disabled: ${flag}`);
    },
    _devEnableAll: () => {
      Object.keys(FLAG_DEFAULTS).forEach((key) => {
        dbFlags[key] = true;
      });
      notifyListeners();
      console.log('[DEV] All flags enabled');
    },
  };
}

// ============================================
// INITIALIZE
// ============================================

// Load flags on module initialization (but don't block)
if (typeof window !== 'undefined') {
  // Use cached flags immediately
  const cached = getCachedFlags();
  if (cached) {
    dbFlags = cached.flags;
  }

  // Then load fresh from DB
  loadFlagsFromDb();
}

export default {
  isEnabled: isFeatureEnabled,
  getAll: getAllFlags,
  loadFromDb: loadFlagsFromDb,
  setEnabled: setFlagEnabled,
  isUserAdmin,
};
