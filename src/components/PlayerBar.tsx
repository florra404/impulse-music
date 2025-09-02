import styled, { css } from 'styled-components';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Home, ShieldCheck, Search, ShoppingBag, Heart, Volume2, VolumeX, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Profile } from './Header';

// Внешняя обертка, которая всегда центрирована и не анимируется. Решает проблему со "съезжанием".
const BarWrapper = styled.div`
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    z-index: 1000;
`;

// Внутренний контейнер, который плавно анимирует свою ширину.
const AnimatedContainer = styled(motion.div)`
    height: 80px;
    background: rgba(25, 25, 30, 0.5);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
`;

const LayoutContainer = styled(motion.div)`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

// Секция для навигации в компактном режиме
const NavSection = styled(motion.div)`
    display: flex;
    gap: 40px;
    padding: 0 20px;
`;

// Сетка для плеера в расширенном режиме
const PlayerLayout = styled(motion.div)`
    width: 100%;
    display: grid;
    grid-template-columns: 250px 1fr 250px;
    align-items: center;
    gap: 20px;
    position: relative;
    padding: 0 25px;
`;

const StyledNavLink = styled(NavLink)`
    color: #888;
    transition: color 0.2s;
    &.active, &:hover { color: white; }
`;

const LeftNavWrapper = styled.div`
    justify-self: start;
    position: relative;
    z-index: 2; // Гарантирует, что навигация всегда кликабельна
`;

const Controls = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
`;

const ControlButtons = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    button {
        background: none; border: none; color: #b3b3b3; cursor: pointer;
        transition: color 0.2s;
        &:hover { color: white; }
    }
`;

const PlayButton = styled.button`
    background: white !important; color: black !important;
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s !important;
    &:hover { transform: scale(1.1); }
`;

const ProgressBarContainer = styled.div`
    display: flex; align-items: center; gap: 10px;
    width: 100%; max-width: 500px;
    color: #b3b3b3; font-size: 0.8rem;
`;

const TrackInfo = styled.div`
    display: flex; align-items: center; gap: 15px;
    justify-content: flex-end;
`;

const CoverArt = styled.img`
    width: 60px; height: 60px; border-radius: 6px;
    object-fit: cover; flex-shrink: 0;
`;

const TextInfo = styled.div`
    color: white; text-align: right;
    h4 {
        margin: 0; font-weight: 600; white-space: nowrap; 
        overflow: hidden; text-overflow: ellipsis; max-width: 150px;
    }
    p { margin: 4px 0 0; }
`;

const ArtistLink = styled(Link)`
    color: #b3b3b3; font-size: 0.8rem;
    text-decoration: none; &:hover { text-decoration: underline; }
`;

const VolumeControls = styled.div`
    display: flex; justify-content: flex-end; align-items: center;
    gap: 10px; color: #b3b3b3;
`;

const sliderStyles = css<{ progress?: number }>`
    -webkit-appearance: none; appearance: none;
    width: 100%; height: 4px; border-radius: 2px;
    outline: none;
    background: ${props => props.progress !== undefined
        ? `linear-gradient(to right, #facc15 ${props.progress}%, rgba(255, 255, 255, 0.2) ${props.progress}%)`
        : 'rgba(255, 255, 255, 0.2)'};

    &::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 14px; height: 14px; background: white;
        border-radius: 50%; cursor: pointer; transition: transform 0.2s;
    }
    &:hover::-webkit-slider-thumb { transform: scale(1.2); }
`;
const ProgressBar = styled.input<{ progress?: number }>`${sliderStyles}`;
const VolumeSlider = styled.input<{ progress?: number }>`
    ${sliderStyles}
    width: 100px;
`;

const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function PlayerBar() {
    const player = usePlayer();
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        if (!session?.user) return;
        const fetchProfile = async () => {
            const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
            if (data) setProfile(data as Profile);
        };
        fetchProfile();
    }, [session]);

    const coverUrl = player.currentTrack?.cover_art_url || player.currentTrack?.albums?.cover_art_url;
    const progressPercent = (player.progress / player.duration) * 100 || 0;
    const volumePercent = player.volume * 100;

    return (
        <BarWrapper>
            <AnimatedContainer 
                layout 
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                animate={{ width: player.currentTrack ? 'min(95vw, 1200px)' : 'auto' }}
            >
                <LayoutContainer>
                    <AnimatePresence mode="wait">
                        {player.currentTrack ? (
                            <PlayerLayout key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <LeftNavWrapper>
                                    <NavSection>
                                        <StyledNavLink to="/"><Home /></StyledNavLink>
                                        <StyledNavLink to="/search"><Search /></StyledNavLink>
                                        <StyledNavLink to="/store"><ShoppingBag /></StyledNavLink>
                                        <StyledNavLink to="/radio"><Radio /></StyledNavLink>
                                        {profile?.is_admin && <StyledNavLink to="/admin"><ShieldCheck /></StyledNavLink>}
                                    </NavSection>
                                </LeftNavWrapper>

                                <Controls>
                                    <ControlButtons>
                                        <button onClick={player.toggleLike} title="Нравится">
                                            <Heart size={18} fill={player.isCurrentTrackLiked ? '#facc15' : 'none'} stroke={player.isCurrentTrackLiked ? '#facc15' : 'currentColor'} />
                                        </button>
                                        <button onClick={player.playPrev}><SkipBack /></button>
                                        <PlayButton onClick={player.togglePlay}>
                                            {player.isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" />}
                                        </PlayButton>
                                        <button onClick={player.playNext}><SkipForward /></button>
                                    </ControlButtons>
                                    <ProgressBarContainer>
                                        <span>{formatTime(player.progress)}</span>
                                        <ProgressBar 
                                            type="range" min="0" max={player.duration || 0} value={player.progress} 
                                            onChange={(e) => player.seek(Number(e.target.value))}
                                            progress={progressPercent}
                                        />
                                        <span>{formatTime(player.duration)}</span>
                                    </ProgressBarContainer>
                                </Controls>
                                
                                <TrackInfo>
                                    <VolumeControls>
                                        <button onClick={() => player.changeVolume(player.volume > 0 ? 0 : 1)}>
                                            {player.volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                        </button>
                                        <VolumeSlider 
                                            type="range" min="0" max="1" step="0.01" value={player.volume} 
                                            onChange={(e) => player.changeVolume(Number(e.target.value))}
                                            progress={volumePercent}
                                        />
                                    </VolumeControls>
                                    <TextInfo>
                                        <h4>{player.currentTrack.title}</h4>
                                        <ArtistLink to={`/artist/${player.currentTrack.artists.id}`}>
                                            {player.currentTrack.artists.name}
                                        </ArtistLink>
                                    </TextInfo>
                                    <CoverArt src={coverUrl} />
                                </TrackInfo>
                            </PlayerLayout>
                        ) : (
                            <NavSection key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <StyledNavLink to="/"><Home /></StyledNavLink>
                                <StyledNavLink to="/search"><Search /></StyledNavLink>
                                <StyledNavLink to="/store"><ShoppingBag /></StyledNavLink>
                                <StyledNavLink to="/radio"><Radio /></StyledNavLink>
                                {profile?.is_admin && <StyledNavLink to="/admin"><ShieldCheck /></StyledNavLink>}
                            </NavSection>
                        )}
                    </AnimatePresence>
                </LayoutContainer>
            </AnimatedContainer>
        </BarWrapper>
    );
}

