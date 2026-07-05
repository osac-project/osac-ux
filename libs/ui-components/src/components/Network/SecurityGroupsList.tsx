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
import ListPageBody from '../Page/ListPageBody';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const PROTOCOL_LABEL: Record<number, string> = {
  [Protocol.UNSPECIFIED]: 'Unknown',
  [Protocol.TCP]: 'TCP',
  [Protocol.UDP]: 'UDP',
  [Protocol.ICMP]: 'ICMP',
  [Protocol.ALL]: 'All',
};

const formatRule = (rule: {
  protocol?: number;
  portFrom?: number;
  portTo?: number;
  ipv4Cidr?: string;
}): string => {
  const proto =
    rule.protocol != null ? (PROTOCOL_LABEL[rule.protocol] ?? String(rule.protocol)) : '—';
  const cidr = rule.ipv4Cidr || '0.0.0.0/0';
  if (rule.portFrom != null && rule.portTo != null) {
    const portRange =
      rule.portFrom === rule.portTo ? String(rule.portFrom) : `${rule.portFrom}–${rule.portTo}`;
    return `${proto} ${portRange} from ${cidr}`;
  }
  return `${proto} from ${cidr}`;
};

interface RulesSectionProps {
  label: string;
  rules: Array<{ protocol?: number; portFrom?: number; portTo?: number; ipv4Cidr?: string }>;
}

const RulesSection = ({ label, rules }: RulesSectionProps) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{label}</DescriptionListTerm>
    <DescriptionListDescription>
      {rules.length === 0 ? (
        <SubtleContent component="small">No rules</SubtleContent>
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

interface SecurityGroupsListProps {
  virtualNetworkId?: string;
}

export const SecurityGroupsList = ({ virtualNetworkId }: SecurityGroupsListProps) => {
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
            No security groups yet. Create one to get started.
          </SubtleContent>
        ) : (
          <Table aria-label="Security groups" variant="compact">
            <Thead>
              <Tr>
                <Th aria-label="Row expand" />
                <Th>Name</Th>
                {!virtualNetworkId && <Th>Virtual network</Th>}
                <Th>State</Th>
                <Th>Inbound rules</Th>
                <Th>Outbound rules</Th>
                <Th aria-label="Actions" />
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
                      <Td dataLabel="Name">{resourceDisplayName(sg.metadata, sg.id)}</Td>
                      {!virtualNetworkId && (
                        <Td dataLabel="Virtual network">
                          {vnetId ? (
                            <Link to={`/networks/${vnetId}`}>{vnetName(vnetId)}</Link>
                          ) : (
                            '—'
                          )}
                        </Td>
                      )}
                      <Td dataLabel="State">
                        <NetworkStatusLabel state={sg.status?.state} />
                      </Td>
                      <Td dataLabel="Inbound rules">{ingressCount}</Td>
                      <Td dataLabel="Outbound rules">{egressCount}</Td>
                      <Td dataLabel="Actions" isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: 'Manage rules',
                              onClick: () => navigate(`/networks/security-groups/${sg.id}/rules`),
                            },
                            {
                              title: 'Delete',
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
                                label="Inbound (ingress)"
                                rules={sg.spec?.ingress ?? []}
                              />
                              <RulesSection
                                label="Outbound (egress)"
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
          resourceKind="security group"
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
