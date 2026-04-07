// Constants cho Resource Link Library — không phải server action

export const RESOURCE_MODULES = [
  { value: 'chung',     label: 'Chung' },
  { value: 'illumina',  label: 'Illumina' },
  { value: 'vi-sinh',   label: 'Vi Sinh' },
  { value: 'cepheid',   label: 'Cepheid / SBPM' },
] as const;

export const RESOURCE_CATEGORIES = [
  'Máy móc',
  'Kit & Reagent',
  'Phần mềm',
  'IFU / SDS',
  'Quy trình hãng',
  'Khác',
] as const;
