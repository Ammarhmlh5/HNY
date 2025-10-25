import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import ApiariesList from './pages/Apiaries/ApiariesList';
import ApiaryDetail from './pages/Apiaries/ApiaryDetail';
import CreateApiary from './pages/Apiaries/CreateApiary';
import HivesList from './pages/Hives/HivesList';
import HiveDetail from './pages/Hives/HiveDetail';
import CreateHive from './pages/Hives/CreateHive';
import InspectionsList from './pages/Inspections/InspectionsList';
import CreateInspection from './pages/Inspections/CreateInspection';
import InspectionDetail from './pages/Inspections/InspectionDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';

// Hooks
import { useAuth } from './hooks/useAuth';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="App">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={
                            <PublicRoute>
                                <AuthLayout>
                                    <Login />
                                </AuthLayout>
                            </PublicRoute>
                        } />

                        <Route path="/register" element={
                            <PublicRoute>
                                <AuthLayout>
                                    <Register />
                                </AuthLayout>
                            </PublicRoute>
                        } />

                        {/* Protected Routes */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            {/* Dashboard */}
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />

                            {/* Apiaries */}
                            <Route path="apiaries" element={<ApiariesList />} />
                            <Route path="apiaries/create" element={<CreateApiary />} />
                            <Route path="apiaries/:apiaryId" element={<ApiaryDetail />} />

                            {/* Hives */}
                            <Route path="hives" element={<HivesList />} />
                            <Route path="hives/create" element={<CreateHive />} />
                            <Route path="hives/:hiveId" element={<HiveDetail />} />
                            <Route path="apiaries/:apiaryId/hives/create" element={<CreateHive />} />

                            {/* Inspections */}
                            <Route path="inspections" element={<InspectionsList />} />
                            <Route path="inspections/create" element={<CreateInspection />} />
                            <Route path="inspections/:inspectionId" element={<InspectionDetail />} />
                            <Route path="hives/:hiveId/inspections/create" element={<CreateInspection />} />

                            {/* Profile */}
                            <Route path="profile" element={<Profile />} />
                        </Route>

                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>

                    {/* Toast notifications */}
                    <Toaster
                        position="top-center"
                        reverseOrder={false}
                        gutter={8}
                        containerClassName=""
                        containerStyle={{}}
                        toastOptions={{
                            // Define default options
                            className: '',
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                                fontFamily: 'Tajawal, Arial, sans-serif',
                                direction: 'rtl',
                            },
                            // Default options for specific types
                            success: {
                                duration: 3000,
                                theme: {
                                    primary: 'green',
                                    secondary: 'black',
                                },
                            },
                            error: {
                                duration: 5000,
                                theme: {
                                    primary: 'red',
                                    secondary: 'black',
                                },
                            },
                        }}
                    />
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;