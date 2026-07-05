import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Page } from '@patternfly/react-core';

import { BareMetalDetailsPage } from '@osac/ui-components/components/Baremetal/BareMetalDetailsPage';
import ErrorBoundary from '@osac/ui-components/components/ErrorBoundary/ErrorBoundary';
import { MaaSDetailsPage } from '@osac/ui-components/components/maas/MaaSDetailsPage';
import { useSession } from '@osac/ui-components/hooks/use-session';
import { AdminDashboardPage } from '@osac/ui-components/pages/admin/AdminDashboardPage';
import { AdminIdentityProviderEditPage } from '@osac/ui-components/pages/admin/AdminIdentityProviderEditPage';
import { AdminIdentityProviderNewPage } from '@osac/ui-components/pages/admin/AdminIdentityProviderNewPage';
import { AdminIdentityProvidersPage } from '@osac/ui-components/pages/admin/AdminIdentityProvidersPage';
import { AdminRoleBindingAssignPage } from '@osac/ui-components/pages/admin/AdminRoleBindingAssignPage';
import { AdminRoleBindingEditPage } from '@osac/ui-components/pages/admin/AdminRoleBindingEditPage';
import { AdminRoleBindingsPage } from '@osac/ui-components/pages/admin/AdminRoleBindingsPage';
import { AdminUserNewPage } from '@osac/ui-components/pages/admin/AdminUserNewPage';
import { AdminUsersPage } from '@osac/ui-components/pages/admin/AdminUsersPage';
import { ApiDiffPage } from '@osac/ui-components/pages/dev/ApiDiffPage';
import { ProviderAdminDashboardPage } from '@osac/ui-components/pages/provider/ProviderAdminDashboardPage';
import { ProviderAiSetupPage } from '@osac/ui-components/pages/provider/ProviderAiSetupPage';
import { ProviderCatalogItemEditPage } from '@osac/ui-components/pages/provider/ProviderCatalogItemEditPage';
import { ProviderCatalogItemNewPage } from '@osac/ui-components/pages/provider/ProviderCatalogItemNewPage';
import { ProviderCatalogStudioPage } from '@osac/ui-components/pages/provider/ProviderCatalogStudioPage';
import { ProviderHostTypeNewPage } from '@osac/ui-components/pages/provider/ProviderHostTypeNewPage';
import { ProviderHostTypesPage } from '@osac/ui-components/pages/provider/ProviderHostTypesPage';
import { ProviderInstanceTypeNewPage } from '@osac/ui-components/pages/provider/ProviderInstanceTypeNewPage';
import { ProviderInstanceTypesPage } from '@osac/ui-components/pages/provider/ProviderInstanceTypesPage';
import { ProviderIPPoolDetailPage } from '@osac/ui-components/pages/provider/ProviderIPPoolDetailPage';
import { ProviderIPPoolNewPage } from '@osac/ui-components/pages/provider/ProviderIPPoolNewPage';
import { ProviderIPPoolsPage } from '@osac/ui-components/pages/provider/ProviderIPPoolsPage';
import { ProviderNetworkClassesPage } from '@osac/ui-components/pages/provider/ProviderNetworkClassesPage';
import { ProviderNetworkClassNewPage } from '@osac/ui-components/pages/provider/ProviderNetworkClassNewPage';
import { ProviderStorageBackendFormPage } from '@osac/ui-components/pages/provider/ProviderStorageBackendFormPage';
import { ProviderStorageBackendsPage } from '@osac/ui-components/pages/provider/ProviderStorageBackendsPage';
import { ProviderStorageTierFormPage } from '@osac/ui-components/pages/provider/ProviderStorageTierFormPage';
import { ProviderStorageTiersPage } from '@osac/ui-components/pages/provider/ProviderStorageTiersPage';
import { ProviderTemplatesPage } from '@osac/ui-components/pages/provider/ProviderTemplatesPage';
import { ProviderTenantEditPage } from '@osac/ui-components/pages/provider/ProviderTenantEditPage';
import { ProviderTenantNewPage } from '@osac/ui-components/pages/provider/ProviderTenantNewPage';
import { ProviderTenantOrgsPage } from '@osac/ui-components/pages/provider/ProviderTenantOrgsPage';
import { ProviderVmTemplateFormPage } from '@osac/ui-components/pages/provider/ProviderVmTemplateFormPage';
import { BareMetalCreatePage } from '@osac/ui-components/pages/tenant/BareMetalCreatePage';
import { BareMetalListPage } from '@osac/ui-components/pages/tenant/BareMetalListPage';
import { BlockVolumeNewPage } from '@osac/ui-components/pages/tenant/BlockVolumeNewPage';
import { BlockVolumesPage } from '@osac/ui-components/pages/tenant/BlockVolumesPage';
import { CatalogPage } from '@osac/ui-components/pages/tenant/CatalogPage';
import { ClusterCreatePage } from '@osac/ui-components/pages/tenant/ClusterCreatePage';
import { ClusterRoutes } from '@osac/ui-components/pages/tenant/ClusterRoutes';
import { LoadBalancerFormPage } from '@osac/ui-components/pages/tenant/LoadBalancerFormPage';
import { LoadBalancersPage } from '@osac/ui-components/pages/tenant/LoadBalancersPage';
import { MaaSCreatePage } from '@osac/ui-components/pages/tenant/MaaSCreatePage';
import { MaaSListPage } from '@osac/ui-components/pages/tenant/MaaSListPage';
import { NetworkRoutes } from '@osac/ui-components/pages/tenant/NetworkRoutes';
import { ObjectStorageDetailPage } from '@osac/ui-components/pages/tenant/ObjectStorageDetailPage';
import { ObjectStorageEditPage } from '@osac/ui-components/pages/tenant/ObjectStorageEditPage';
import { ObjectStorageNewPage } from '@osac/ui-components/pages/tenant/ObjectStorageNewPage';
import { ObjectStoragePage } from '@osac/ui-components/pages/tenant/ObjectStoragePage';
import { ProjectCreatePage } from '@osac/ui-components/pages/tenant/ProjectCreatePage';
import { ProjectDetailPage } from '@osac/ui-components/pages/tenant/ProjectDetailPage';
import { ProjectsListPage } from '@osac/ui-components/pages/tenant/ProjectsListPage';
import { SnapshotsPage } from '@osac/ui-components/pages/tenant/SnapshotsPage';
import { StorageTiersPage } from '@osac/ui-components/pages/tenant/StorageTiersPage';
import { TenantPublicIPsPage } from '@osac/ui-components/pages/tenant/TenantPublicIPsPage';
import { VmCreatePage } from '@osac/ui-components/pages/tenant/VmCreatePage';
import { VmDetailsPage } from '@osac/ui-components/pages/tenant/VmDetailsPage';
import { VmListPage } from '@osac/ui-components/pages/tenant/VmListPage';
import type { DemoShellRole } from '@osac/ui-components/shellTypes';

