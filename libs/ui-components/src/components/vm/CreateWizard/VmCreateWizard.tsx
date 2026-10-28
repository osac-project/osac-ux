/**
 * VmCreateWizard — self-contained wizard for provisioning a ComputeInstance.
 *
 * Owns the VM-specific adapter instantiation and delegates all orchestration
 * (Formik, step navigation, cancel modal) to the shared ProvisioningWizard shell.
 */
import type { CatalogItem } from '../../catalog/catalogItemDisplay';
import type { CatalogProvisionAdapter } from '../../catalogProvision/wizard/adapters/types';
import { useComputeInstanceAdapter } from '../../catalogProvision/wizard/adapters/computeInstanceAdapter';
import type { CatalogProvisionPayload, CatalogProvisionWizardValues } from '../../catalogProvision/catalogProvisionTypes';
import {
  ProvisioningWizard,
  type ProvisioningWizardCloseHandler,
} from '../../ProvisioningWizard/ProvisioningWizard';

export type { ProvisioningWizardCloseHandler as VmCreateWizardCloseHandler };
export type { CatalogProvisionPayload };

type ErasedCatalogAdapter = CatalogProvisionAdapter<
  CatalogItem,
  CatalogProvisionWizardValues,
  CatalogProvisionPayload
>;

interface VmCreateWizardProps {
  initialCatalogItemId?: string;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
  onCloseHandlerChange?: (handler: ProvisioningWizardCloseHandler) => void;
}

export const VmCreateWizard = ({
  initialCatalogItemId,
  onProvision,
  onClosed,
  onCloseHandlerChange,
}: VmCreateWizardProps) => {
  const adapter = useComputeInstanceAdapter() as ErasedCatalogAdapter;

  return (
    <ProvisioningWizard
      adapter={adapter}
      initialCatalogItemId={initialCatalogItemId}
      onProvision={onProvision}
      onClosed={onClosed}
      onCloseHandlerChange={onCloseHandlerChange}
    />
  );
};
