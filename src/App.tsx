import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { supabase } from './services/supabase';
import { AnimatePresence } from 'framer-motion';

// Импорт глобальных и layout-компонентов
import { GlobalStyle } from './styles/GlobalStyle';
import { Header } from './components/Header';
import type { Profile } from './components/Header';
import { PlayerBar } from './components/PlayerBar';
import { TitleBar } from './components/TitleBar';
import { UpdateNotification } from './components/UpdateNotification';

// Импорт всех страниц приложения
import { AuthPage } from './pages/AuthPage';
import { MainAppPage } from './pages/MainAppPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { ArtistPage } from './pages/ArtistPage';
import { AlbumPage } from './pages/AlbumPage';
import { StorePage } from './pages/StorePage';
import { SearchPage } from './pages/SearchPage';
import { RadioPage } from './pages/RadioPage';
import { FriendsPage } from './pages/FriendsPage';

// Основной контейнер для контента, который учитывает высоту
// кастомной панели управления окном и хедера.
const AppContainer = styled.div`
  padding-top: calc(32px + 80px); // 32px (TitleBar) + 80px (Header)
  padding-bottom: 120px; // Место для плеера
`;

// Компонент, содержащий основную логику отображения
function AppContent() {
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);

    useEffect(() => {
        // ✅ ИСПРАВЛЕНИЕ: Добавляем проверку на существование window.electron
        // Это делает код надежным и предотвращает ошибки, если preload скрипт не загрузился
        if (window.electron?.ipcRenderer) {
            const removeUpdateAvailableListener = window.electron.ipcRenderer.on('update_available', () => setUpdateAvailable(true));
            const removeUpdateDownloadedListener = window.electron.ipcRenderer.on('update_downloaded', () => setUpdateDownloaded(true));
            
            // Отписываемся от слушателей при размонтировании компонента
            return () => {
                if(removeUpdateAvailableListener) removeUpdateAvailableListener();
                if(removeUpdateDownloadedListener) removeUpdateDownloadedListener();
            };
        }
    }, []);
    
    // Функция для отправки команды на перезапуск в Electron
    const restartApp = () => {
        if (window.electron?.ipcRenderer) {
            window.electron.ipcRenderer.send('restart_app', null);
        }
    };

    // Загрузка профиля текущего пользователя
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

    // Если пользователь не авторизован, показываем только TitleBar и страницу входа
    if (!session) {
        return (
            <>
                <TitleBar />
                <Routes>
                    <Route path="*" element={<AuthPage />} />
                </Routes>
            </>
        );
    }

    // Основной интерфейс для авторизованного пользователя
    return (
        <>
            <TitleBar />
            <Header profile={profile} onProfileUpdate={fetchProfile} />
            <AppContainer>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><MainAppPage /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/artist/:id" element={<ProtectedRoute><ArtistPage /></ProtectedRoute>} />
                    <Route path="/album/:id" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                    <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
                    <Route path="/radio" element={<ProtectedRoute><RadioPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                    <Route path="/auth" element={<Navigate to="/" replace />} />
                </Routes>
            </AppContainer>
            <PlayerBar />
            <AnimatePresence>
                {(updateAvailable || updateDownloaded) && (
                    <UpdateNotification isDownloaded={updateDownloaded} onRestart={restartApp} />
                )}
            </AnimatePresence>
        </>
    );
}

// Главный компонент, оборачивающий всё в провайдеры
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

// Компонент для защиты роутов от неавторизованных пользователей
function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { session } = useAuth();
    if (!session) return <Navigate to="/auth" replace />;
    return children;
}

// Компонент для защиты роутов только для администраторов
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