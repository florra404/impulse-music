import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

// Тип, описывающий, как выглядит объект трека в приложении. Экспортируется для использования в других компонентах.
export type Track = {
    id: string;
    title: string;
    song_url: string;
    cover_art_url?: string;
    artists: { id: string; name: string };
    albums?: { id: string; cover_art_url: string };
};

// Интерфейс, описывающий все данные и функции, которые будет предоставлять наш контекст плеера
interface PlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    playQueue: Track[];
    playTrack: (track: Track, queue?: Track[]) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    progress: number;
    duration: number;
    seek: (time: number) => void;
    volume: number;
    changeVolume: (volume: number) => void;
    isCurrentTrackLiked: boolean;
    toggleLike: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
    const { session } = useAuth();
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playQueue, setPlayQueue] = useState<Track[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [likedSongs, setLikedSongs] = useState<string[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Загружаем лайкнутые треки пользователя при входе в систему
    useEffect(() => {
        if (!session?.user) return;
        const fetchLikes = async () => {
            const { data } = await supabase.from('liked_songs').select('track_id').eq('user_id', session.user.id);
            if (data) setLikedSongs(data.map(item => item.track_id));
        };
        fetchLikes();
    }, [session]);

    // Обновляем громкость HTML5 плеера, когда меняется состояние громкости
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Управляем воспроизведением/паузой HTML5 плеера
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Ошибка воспроизведения аудио:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrack]);

    // Основная функция для запуска трека
    const playTrack = (track: Track, queue: Track[] = []) => {
        setCurrentTrack(track);
        setPlayQueue(queue.length > 0 ? queue : [track]);
        const trackIndex = queue.findIndex(t => t.id === track.id);
        setCurrentQueueIndex(trackIndex !== -1 ? trackIndex : 0);
        
        // Сбрасываем прогресс и длительность для нового трека
        setProgress(0);
        setDuration(0);
        
        setIsPlaying(true);
    };

    // Переключить play/pause
    const togglePlay = () => { if (currentTrack) setIsPlaying(!isPlaying); };

    // Следующий трек
    const playNext = () => {
        if (playQueue.length > 0) {
            const nextIndex = (currentQueueIndex + 1) % playQueue.length;
            setCurrentQueueIndex(nextIndex);
            setCurrentTrack(playQueue[nextIndex]);
            setIsPlaying(true);
        }
    };

    // Предыдущий трек
    const playPrev = () => {
        if (playQueue.length > 0) {
            const prevIndex = (currentQueueIndex - 1 + playQueue.length) % playQueue.length;
            setCurrentQueueIndex(prevIndex);
            setCurrentTrack(playQueue[prevIndex]);
            setIsPlaying(true);
        }
    };
    
    // Перемотка трека
    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };
    
    // Изменение громкости
    const changeVolume = (newVolume: number) => {
        setVolume(Math.max(0, Math.min(1, newVolume)));
    };

    // Проверяем, лайкнут ли текущий трек
    const isCurrentTrackLiked = currentTrack ? likedSongs.includes(currentTrack.id) : false;

    // Поставить/убрать лайк
    const toggleLike = async () => {
        if (!currentTrack || !session?.user) return;
        if (isCurrentTrackLiked) {
            await supabase.from('liked_songs').delete().match({ user_id: session.user.id, track_id: currentTrack.id });
            setLikedSongs(prev => prev.filter(id => id !== currentTrack.id));
        } else {
            await supabase.from('liked_songs').insert({ user_id: session.user.id, track_id: currentTrack.id });
            setLikedSongs(prev => [...prev, currentTrack.id]);
        }
    };

    // Обработчики событий HTML5 плеера
    const handleTimeUpdate = () => { if (audioRef.current) setProgress(audioRef.current.currentTime); };
    const handleLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const handleEnded = () => { playNext(); };

    return (
        <PlayerContext.Provider value={{ 
            currentTrack, isPlaying, playQueue, playTrack, togglePlay, playNext, playPrev, 
            progress, duration, seek, volume, changeVolume, isCurrentTrackLiked, toggleLike
        }}>
            {children}
            <audio
                // ✅ ИСПРАВЛЕНИЕ: Этот `key` заставляет React полностью пересоздавать
                // HTML-элемент <audio> при каждой смене трека. Это решает все проблемы
                // с неправильным отображением длительности и неработающим слайдером.
                key={currentTrack?.id} 
                ref={audioRef}
                src={currentTrack?.song_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
        </PlayerContext.Provider>
    );
}

// Кастомный хук для удобного доступа к контексту плеера из любого компонента
export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};

