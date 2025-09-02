import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { supabase } from '../services/supabase';
import type { Track } from '../context/PlayerContext';
import { Link } from 'react-router-dom'; // ✅ Импортируем Link для навигации

const CardWrapper = styled(motion.div)`
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    aspect-ratio: 1 / 1; 
`;

const CardImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const CardOverlay = styled(motion.div)`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60%;
    background: linear-gradient(to top, rgba(0,0,0,1) 20%, transparent);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
`;

const Title = styled.h2` margin: 0; font-size: 1.8rem; font-weight: 900; color: white;`;
const Artist = styled.p` margin: 5px 0 0; color: #b3b3b3;`;

const PlayButton = styled(motion.div)`
    position: absolute;
    bottom: 25px;
    right: 25px;
    width: 60px;
    height: 60px;
    background: #facc15;
    color: #111;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(250, 204, 21, 0.5);
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    cursor: pointer; // Явно указываем, что это кликабельный элемент

    ${CardWrapper}:hover & {
        opacity: 1;
        transform: translateY(0);
    }
`;

export function AlbumCard({ album }: { album: any }) {
    const { playTrack } = usePlayer();

    const handlePlayAlbum = async (e: React.MouseEvent) => {
        // ✅ ИСПРАВЛЕНИЕ: Останавливаем "всплытие" события клика.
        // Это предотвратит срабатывание <Link> и переход на другую страницу.
        e.preventDefault();
        e.stopPropagation();

        const { data: tracks, error } = await supabase
            .from('tracks')
            .select('*, artists(id, name), albums(cover_art_url)')
            .eq('album_id', album.id);

        if (error) {
            console.error("Ошибка при загрузке треков альбома:", error);
            return;
        }
        if (tracks && tracks.length > 0) {
            playTrack(tracks[0] as Track, tracks as Track[]);
        }
    };

    return (
        // ✅ ИСПРАВЛЕНИЕ: Оборачиваем всю карточку в <Link>, который ведет на страницу альбома
        <Link to={`/album/${album.id}`} style={{ textDecoration: 'none' }}>
            <CardWrapper layoutId={`album-${album.id}`}>
                <CardImage src={album.cover_art_url} />
                <CardOverlay>
                    <Title>{album.title}</Title>
                    <Artist>{album.artists.name}</Artist>
                    {/* Кнопка Play теперь имеет свой собственный обработчик клика */}
                    <PlayButton onClick={handlePlayAlbum} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Play size={28} fill="#111" />
                    </PlayButton>
                </CardOverlay>
            </CardWrapper>
        </Link>
    );
}

