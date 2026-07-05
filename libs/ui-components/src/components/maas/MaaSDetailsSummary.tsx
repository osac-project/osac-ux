import BanIcon from '@patternfly/react-icons/dist/esm/icons/ban-icon';
import BrainIcon from '@patternfly/react-icons/dist/esm/icons/brain-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import ResourcesFullIcon from '@patternfly/react-icons/dist/esm/icons/resources-full-icon';

import type { ModelAccess, ModelCatalogItem } from '@osac/ui-components/api/v1/maas-types';

import { ResourceKpiHeader } from '../Resource/Header';

const ModelAccessStateBadge = ({ state }: { state: ModelAccess['status']['state'] }) => {
  switch (state) {
    case 'ACTIVE':
      return (
        <span style={{ color: 'var(--pf-t--global--color--status--success--default)' }}>
          Active
        </span>
      );
    case 'PROVISIONING':
      return (
        <span style={{ color: 'var(--pf-t--global--color--status--info--default)' }}>
          Provisioning
        </span>
      );
    case 'REVOKED':
      return <span style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>Revoked</span>;
    default:
      return <span>—</span>;
  }
};

interface MaaSDetailsSummaryProps {
  access: ModelAccess;
  catalogItem?: ModelCatalogItem;
}

export const MaaSDetailsSummary = ({ access, catalogItem }: MaaSDetailsSummaryProps) => {
  const endpoint = access.status?.endpoint;
  const endpointDisplay = endpoint
    ? endpoint.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : '—';

  const quota = access.spec?.tokenQuotaMonthly;
  const quotaDisplay = quota != null ? `${quota.toLocaleString()} tokens/mo` : '—';

  return (
    <ResourceKpiHeader
      ariaLabel="AI model access summary"
      items={[
        {
          title: 'Status',
          icon: BanIcon,
          value: <ModelAccessStateBadge state={access.status?.state} />,
        },
        {
          title: 'Model',
          icon: BrainIcon,
          value: catalogItem?.title ?? access.spec?.catalogItem ?? '—',
        },
        {
          title: 'Endpoint',
          icon: GlobeIcon,
          value: endpointDisplay,
        },
        {
          title: 'Monthly quota',
          icon: ResourcesFullIcon,
          value: quotaDisplay,
        },
      ]}
    />
  );
};
