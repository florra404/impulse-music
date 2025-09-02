import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const PanelWrapper = styled(motion.div)`
    position: fixed;
    top: 80px; // Прямо под хедером
    right: 20px;
    width: 400px;
    max-height: 500px;
    background: #181818;
    border: 1px solid #333;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: 1000;
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    padding: 20px;
    font-size: 1.2rem;
    font-weight: 700;
    border-bottom: 1px solid #333;
`;

const NotificationList = styled.div`
    overflow-y: auto;
    padding: 10px;
`;

const NotificationItem = styled.div<{ $isUnread: boolean }>`
    padding: 15px;
    border-radius: 8px;
    position: relative;
    background: ${props => props.$isUnread ? '#222' : 'transparent'};

    &::before {
        content: '';
        display: ${props => props.$isUnread ? 'block' : 'none'};
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 50%;
        background: #facc15;
        border-radius: 0 4px 4px 0;
    }
`;

const Title = styled.h4`
    margin: 0 0 5px 0;
    color: white;
`;

const Content = styled.p`
    margin: 0;
    color: #b3b3b3;
    font-size: 0.9rem;
`;

interface NotificationPanelProps {
    onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationPanelProps) {
    const { session } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [readStatus, setReadStatus] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user) return;
            
            const { data: notificationsData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            if (notificationsData) setNotifications(notificationsData);

            const { data: readStatusData } = await supabase.from('user_notifications_status').select('notification_id').eq('user_id', session.user.id);
            if (readStatusData) setReadStatus(readStatusData.map(s => s.notification_id));
        };
        fetchData();
    }, [session]);

    // Когда панель открывается, отмечаем все уведомления как прочитанные
    useEffect(() => {
        if (!session?.user || notifications.length === 0) return;

        const markAsRead = async () => {
            const unreadNotifications = notifications
                .filter(n => !readStatus.includes(n.id))
                .map(n => ({ user_id: session.user.id, notification_id: n.id, is_read: true }));

            if (unreadNotifications.length > 0) {
                await supabase.from('user_notifications_status').upsert(unreadNotifications);
            }
        };

        const timer = setTimeout(markAsRead, 1000); // Небольшая задержка
        return () => clearTimeout(timer);

    }, [notifications, readStatus, session]);

    return (
        <PanelWrapper
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <Header>Уведомления</Header>
            <NotificationList>
                {notifications.map(n => (
                    <NotificationItem key={n.id} $isUnread={!readStatus.includes(n.id)}>
                        <Title>{n.title}</Title>
                        <Content>{n.content}</Content>
                    </NotificationItem>
                ))}
            </NotificationList>
        </PanelWrapper>
    );
}
