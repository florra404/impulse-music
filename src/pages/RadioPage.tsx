import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { supabase } from '../services/supabase';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../context/PlayerContext';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';

const PageWrapper = styled.div`
    padding: 50px;
    min-height: 100vh;
    text-align: center;
`;

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(250, 204, 21, 0); }
  100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
`;

const Title = styled.h1`
    font-size: 3.5rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
`;

const LiveIndicator = styled(Radio)`
    color: #facc15;
    animation: ${pulseAnimation} 2s infinite;
    border-radius: 50%;
`;

const CurrentTrackDisplay = styled(motion.div)`
    margin: 40px auto;
    max-width: 500px;
    background: #121212;
    border: 1px solid #222;
    border-radius: 15px;
    padding: 30px;
    cursor: pointer;
`;

const CurrentCoverArt = styled.img`
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 20px;
`;

const ScheduleContainer = styled.div`
    margin-top: 50px;
    text-align: left;
`;

const ScheduleList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 800px;
    margin: 20px auto 0 auto;
`;

const ScheduleItem = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    background: #181818;
    border-radius: 8px;
`;

export function RadioPage() {
    const [schedule, setSchedule] = useState<Track[]>([]);
    const { playTrack } = usePlayer();

    useEffect(() => {
        const fetchSchedule = async () => {
            const { data } = await supabase.from('radio_schedule')
                .select('tracks(*, artists(id, name), albums(cover_art_url))')
                .order('play_order');
            
            if (data) {
                const tracks = data.map(item => (item as any).tracks) as Track[];
                setSchedule(tracks);
            }
        };
        fetchSchedule();
    }, []);

    const handlePlayRadio = () => {
        if (schedule.length > 0) {
            playTrack(schedule[0], schedule);
        }
    };

    const currentTrack = schedule[0]; // Упрощенно: всегда показываем первый трек как "текущий"

    return (
        <PageWrapper>
            <Title><LiveIndicator size={40}/> Impulse Radio</Title>
            <p style={{ color: '#b3b3b3' }}>Общий бит для всех. Прямо сейчас в эфире.</p>

            {currentTrack && (
                <CurrentTrackDisplay onClick={handlePlayRadio} whileHover={{ scale: 1.05 }}>
                    <CurrentCoverArt src={currentTrack.cover_art_url || currentTrack.albums?.cover_art_url} />
                    <h2 style={{ fontSize: '1.8rem' }}>{currentTrack.title}</h2>
                    <p style={{ color: '#b3b3b3', fontSize: '1.2rem' }}>{currentTrack.artists.name}</p>
                </CurrentTrackDisplay>
            )}

            <ScheduleContainer>
                <h3>Далее в эфире:</h3>
                <ScheduleList>
                    {schedule.slice(1).map((track, index) => (
                        <ScheduleItem key={track.id}>
                            <span>{index + 2}.</span>
                            <img src={track.cover_art_url || track.albums?.cover_art_url} width="40" height="40" style={{ borderRadius: '4px' }}/>
                            <div>
                                <div>{track.title}</div>
                                <div style={{ color: '#888', fontSize: '0.9em' }}>{track.artists.name}</div>
                            </div>
                        </ScheduleItem>
                    ))}
                </ScheduleList>
            </ScheduleContainer>
        </PageWrapper>
    );
}

