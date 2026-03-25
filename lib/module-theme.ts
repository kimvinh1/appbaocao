export const MODULE_THEMES = {
  illumina: {
    label: 'Illumina',
    textClass: 'text-orange-300',
    badgeClass: 'bg-orange-500/10 border-orange-500/30',
    buttonClass: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 ring-orange-400/40',
    focusBorderClass: 'focus:border-orange-400',
  },
  'vi-sinh': {
    label: 'Vi Sinh',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/10 border-red-500/30',
    buttonClass: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-red-400/40',
    focusBorderClass: 'focus:border-red-400',
  },
  cepheid: {
    label: 'Cepheid',
    textClass: 'text-cyan-300',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/30',
    buttonClass: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-cyan-400/40',
    focusBorderClass: 'focus:border-cyan-400',
  },
  'sinh-hoc-phan-tu': {
    label: 'Cepheid',
    textClass: 'text-cyan-300',
    badgeClass: 'bg-cyan-500/10 border-cyan-500/30',
    buttonClass: 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 ring-cyan-400/40',
    focusBorderClass: 'focus:border-cyan-400',
  },
} as const;

export type ModuleKey = keyof typeof MODULE_THEMES;

const FALLBACK_MODULE_THEME = {
  label: 'Khác',
  textClass: 'text-slate-300',
  badgeClass: 'bg-slate-800/50 border-slate-700',
  buttonClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 ring-slate-600',
  focusBorderClass: 'focus:border-slate-500',
} as const;

export function getModuleTheme(module: string) {
  return MODULE_THEMES[module as ModuleKey] ?? FALLBACK_MODULE_THEME;
}

export function normalizeModuleKey(module: string) {
  if (module === 'sinh-hoc-phan-tu') {
    return 'cepheid';
  }

  return module;
}

export function resolveModuleAliases(module?: string) {
  if (!module) {
    return undefined;
  }

  if (module === 'cepheid' || module === 'sinh-hoc-phan-tu') {
    return ['cepheid', 'sinh-hoc-phan-tu'];
  }

  return [module];
}
