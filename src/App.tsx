import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { supabase } from './services/supabase';
import { Header } from './components/Header';
import type { Profile } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { GlobalStyle } from './styles/GlobalStyle';

// Импорт всех страниц
import { AuthPage } from './pages/AuthPage';
import { MainAppPage } from './pages/MainAppPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { ArtistPage } from './pages/ArtistPage';
import { StorePage } from './pages/StorePage';
import { SearchPage } from './pages/SearchPage';
import { RadioPage } from './pages/RadioPage';
import { AlbumPage } from './pages/AlbumPage';
import { FriendsPage } from './pages/FriendsPage';

// --- Основной макет приложения ---
const AppContainer = styled.div`
  // Отступы, чтобы контент не залезал под Header и PlayerBar
  padding-top: 80px; 
  padding-bottom: 120px;
`;

function AppContent() {
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);

    // Функция для загрузки профиля текущего пользователя
    const fetchProfile = async () => {
        if (!session?.user) {
            setProfile(null);
            return;
        }
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
            setProfile(data as Profile);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session]);

    // Если пользователь не авторизован, показываем только страницу входа
    if (!session) {
        return (
             <Routes>
                <Route path="*" element={<AuthPage />} />
            </Routes>
        );
    }

    // Основной интерфейс для авторизованного пользователя
    return (
        <>
            <Header profile={profile} onProfileUpdate={fetchProfile} />
            <AppContainer>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><MainAppPage /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/artist/:id" element={<ProtectedRoute><ArtistPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="/auth" element={<Navigate to="/" replace />} />
                    <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                    <Route path="/radio" element={<ProtectedRoute><RadioPage /></ProtectedRoute>} />
                    <Route path="/album/:id" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                </Routes>
            </AppContainer>
            <PlayerBar />
        </>
    );
}

// --- Главный компонент приложения ---
function App() {
    return (
        <HashRouter>
            <GlobalStyle />
            <AuthProvider>
                <PlayerProvider>
                    <AppContent />
                </PlayerProvider>
            </AuthProvider>
        </HashRouter>
    );
}

// --- Компоненты для защиты роутов ---
function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { session } = useAuth();
    if (!session) return <Navigate to="/auth" replace />;
    return children;
}

function AdminRoute({ children }: { children: JSX.Element }) {
    const { session } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!session?.user) { 
            setLoading(false); 
            return; 
        }
        const checkAdminStatus = async () => {
            const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
            if (data?.is_admin) {
                setIsAdmin(true);
            }
            setLoading(false);
        };
        checkAdminStatus();
    }, [session]);

    if (loading) return <div>Проверка доступа...</div>;
    if (!isAdmin) return <Navigate to="/" replace />;
    return children;
}

export default App;

