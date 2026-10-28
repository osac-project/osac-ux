/**
 * BareMetalInstanceCreateWizard — self-contained wizard for provisioning a BareMetalInstance.
 *
 * Owns the bare-metal-specific adapter instantiation and delegates all orchestration
 * (Formik, step navigation, cancel modal) to the shared ProvisioningWizard shell.
 */
import type { CatalogItem } from '../../catalog/catalogItemDisplay';
import type { CatalogProvisionAdapter } from '../../catalogProvision/wizard/adapters/types';
import { useBareMetalInstanceAdapter } from '../../catalogProvision/wizard/adapters/bareMetalInstanceAdapter';
import type { CatalogProvisionPayload, CatalogProvisionWizardValues } from '../../catalogProvision/catalogProvisionTypes';
import {
  ProvisioningWizard,
  type ProvisioningWizardCloseHandler,
} from '../../ProvisioningWizard/ProvisioningWizard';

export type { ProvisioningWizardCloseHandler as BareMetalInstanceCreateWizardCloseHandler };
export type { CatalogProvisionPayload };

type ErasedCatalogAdapter = CatalogProvisionAdapter<
  CatalogItem,
  CatalogProvisionWizardValues,
  CatalogProvisionPayload
>;

interface BareMetalInstanceCreateWizardProps {
  initialCatalogItemId?: string;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
  onCloseHandlerChange?: (handler: ProvisioningWizardCloseHandler) => void;
}

export const BareMetalInstanceCreateWizard = ({
  initialCatalogItemId,
  onProvision,
  onClosed,
  onCloseHandlerChange,
}: BareMetalInstanceCreateWizardProps) => {
  const adapter = useBareMetalInstanceAdapter() as ErasedCatalogAdapter;

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
