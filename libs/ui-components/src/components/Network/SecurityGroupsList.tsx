import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import {
  ActionsColumn,
  ExpandableRowContent,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';

import type { SecurityGroup } from '@osac/types';
import { Protocol } from '@osac/types';

import { NetworkStatusLabel } from './NetworkStatusLabel';
import {
  resourceDisplayName,
  useDeleteSecurityGroup,
  useSecurityGroups,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import ListPageBody from '../Page/ListPageBody';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { SubtleContent } from '../SubtleContent/SubtleContent';

interface RulesSectionProps {
  label: string;
  rules: Array<{ protocol?: number; portFrom?: number; portTo?: number; ipv4Cidr?: string }>;
}

const RulesSection = ({ label, rules }: RulesSectionProps) => {
  const { t } = useTranslation();

  const protocolLabel: Record<number, string> = {
    [Protocol.UNSPECIFIED]: t('Unknown'),
    [Protocol.TCP]: t('TCP'),
    [Protocol.UDP]: t('UDP'),
    [Protocol.ICMP]: t('ICMP'),
    [Protocol.ALL]: t('All'),
  };

  const formatRule = (rule: {
    protocol?: number;
    portFrom?: number;
    portTo?: number;
    ipv4Cidr?: string;
  }): string => {
    const proto =
      rule.protocol != null ? (protocolLabel[rule.protocol] ?? String(rule.protocol)) : '—';
    const cidr = rule.ipv4Cidr || '0.0.0.0/0';
    if (rule.portFrom != null && rule.portTo != null) {
      const portRange =
        rule.portFrom === rule.portTo ? String(rule.portFrom) : `${rule.portFrom}–${rule.portTo}`;
      return t('{{proto}} {{portRange}} from {{cidr}}', { proto, portRange, cidr });
    }
    return t('{{proto}} from {{cidr}}', { proto, cidr });
  };

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDescription>
        {rules.length === 0 ? (
          <SubtleContent component="small">{t('No rules')}</SubtleContent>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {rules.map((r, i) => (
              <li key={i}>{formatRule(r)}</li>
            ))}
          </ul>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

interface SecurityGroupsListProps {
  virtualNetworkId?: string;
}

export const SecurityGroupsList = ({ virtualNetworkId }: SecurityGroupsListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = virtualNetworkId
    ? { filter: virtualNetworkFilterForSubnetList(virtualNetworkId) }
    : {};

  const { data: groups = [], isLoading, error } = useSecurityGroups(params);
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !virtualNetworkId });
  const deleteSG = useDeleteSecurityGroup();
  const [deleteTarget, setDeleteTarget] = React.useState<SecurityGroup | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const vnetName = (vnetId: string) => {
    const vn = virtualNetworks.find((v) => v.id === vnetId);
    return vn ? resourceDisplayName(vn.metadata, vn.id) : vnetId;
  };

  const expandColSpan = virtualNetworkId ? 5 : 6;

  return (
    <>
      <ListPageBody isLoading={isLoading} error={error}>
        {groups.length === 0 ? (
          <SubtleContent component="p">
            {t('No security groups yet. Create one to get started.')}
          </SubtleContent>
        ) : (
          <Table aria-label={t('Security groups')} variant="compact">
            <Thead>
              <Tr>
                <Th aria-label={t('Row expand')} />
                <Th>{t('Name')}</Th>
                {!virtualNetworkId && <Th>{t('Virtual network')}</Th>}
                <Th>{t('State')}</Th>
                <Th>{t('Inbound rules')}</Th>
                <Th>{t('Outbound rules')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {groups.map((sg) => {
                const isExpanded = expandedIds.has(sg.id);
                const ingressCount = sg.spec?.ingress?.length ?? 0;
                const egressCount = sg.spec?.egress?.length ?? 0;
                const vnetId = sg.spec?.virtualNetwork;
                return (
                  <React.Fragment key={sg.id}>
                    <Tr>
                      <Td
                        expand={{
                          rowIndex: 0,
                          isExpanded,
                          onToggle: () => toggleExpand(sg.id),
                          expandId: `sg-expand-${sg.id}`,
                        }}
                      />
                      <Td dataLabel={t('Name')}>{resourceDisplayName(sg.metadata, sg.id)}</Td>
                      {!virtualNetworkId && (
                        <Td dataLabel={t('Virtual network')}>
                          {vnetId ? (
                            <Link to={`/networks/${vnetId}`}>{vnetName(vnetId)}</Link>
                          ) : (
                            '—'
                          )}
                        </Td>
                      )}
                      <Td dataLabel={t('State')}>
                        <NetworkStatusLabel state={sg.status?.state} />
                      </Td>
                      <Td dataLabel={t('Inbound rules')}>{ingressCount}</Td>
                      <Td dataLabel={t('Outbound rules')}>{egressCount}</Td>
                      <Td dataLabel={t('Actions')} isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: t('Manage rules'),
                              onClick: () => navigate(`/networks/security-groups/${sg.id}/rules`),
                            },
                            {
                              title: t('Delete'),
                              onClick: (e: React.MouseEvent) => {
                                e.stopPropagation();
                                setDeleteTarget(sg);
                              },
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                    {isExpanded && (
                      <Tr isExpanded>
                        <Td colSpan={expandColSpan}>
                          <ExpandableRowContent>
                            <DescriptionList isHorizontal>
                              <RulesSection
                                label={t('Inbound (ingress)')}
                                rules={sg.spec?.ingress ?? []}
                              />
                              <RulesSection
                                label={t('Outbound (egress)')}
                                rules={sg.spec?.egress ?? []}
                              />
                            </DescriptionList>
                          </ExpandableRowContent>
                        </Td>
                      </Tr>
                    )}
                  </React.Fragment>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>

      {deleteTarget && (
        <DeleteConfirmModal
          resourceName={resourceDisplayName(deleteTarget.metadata, deleteTarget.id)}
          resourceKind={t('security group')}
          error={deleteSG.error}
          onConfirm={async () => {
            await deleteSG.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onClose={() => {
            deleteSG.reset();
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
};
