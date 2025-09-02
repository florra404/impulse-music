import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';

const NotificationWrapper = styled(motion.div)`
    position: fixed;
    bottom: 120px; // Располагаем над плеером
    right: 30px;
    padding: 20px;
    background: #181818;
    border: 1px solid #333;
    border-radius: 12px;
    color: white;
    display: flex;
    align-items: center;
    gap: 15px;
    z-index: 2000; // Выше всех
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;

const RestartButton = styled.button`
    background: #facc15;
    color: #111;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
`;

interface UpdateNotificationProps {
    isDownloaded: boolean;
    onRestart: () => void;
}

export function UpdateNotification({ isDownloaded, onRestart }: UpdateNotificationProps) {
    return (
        <NotificationWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            {isDownloaded ? (
                <>
                    <span>Обновление готово!</span>
                    <RestartButton onClick={onRestart}>
                        <RefreshCw size={16} />
                        Перезапустить
                    </RestartButton>
                </>
            ) : (
                <>
                    <Download size={18} />
                    <span>Найдено обновление, загрузка...</span>
                </>
            )}
        </NotificationWrapper>
    );
}
