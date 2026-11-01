import { Route, Routes } from 'react-router-dom';

import ExternalIpWizardPage from './CreatePage/ExternalIpWizardPage';
import ExternalIpDetailsPage from './ExternalIpDetailsPage';
import ExternalIpListPage from './ExternalIpListPage';

const ExternalIpRoutes = () => (
  <Routes>
    <Route index element={<ExternalIpListPage />} />
    <Route path="create" element={<ExternalIpWizardPage />} />
    <Route path=":id" element={<ExternalIpDetailsPage />} />
  </Routes>
);

export default ExternalIpRoutes;
