import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { CLUSTER_VERSION_WIRE_PATH } from './fields';
import { createNodeSetRowId } from './fields';
import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

/** The version catalog default is a ClusterVersionReference struct ({ name }); unwrap its name. */
const versionDefaultToName = (defaultValue: unknown): string | undefined => {
  if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
    const name = (defaultValue as { name?: unknown }).name;
    return typeof name === 'string' ? name : undefined;
  }
  return undefined;
};

export const applyClusterCatalogConfigurationDefaults = (
  catalogItem: ClusterCatalogItem,
  helpers: FormikHelpers<ClusterWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const versionOverlay = getCatalogFieldOverlay(
    CLUSTER_VERSION_WIRE_PATH,
    definitions,
    t('Version'),
  );
  const value =
    versionDefaultToName(versionOverlay.defaultValue) ?? overlayDefaultToFormValue(versionOverlay);
  if (value !== undefined) {
    void helpers.setFieldValue('spec.versionName', value);
  }

  const nodeSetsPolicy = catalogItem.fields?.nodeSets;
  const nodeSets =
    nodeSetsPolicy?.behavior.case === 'locked'
      ? nodeSetsPolicy.behavior.value.items
      : nodeSetsPolicy?.behavior.case === 'editable'
        ? nodeSetsPolicy.behavior.value.defaultValue?.items
        : undefined;
  if (nodeSets) {
    void helpers.setFieldValue(
      'spec.nodeSetRows',
      Object.entries(nodeSets).map(([name, nodeSet]) => ({
        rowId: createNodeSetRowId(),
        name,
        hostType: nodeSet.hostType?.id || nodeSet.hostType?.name || '',
        size: nodeSet.size > 0 ? String(nodeSet.size) : '',
      })),
    );
  }
};
