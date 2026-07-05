import {
  BareMetalInstanceConditionType,
  ClusterConditionType,
  ComputeInstanceConditionType,
  ConditionStatus,
} from '@osac/types';

export type ConditionResourceKind = 'cluster' | 'compute_instance' | 'baremetal_instance';

export const humanizeConditionType = (
  type: ClusterConditionType | ComputeInstanceConditionType | BareMetalInstanceConditionType,
  resourceKind: ConditionResourceKind,
): string => {
  if (resourceKind === 'cluster') {
    const name = ClusterConditionType[type as ClusterConditionType];
    if (typeof name === 'string') {
      return name.replace(/_/g, ' ');
    }
  } else if (resourceKind === 'compute_instance') {
    const name = ComputeInstanceConditionType[type as ComputeInstanceConditionType];
    if (typeof name === 'string') {
      return name.replace(/^COMPUTE_INSTANCE_CONDITION_TYPE_/, '').replace(/_/g, ' ');
    }
  } else if (resourceKind === 'baremetal_instance') {
    const name = BareMetalInstanceConditionType[type as BareMetalInstanceConditionType];
    if (typeof name === 'string') {
      return name.replace(/^BARE_METAL_INSTANCE_CONDITION_TYPE_/, '').replace(/_/g, ' ');
    }
  }
  return String(type);
};

export const formatConditionStatusForDisplay = (status: ConditionStatus): string => {
  switch (status) {
    case ConditionStatus.TRUE:
      return 'True';
    case ConditionStatus.FALSE:
      return 'False';
    default:
      return 'Unknown';
  }
};

export const formatIsoDate = (iso?: string): string => {
  if (!iso?.trim()) {
    return '—';
  }
  const t = Date.parse(iso.trim());
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString();
};

export const displayValue = (value?: string): string => value?.trim() || '—';
