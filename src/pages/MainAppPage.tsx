import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';

// Импортируем все необходимые компоненты для главной страницы
import { AlbumCard } from '../components/AlbumCard';
import { TrackCard } from '../components/TrackCard';
import { ArtistCard } from '../components/ArtistCard';
import { Footer } from '../components/Footer';
import type { Track } from '../context/PlayerContext';

const PageWrapper = styled(motion.div)`
    width: 100%;
    min-height: 100vh;
    background-color: #000;
    color: white;
`;

const ContentContainer = styled.div`
    padding: 0 50px;
`;

const SectionTitle = styled.h2`
    font-size: 2.2rem;
    font-weight: 900;
    margin: 50px 0 30px 0;
    padding-left: 15px;
`;

// Базовый контейнер-слайдер для горизонтальной прокрутки
const SliderContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 240px; // Фиксированная ширина для карточек треков и артистов
    gap: 25px;
    overflow-x: auto;
    padding: 20px 50px; 
    margin: 0 -50px; // Выходим за пределы основного контейнера для эффекта "до края"
    scroll-snap-type: x mandatory;

    & > * {
        scroll-snap-align: start;
    }
`;

// Специализированный слайдер для альбомов с более крупными карточками
const AlbumSliderContainer = styled(SliderContainer)`
    grid-auto-columns: 350px; // Фиксированная и увеличенная ширина для карточек альбомов
`;

export function MainAppPage() {
    const [albums, setAlbums] = useState<any[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            // Загружаем альбомы, обязательно включая ID и имя артиста
            const { data: albumData } = await supabase.from('albums').select('*, artists(id, name)');
            if (albumData) setAlbums(albumData);
            
            // Загружаем синглы (треки без альбома), обязательно включая ID и имя артиста
            const { data: trackData } = await supabase.from('tracks').select('*, artists(id, name), albums(cover_art_url)').is('album_id', null);
            if (trackData) setTracks(trackData as Track[]);
            
            // Загружаем артистов
            const { data: artistData } = await supabase.from('artists').select('id, name, avatar_url');
            if (artistData) setArtists(artistData);
        };
        fetchData();
    }, []);

    return (
        <AnimatePresence>
            <PageWrapper
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ContentContainer>
                    {albums.length > 0 && (
                        <motion.section>
                            <SectionTitle>Новые Альбомы</SectionTitle>
                            <AlbumSliderContainer>
                                {albums.map((album, index) => (
                                     <motion.div key={album.id} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: index * 0.1}}>
                                        <AlbumCard album={album} />
                                    </motion.div>
                                ))}
                            </AlbumSliderContainer>
                        </motion.section>
                    )}

                    {tracks.length > 0 && (
                         <motion.section>
                            <SectionTitle>Последние Синглы</SectionTitle>
                             <SliderContainer>
                                {tracks.map((track, index) => (
                                    <motion.div key={track.id} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: index * 0.1}}>
                                        <TrackCard track={track} queue={tracks} />
                                    </motion.div>
                                ))}
                            </SliderContainer>
                        </motion.section>
                    )}
                    
                    {artists.length > 0 && (
                         <motion.section>
                            <SectionTitle>Исполнители</SectionTitle>
                            <SliderContainer>
                                {artists.map((artist, index) => (
                                     <motion.div key={artist.id} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} transition={{delay: index * 0.1}}>
                                        <ArtistCard artist={artist} />
                                    </motion.div>
                                ))}
                            </SliderContainer>
                        </motion.section>
                    )}
                </ContentContainer>
                
                <Footer />
            </PageWrapper>
        </AnimatePresence>
    );
}

