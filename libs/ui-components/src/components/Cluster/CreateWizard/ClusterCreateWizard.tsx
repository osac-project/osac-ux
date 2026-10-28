/**
 * ClusterCreateWizard — self-contained wizard for provisioning a Cluster.
 *
 * Owns the cluster-specific adapter instantiation and delegates all orchestration
 * (Formik, step navigation, cancel modal) to the shared ProvisioningWizard shell.
 */
import type { CatalogItem } from '../../catalog/catalogItemDisplay';
import type { CatalogProvisionAdapter } from '../../catalogProvision/wizard/adapters/types';
import { useClusterAdapter } from '../../catalogProvision/wizard/adapters/clusterAdapter';
import type { CatalogProvisionPayload, CatalogProvisionWizardValues } from '../../catalogProvision/catalogProvisionTypes';
import {
  ProvisioningWizard,
  type ProvisioningWizardCloseHandler,
} from '../../ProvisioningWizard/ProvisioningWizard';

export type { ProvisioningWizardCloseHandler as ClusterCreateWizardCloseHandler };
export type { CatalogProvisionPayload };

type ErasedCatalogAdapter = CatalogProvisionAdapter<
  CatalogItem,
  CatalogProvisionWizardValues,
  CatalogProvisionPayload
>;

interface ClusterCreateWizardProps {
  initialCatalogItemId?: string;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
  onCloseHandlerChange?: (handler: ProvisioningWizardCloseHandler) => void;
}

export const ClusterCreateWizard = ({
  initialCatalogItemId,
  onProvision,
  onClosed,
  onCloseHandlerChange,
}: ClusterCreateWizardProps) => {
  const adapter = useClusterAdapter() as ErasedCatalogAdapter;

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
