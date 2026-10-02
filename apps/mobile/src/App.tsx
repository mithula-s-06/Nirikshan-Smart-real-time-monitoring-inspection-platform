import React from 'react';
import { UserRole, InspectionStatus } from '@nirikshan/shared-types';
import { useInspectionStore } from './store/inspectionStore';
import { InspectorDashboardScreen } from './screens/InspectorDashboardScreen';
import { InspectionWorkflowScreen } from './screens/InspectionWorkflowScreen';

export function App() {
  return {
    appName: 'NIRIKSHAN Inspector Mobile App',
    version: '1.0.0',
    supportedRoles: [UserRole.INSPECTOR, UserRole.DISTRICT_AUTHORITY],
    inspectionStatusSupported: Object.values(InspectionStatus),
    screens: {
      dashboard: InspectorDashboardScreen,
      workflow: InspectionWorkflowScreen,
    },
    useInspectionStore,
  };
}

export default App;
