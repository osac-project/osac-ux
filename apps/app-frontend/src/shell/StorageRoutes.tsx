import { Navigate, Route, Routes } from 'react-router-dom';

import StorageTierCreatePage from '@osac/ui-components/components/Storage/StorageTierCreatePage';
import { StorageBackendCreatePage } from '@osac/ui-components/pages/admin/StorageBackendCreatePage';
import { StorageBackendDetailsPage } from '@osac/ui-components/pages/admin/StorageBackendDetailsPage';
import { StorageManagementPage } from '@osac/ui-components/pages/admin/StorageManagementPage';
import { StorageTierDetailsPage } from '@osac/ui-components/pages/admin/StorageTierDetailsPage';
import AdminVolumesListPage from '@osac/ui-components/pages/admin/AdminVolumesListPage';
import AdminVolumeDetailsPage from '@osac/ui-components/pages/admin/AdminVolumeDetailsPage';

export const StorageRoutes = () => {
  return (
    <Routes>
      <Route index element={<StorageManagementPage />} />
      {/* Legacy tab URLs — redirect to the unified page */}
      <Route path="backends" element={<Navigate to="/admin/infrastructure/storage" replace />} />
      <Route path="tiers" element={<Navigate to="/admin/infrastructure/storage" replace />} />
      <Route path="backends/create" element={<StorageBackendCreatePage />} />
      <Route path="backends/:id" element={<StorageBackendDetailsPage />} />
      <Route path="backends/:id/edit" element={<StorageBackendCreatePage />} />
      <Route path="tiers/create" element={<StorageTierCreatePage />} />
      <Route path="tiers/:id" element={<StorageTierDetailsPage />} />
      <Route path="tiers/:id/edit" element={<StorageTierCreatePage />} />
      <Route path="volumes" element={<AdminVolumesListPage />} />
      <Route path="volumes/:id" element={<AdminVolumeDetailsPage />} />
    </Routes>
  );
};
