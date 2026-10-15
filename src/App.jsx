import { EmployeeProvider } from './context/EmployeeContext.jsx';
import { DirectoryWorkspace } from './components/DirectoryWorkspace.jsx';
import { DirectoryErrorBoundary } from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <DirectoryErrorBoundary>
      <EmployeeProvider>
        <DirectoryWorkspace />
      </EmployeeProvider>
    </DirectoryErrorBoundary>
  );
}
