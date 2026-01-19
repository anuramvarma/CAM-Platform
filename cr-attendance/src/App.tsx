import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { SetupWizard } from './components/SetupWizard';

import { Login } from './components/Login';

// Pages
import { Home } from './pages/Home';
import { Subjects } from './pages/Subjects';
import { Students } from './pages/Students';
import { Permissions } from './pages/Permissions';
import { History } from './pages/History';
import { MarkAttendance } from './pages/MarkAttendance';
import { Help } from './pages/Help';

import { PendingApproval } from './components/PendingApproval';
import { Misc } from './pages/Misc';

const AppRoutes = () => {
    const { settings, isAuthenticated } = useApp();

    if (!isAuthenticated) {
        return <Login />;
    }

    if (!settings.isSetupComplete) {
        return <SetupWizard />;
    }

    if (settings.isApproved === false) { // Explicitly check false, undefined might mean legacy/dev
        return <PendingApproval />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/students" element={<Students />} />
                <Route path="/permissions" element={<Permissions />} />
                <Route path="/history" element={<History />} />
                <Route path="/mark" element={<MarkAttendance />} />
                <Route path="/help" element={<Help />} />
                <Route path="/misc" element={<Misc />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
};

function App() {
    return (
        <AppProvider>
            <ThemeProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </ToastProvider>
            </ThemeProvider>
        </AppProvider>
    );
}


export default App;
