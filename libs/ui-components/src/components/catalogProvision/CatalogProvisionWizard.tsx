/**
 * CatalogProvisionWizard — backward-compatible shim.
 *
 * Internally delegates to ProvisioningWizard. The `kind` prop is used only to
 * select the right adapter; once selected the adapter is handed to the shared
 * ProvisioningWizard shell.
 *
 * Prefer using the resource-specific wizards directly:
 *   vm/CreateWizard/VmCreateWizard
 *   Cluster/CreateWizard/ClusterCreateWizard
 *   BareMetalInstance/CreateWizard/BareMetalInstanceCreateWizard
 */
import type { CatalogProvisionKind } from './catalogFieldDefinition';
import type { CatalogItem } from '../catalog/catalogItemDisplay';
import { useBareMetalInstanceAdapter } from './wizard/adapters/bareMetalInstanceAdapter';
import { useClusterAdapter } from './wizard/adapters/clusterAdapter';
import { useComputeInstanceAdapter } from './wizard/adapters/computeInstanceAdapter';
import type { CatalogProvisionAdapter } from './wizard/adapters/types';
import type { CatalogProvisionPayload, CatalogProvisionWizardValues } from './catalogProvisionTypes';
import {
  ProvisioningWizard,
  type ProvisioningWizardCloseHandler,
} from '../ProvisioningWizard/ProvisioningWizard';

export type { CatalogProvisionPayload, CatalogProvisionWizardValues } from './catalogProvisionTypes';

/** @deprecated Use ProvisioningWizardCloseHandler from ProvisioningWizard directly. */
export type CatalogProvisionWizardCloseHandler = ProvisioningWizardCloseHandler;

type ErasedCatalogAdapter = CatalogProvisionAdapter<
  CatalogItem,
  CatalogProvisionWizardValues,
  CatalogProvisionPayload
>;

interface Props {
  kind: CatalogProvisionKind;
  initialCatalogItemId?: string;
  onProvision: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
  onCloseHandlerChange?: (handler: CatalogProvisionWizardCloseHandler) => void;
}

export const CatalogProvisionWizard = ({
  kind,
  initialCatalogItemId,
  onProvision,
  onClosed,
  onCloseHandlerChange,
}: Props) => {
  const vmAdapter = useComputeInstanceAdapter();
  const clusterAdapter = useClusterAdapter();
  const bmAdapter = useBareMetalInstanceAdapter();

  const adapter = (
    kind === 'cluster' ? clusterAdapter : kind === 'bare_metal_instance' ? bmAdapter : vmAdapter
  ) as ErasedCatalogAdapter;

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
