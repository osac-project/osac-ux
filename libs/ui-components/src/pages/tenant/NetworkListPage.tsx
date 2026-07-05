/**
 * flow: manage-networking
 * step: network_list
 * route: /networks
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import { useComputeInstances } from '../../api/v1/compute-instance';
import { NetworkClassesList } from '../../components/Network/NetworkClassesList';
import { SecurityGroupsList } from '../../components/Network/SecurityGroupsList';
import { SubnetsList } from '../../components/Network/SubnetsList';
import { VirtualNetworksList } from '../../components/Network/VirtualNetworksList';
import ListPage from '../../components/Page/ListPage';
import { NetworkTopologyPage } from '../../NetworkTopologyPage';

type NetworkTab = 'vnets' | 'subnets' | 'security-groups' | 'topology' | 'classes';

export const NetworkListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as NetworkTab | null;
  const [activeTab, setActiveTab] = React.useState<NetworkTab>(tabParam ?? 'vnets');

  const { data: vms = [], isLoading: vmsLoading } = useComputeInstances();

  const tabActions: Partial<Record<NetworkTab, React.ReactNode>> = {
    vnets: (
      <Button variant="primary" onClick={() => navigate('/networks/new')}>
        Create virtual network
      </Button>
    ),
    subnets: (
      <Button variant="primary" onClick={() => navigate('/networks/subnets/new')}>
        Create subnet
      </Button>
    ),
    'security-groups': (
      <Button variant="primary" onClick={() => navigate('/networks/security-groups/new')}>
        Create security group
      </Button>
    ),
  };

  return (
    <ListPage
      title="Networks"
      description="Manage your virtual networks, subnets, and security groups."
      actions={tabActions[activeTab]}
    >
      <Tabs
        activeKey={activeTab}
        onSelect={(_e, key) => setActiveTab(key as NetworkTab)}
        aria-label="Network tabs"
      >
        <Tab eventKey="vnets" title={<TabTitleText>Virtual Networks</TabTitleText>}>
          <VirtualNetworksList />
        </Tab>
        <Tab eventKey="subnets" title={<TabTitleText>Subnets</TabTitleText>}>
          <SubnetsList />
        </Tab>
        <Tab eventKey="security-groups" title={<TabTitleText>Security Groups</TabTitleText>}>
          <SecurityGroupsList />
        </Tab>
        <Tab eventKey="topology" title={<TabTitleText>Topology</TabTitleText>}>
          {!vmsLoading && <NetworkTopologyPage vms={vms} />}
        </Tab>
        <Tab eventKey="classes" title={<TabTitleText>Network Classes</TabTitleText>}>
          <NetworkClassesList />
        </Tab>
      </Tabs>
    </ListPage>
  );
};
