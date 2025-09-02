import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, LogOut, Users, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ProfileModal } from './ProfileModal';
import { NotificationsPanel } from './NotificationsPanel';

// Экспортируем тип Profile, чтобы его могли использовать другие компоненты
export type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    is_admin: boolean;
    banner_url?: string;
};

const HeaderContainer = styled(motion.header)`
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px;
    background: rgba(25, 25, 40, 0.3);
    backdrop-filter: blur(15px);
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 1001; // Выше, чем у плеера
`;

const ProfileButton = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding-right: 12px;
`;

const Avatar = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.5);
`;

const Username = styled.span<{ $isAdmin: boolean }>`
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: ${props => props.$isAdmin ? '0 0 8px #facc15, 0 0 10px #facc15' : 'none'};
`;

const CrownIcon = styled(Crown)`
    color: #facc15;
    filter: drop-shadow(0 0 5px #facc15);
`;

const IconButton = styled(Link)`
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    position: relative;
    &:hover { color: white; }
`;

const NotificationButton = styled.button`
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    position: relative;
    &:hover { color: white; }
`;

const LogoutButton = styled.button`
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    &:hover { color: white; }
`;

const NotificationDot = styled(motion.div)`
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    background: #f472b6;
    border-radius: 50%;
    border: 1px solid #111;
`;

interface HeaderProps {
    profile: Profile | null;
    onProfileUpdate: () => void;
}

export function Header({ profile, onProfileUpdate }: HeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasNewRequests, setHasNewRequests] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const { session } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!session?.user) return;
        
        const checkAllNotifications = async () => {
            // Проверка заявок в друзья
            const { count: requestsCount } = await supabase
                .from('friends')
                .select('*', { count: 'exact', head: true })
                .eq('user_two_id', session.user.id)
                .eq('status', 'pending');
            setHasNewRequests(!!requestsCount && requestsCount > 0);

            // Проверка непрочитанных новостей
            const { data: notifications } = await supabase.from('notifications').select('id');
            const { data: readStatuses } = await supabase.from('user_notifications_status').select('notification_id').eq('user_id', session.user.id);
            if (notifications && readStatuses) {
                const unreadCount = notifications.length - readStatuses.length;
                setHasUnread(unreadCount > 0);
            }
        };
        
        checkAllNotifications();

        const channel = supabase.channel('realtime-all-notifications')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                // При любом изменении в базе, перепроверяем все уведомления
                checkAllNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    if (!profile) return null;

    const handleProfileClick = () => {
        if (session?.user?.id) {
            navigate(`/profile/${session.user.id}`);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    return (
        <>
            <HeaderContainer
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <LogoutButton onClick={handleLogout} title="Выйти из аккаунта">
                    <LogOut size={20} />
                </LogoutButton>

                <IconButton to="/friends" title="Друзья">
                    <Users size={20} />
                    <AnimatePresence>
                        {hasNewRequests && <NotificationDot initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />}
                    </AnimatePresence>
                </IconButton>

                <NotificationButton onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} title="Уведомления">
                    <Bell size={20} />
                    <AnimatePresence>
                        {hasUnread && <NotificationDot initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />}
                    </AnimatePresence>
                </NotificationButton>
                
                <ProfileButton onClick={handleProfileClick}>
                    <Avatar src={profile.avatar_url || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${profile.username}`} alt="Avatar" />
                    <Username $isAdmin={profile.is_admin}>
                        {profile.is_admin && <CrownIcon size={18} />}
                        {profile.username}
                    </Username>
                </ProfileButton>
            </HeaderContainer>
            
            <AnimatePresence>
                {isNotificationsOpen && <NotificationsPanel onClose={() => setIsNotificationsOpen(false)} />}
            </AnimatePresence>

            {/* Модальное окно управляется со страницы профиля, но должно быть здесь для рендера */}
            <ProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profile={profile}
                onProfileUpdate={onProfileUpdate}
            />
        </>
    );
}

