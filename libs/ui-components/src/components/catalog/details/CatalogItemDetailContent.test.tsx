import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { CatalogItemDetailContent } from './CatalogItemDetailContent';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const vmItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'catalog-rhel-9',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    displayName: '',
    description: '',
    name: 'catalog-rhel-9',
    annotations: {},
    creator: 'foo',
    labels: { 'run-strategy': 'Always' },
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  published: true,
  template: {
    $typeName: 'osac.public.v1.ComputeInstanceTemplateReference',
    id: 'tpl-rhel-9',
    name: 'RHEL 9 template',
    project: 'foo',
    shared: true,
  },
  fields: {
    instanceType: {
      behavior: { case: 'locked', value: { id: 'it-small', name: 'standard-2-4' } },
    },
    bootDisk: {
      sizeGib: { behavior: { case: 'locked', value: 40 } },
      storageTier: {
        behavior: { case: 'locked', value: { id: 'tier-fast', name: 'Fast SSD' } },
      },
    },
    userData: { behavior: { case: 'locked', value: '#cloud-config' } },
  } as ComputeInstanceCatalogItem['fields'],
  templateParameters: {},
};

describe('CatalogItemDetailContent', () => {
  it('shows drawer-era details including run-strategy configuration and labels', () => {
    render(<CatalogItemDetailContent item={vmItem} />);

    expect(screen.getByText('catalog-rhel-9')).toBeInTheDocument();
    expect(screen.getByText('RHEL 9 base image')).toBeInTheDocument();
    expect(screen.getByText('RHEL 9 template')).toBeInTheDocument();
    expect(screen.getByText('tpl-rhel-9')).toBeInTheDocument();
    expect(screen.getByText('Hardware specifications')).toBeInTheDocument();
    expect(screen.getByText('standard-2-4 (it-small)')).toBeInTheDocument();
    expect(screen.getByText('40 GiB')).toBeInTheDocument();
    expect(screen.getByText('Fast SSD (tier-fast)')).toBeInTheDocument();
    expect(screen.getByText('Configured')).toBeInTheDocument();
  });
});
