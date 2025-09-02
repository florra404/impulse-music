import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { AlbumCard } from '../components/AlbumCard';
import { TrackCard } from '../components/TrackCard';
import type { Track } from '../context/PlayerContext';
import { motion } from 'framer-motion';

const PageWrapper = styled.div`
    width: 100%;
    min-height: 100vh;
    padding-bottom: 120px; // Место для плеера
`;

const Banner = styled.div<{ $bgUrl?: string }>`
    height: 50vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20px;

    // Псевдо-элемент для создания красивого размытого фона из аватара артиста
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url(${props => props.$bgUrl || ''});
        background-size: cover;
        background-position: center;
        filter: blur(20px) brightness(0.4);
        transform: scale(1.1);
        z-index: -1;
    }
`;

const ArtistName = styled.h1`
    font-size: 6rem;
    font-weight: 900;
    color: white;
    text-shadow: 0 5px 20px rgba(0,0,0,0.5);
`;

const ContentContainer = styled.div`
    padding: 30px 50px;
`;

const SectionTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    margin: 40px 0 20px 0;
    border-bottom: 1px solid #222;
    padding-bottom: 10px;
`;

const SliderContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    gap: 25px;
    overflow-x: auto;
    padding: 20px 0;
    scroll-snap-type: x mandatory;
    & > * {
        scroll-snap-align: start;
    }
`;

const AlbumSliderContainer = styled(SliderContainer)`
    grid-auto-columns: 350px;
`;

const TracksGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
`;

export function ArtistPage() {
    const { id } = useParams<{ id: string }>();
    const [artist, setArtist] = useState<any>(null);
    const [albums, setAlbums] = useState<any[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            const [artistRes, albumsRes, tracksRes] = await Promise.all([
                supabase.from('artists').select('*').eq('id', id).single(),
                supabase.from('albums').select('*, artists(id, name)').eq('artist_id', id),
                supabase.from('tracks').select('*, artists(id, name), albums(cover_art_url)').eq('artist_id', id)
            ]);
            
            if (artistRes.data) setArtist(artistRes.data);
            if (albumsRes.data) setAlbums(albumsRes.data);
            if (tracksRes.data) setTracks(tracksRes.data as Track[]);
        };
        fetchData();
    }, [id]);

    if (!artist) return <div style={{textAlign: 'center', padding: '50px'}}>Загрузка данных об исполнителе...</div>;

    return (
        <PageWrapper>
            <Banner $bgUrl={artist.avatar_url}>
                <ArtistName>{artist.name}</ArtistName>
            </Banner>
            <ContentContainer>
                {artist.description && (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}}>
                        <SectionTitle>Об исполнителе</SectionTitle>
                        <p style={{ color: '#b3b3b3', lineHeight: 1.7, maxWidth: '800px' }}>{artist.description}</p>
                    </motion.section>
                )}

                {albums.length > 0 && (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.2}}>
                        <SectionTitle>Альбомы</SectionTitle>
                        <AlbumSliderContainer>
                            {albums.map(album => <AlbumCard key={album.id} album={album} />)}
                        </AlbumSliderContainer> {/* ✅ Вот он, исправленный закрывающий тег */}
                    </motion.section>
                )}
                
                {tracks.length > 0 && (
                    <motion.section initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.4}}>
                        <SectionTitle>Треки</SectionTitle>
                        <TracksGrid>
                            {tracks.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <TrackCard track={track} queue={tracks} />
                                </motion.div>
                            ))}
                        </TracksGrid>
                    </motion.section>
                )}
            </ContentContainer>
        </PageWrapper>
    );
}

