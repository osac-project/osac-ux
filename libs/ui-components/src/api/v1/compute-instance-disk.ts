// @temp-api — extend once ComputeInstanceDisk proto adds storageClass/deviceName
// This type is used purely for display in the UI; the mock data includes these fields
// even though the proto currently only has sizeGib.
export interface DiskWithMeta {
  sizeGib: number;
  storageClass?: 'standard' | 'ssd' | 'nvme';
  deviceName?: string;
}

export const STORAGE_CLASS_LABELS: Record<string, string> = {
  standard: 'Standard',
  ssd: 'SSD',
  nvme: 'NVMe',
};

export const STORAGE_CLASS_COLORS: Record<string, 'grey' | 'blue' | 'green'> = {
  standard: 'grey',
  ssd: 'blue',
  nvme: 'green',
};

export function asDiskWithMeta(disk: unknown): DiskWithMeta {
  return disk as DiskWithMeta;
}