import { ShellMasthead } from './ShellMasthead';
import { defaultRouteForRole } from './shellRoutes';
import { ShellSidebar } from './ShellSidebar';

const RoleRoute = ({
  allow,
  fallback,
  children,
}: {
  allow: DemoShellRole[];
  fallback: string;
  children: ReactElement;
}) => {
  const { role } = useSession();
  return allow.includes(role) ? (
    <ErrorBoundary>{children}</ErrorBoundary>
  ) : (
    <Navigate to={fallback} replace />
  );
};

export const AppShell = ({ logout }: { logout: () => Promise<void> }) => {
  const { role } = useSession();

  const defaultRoute = defaultRouteForRole(role);

  return (
    <Page
      masthead={<ShellMasthead onLogout={logout} />}
      sidebar={<ShellSidebar />}
      isManagedSidebar
    >
      <Routes>
        <Route
          path="/vms"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/vms/create/:catalogItemId?"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/vms/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <VmDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <CatalogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/catalog"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <CatalogPage isAdminMode />
            </RoleRoute>
          }
        />
        <Route
          path="/clusters/*"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ClusterRoutes />
            </RoleRoute>
          }
        />
        <Route
          path="/networks/*"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <NetworkRoutes />
            </RoleRoute>
          }
        />
        <Route
          path="/bare-metal"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <BareMetalListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/bare-metal/create/:catalogItemId?"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <BareMetalCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/bare-metal/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <BareMetalDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/bucket-storage"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ObjectStoragePage />
            </RoleRoute>
          }
        />
        <Route
          path="/bucket-storage/new"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ObjectStorageNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/bucket-storage/:id/edit"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ObjectStorageEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="/bucket-storage/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ObjectStorageDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/storage/volumes"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <BlockVolumesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/storage/volumes/new"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <BlockVolumeNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/storage/snapshots"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <SnapshotsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/storage/tiers"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <StorageTiersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ProjectsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ProjectCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ProjectDetailPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users/new"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminUserNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/identity-providers"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminIdentityProvidersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/identity-providers/new"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminIdentityProviderNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/identity-providers/:id/edit"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminIdentityProviderEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/role-bindings"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminRoleBindingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/role-bindings/assign"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminRoleBindingAssignPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/role-bindings/:id"
          element={
            <RoleRoute allow={['tenantAdmin']} fallback={defaultRoute}>
              <AdminRoleBindingEditPage />
            </RoleRoute>
          }
        />

        <Route
          path="/provider/dashboard"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderAdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/organizations"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderTenantOrgsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/organizations/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderTenantNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/organizations/:id/edit"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderTenantEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <CatalogPage isProviderGlobal />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderCatalogItemNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog/:id/edit"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderCatalogItemEditPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog-studio"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderCatalogStudioPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/catalog-studio/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderCatalogItemNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/templates"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderTemplatesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/templates/vm/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderVmTemplateFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/templates/vm/:id/edit"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderVmTemplateFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/ai-setup"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderAiSetupPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/network-classes"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderNetworkClassesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/network-classes/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderNetworkClassNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/ip-pools"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderIPPoolsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/ip-pools/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderIPPoolNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/ip-pools/:poolType/:id"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderIPPoolDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-backends"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageBackendsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-backends/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageBackendFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-backends/:id/edit"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageBackendFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-tiers"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageTiersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-tiers/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageTierFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/storage-tiers/:id/edit"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderStorageTierFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/host-types"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderHostTypesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/host-types/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderHostTypeNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/instance-types"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderInstanceTypesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/provider/instance-types/new"
          element={
            <RoleRoute allow={['providerAdmin']} fallback={defaultRoute}>
              <ProviderInstanceTypeNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/clusters/create/:catalogItemId?"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <ClusterCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/models"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <MaaSListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/models/create/:catalogItemId?"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <MaaSCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/models/:id"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <MaaSDetailsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/load-balancers"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <LoadBalancersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/load-balancers/new"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <LoadBalancerFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/load-balancers/:id/edit"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <LoadBalancerFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/ips"
          element={
            <RoleRoute allow={['tenantUser', 'tenantAdmin']} fallback={defaultRoute}>
              <TenantPublicIPsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/dev/api-diff"
          element={
            <RoleRoute
              allow={['tenantUser', 'tenantAdmin', 'providerAdmin']}
              fallback={defaultRoute}
            >
              <ApiDiffPage />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Page>
  );
};
