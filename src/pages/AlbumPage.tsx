import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { TrackCard } from '../components/TrackCard';
import type { Track } from '../context/PlayerContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PageWrapper = styled(motion.div)`
    width: 100%;
    min-height: 100vh;
    padding-bottom: 120px; // Место для плеера
`;

const Banner = styled.div<{ $bgUrl?: string }>`
    height: 40vh;
    padding: 50px;
    display: flex;
    align-items: flex-end;
    gap: 30px;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url(${props => props.$bgUrl || ''});
        background-size: cover;
        background-position: center;
        filter: blur(20px) brightness(0.3);
        transform: scale(1.1);
        z-index: -1;
    }
`;

const AlbumCover = styled.img`
    width: 200px;
    height: 200px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    flex-shrink: 0;
`;

const AlbumInfo = styled.div`
    display: flex;
    flex-direction: column;
    color: white;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
`;

const AlbumTitle = styled.h1`
    font-size: 4rem;
    font-weight: 900;
    margin: 0;
`;

const ArtistLink = styled(Link)`
    font-size: 1.5rem;
    color: #b3b3b3;
    text-decoration: none;
    margin-top: 10px;
    &:hover {
        text-decoration: underline;
    }
`;

const ContentContainer = styled.div`
    padding: 30px 50px;
`;

const TracksGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
`;

export function AlbumPage() {
    const { id } = useParams<{ id: string }>();
    const [album, setAlbum] = useState<any>(null);
    const [tracks, setTracks] = useState<Track[]>([]);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            // Загружаем данные альбома и его треки параллельно
            const [albumRes, tracksRes] = await Promise.all([
                supabase.from('albums').select('*, artists(id, name)').eq('id', id).single(),
                supabase.from('tracks').select('*, artists(id, name), albums(id, cover_art_url)').eq('album_id', id)
            ]);
            
            if (albumRes.data) setAlbum(albumRes.data);
            if (tracksRes.data) setTracks(tracksRes.data as Track[]);
        };
        fetchData();
    }, [id]);

    if (!album) return <div style={{textAlign: 'center', padding: '50px'}}>Загрузка альбома...</div>;

    return (
        <PageWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Banner $bgUrl={album.cover_art_url}>
                <AlbumCover src={album.cover_art_url} />
                <AlbumInfo>
                    <p style={{ textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 'bold' }}>Альбом</p>
                    <AlbumTitle>{album.title}</AlbumTitle>
                    <ArtistLink to={`/artist/${album.artists.id}`}>
                        {album.artists.name}
                    </ArtistLink>
                </AlbumInfo>
            </Banner>
            <ContentContainer>
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
            </ContentContainer>
        </PageWrapper>
    );
}

