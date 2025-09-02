import styled from 'styled-components';
import { motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../context/PlayerContext'; // ✅ ИСПРАВЛЕНИЕ: Добавили 'type'

const CardWrapper = styled(motion.div)`
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    background: #181818;
    display: flex;
    align-items: center;
    transition: background 0.2s ease;

    &:hover { background: #282828; }
`;

const CardImage = styled.img`
    width: 80px;
    height: 80px;
    object-fit: cover;
`;

const InfoWrapper = styled.div`
    padding: 15px;
    display: flex;
    flex-direction: column;
`;

const Title = styled.h4` margin: 0; color: white; font-weight: 600;`;
const Artist = styled.p` margin: 4px 0 0; color: #b3b3b3; font-size: 0.8rem;`;

export function TrackCard({ track, queue }: { track: Track, queue: Track[] }) {
    const { playTrack } = usePlayer();
    const coverUrl = track.cover_art_url || track.albums?.cover_art_url;

    return (
        <CardWrapper whileHover={{ scale: 1.03 }} onClick={() => playTrack(track, queue)}>
            <CardImage src={coverUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${track.title}`} />
            <InfoWrapper>
                <Title>{track.title}</Title>
                <Artist>{track.artists.name}</Artist>
            </InfoWrapper>
        </CardWrapper>
    );
}

