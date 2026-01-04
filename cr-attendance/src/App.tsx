import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
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

const AppRoutes = () => {
    const { settings, isAuthenticated } = useApp();

    if (!isAuthenticated) {
        return <Login />;
    }

    if (!settings.isSetupComplete) {
        return <SetupWizard />;
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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
};

function App() {
    return (
        <AppProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </ThemeProvider>
        </AppProvider>
    );
}


export default App;
