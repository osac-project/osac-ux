import { Route, Routes } from 'react-router-dom';

import { NetworkListPage } from './NetworkListPage';
import { SecurityGroupNewPage } from './SecurityGroupNewPage';
import { SecurityGroupRulesPage } from './SecurityGroupRulesPage';
import { SubnetNewPage } from './SubnetNewPage';
import { VirtualNetworkDetailPage } from './VirtualNetworkDetailPage';
import { VirtualNetworkNewPage } from './VirtualNetworkNewPage';

export const NetworkRoutes = () => (
  <Routes>
    <Route index element={<NetworkListPage />} />
    <Route path="new" element={<VirtualNetworkNewPage />} />
    <Route path="subnets/new" element={<SubnetNewPage />} />
    <Route path="security-groups/new" element={<SecurityGroupNewPage />} />
    <Route path="security-groups/:id/rules" element={<SecurityGroupRulesPage />} />
    <Route path=":id" element={<VirtualNetworkDetailPage />} />
  </Routes>
);
