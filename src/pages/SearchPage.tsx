import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mic, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import type { Track } from '../context/PlayerContext';

const PageWrapper = styled.div`
    padding: 50px;
    min-height: 100vh;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 20px 0;
    font-size: 3rem;
    font-weight: 700;
    background: transparent;
    border: none;
    border-bottom: 2px solid #333;
    color: white;
    outline: none;
    margin-bottom: 50px;
    transition: border-color 0.3s;

    &:focus {
        border-color: #facc15;
    }
`;

const ResultsContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 40px;
`;

const Section = styled(motion.section)``;

const SectionTitle = styled.h2`
    font-size: 1.5rem;
    color: #888;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ResultsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
`;

const ResultCard = styled(Link)`
    background: #181818;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    text-decoration: none;
    color: white;
    transition: background 0.2s;

    &:hover {
        background: #282828;
    }
`;

const TrackCardStyled = styled.div`
    background: #181818;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #282828;
    }
`;

const Avatar = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const Cover = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 4px;
    object-fit: cover;
`;

export function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<{ users: any[], artists: any[], tracks: Track[] }>({ users: [], artists: [], tracks: [] });
    const { playTrack } = usePlayer();

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.length < 2) {
                setResults({ users: [], artists: [], tracks: [] });
                return;
            }
            
            const [userRes, artistRes, trackRes] = await Promise.all([
                supabase.from('profiles').select('*').ilike('username', `%${searchTerm}%`).limit(5),
                supabase.from('artists').select('*').ilike('name', `%${searchTerm}%`).limit(5),
                supabase.from('tracks').select('*, artists(id, name), albums(cover_art_url)').ilike('title', `%${searchTerm}%`).limit(10)
            ]);
            
            setResults({
                users: userRes.data || [],
                artists: artistRes.data || [],
                tracks: (trackRes.data as Track[]) || []
            });
        };

        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    return (
        <PageWrapper>
            <SearchInput 
                type="text"
                placeholder="Пользователи, треки, исполнители..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <AnimatePresence>
                <ResultsContainer>
                    {results.users.length > 0 && (
                        <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <SectionTitle><User size={20}/>Пользователи</SectionTitle>
                            <ResultsGrid>
                                {results.users.map(user => (
                                    <ResultCard key={user.id} to={`/profile/${user.id}`}>
                                        <Avatar src={user.avatar_url} />
                                        <span>{user.username}</span>
                                    </ResultCard>
                                ))}
                            </ResultsGrid>
                        </Section>
                    )}
                    {results.artists.length > 0 && (
                         <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <SectionTitle><Mic size={20}/>Исполнители</SectionTitle>
                             <ResultsGrid>
                                {results.artists.map(artist => (
                                    <ResultCard key={artist.id} to={`/artist/${artist.id}`}>
                                        <Avatar src={artist.avatar_url} />
                                        <span>{artist.name}</span>
                                    </ResultCard>
                                ))}
                            </ResultsGrid>
                        </Section>
                    )}
                    {results.tracks.length > 0 && (
                         <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <SectionTitle><Music size={20}/>Треки</SectionTitle>
                             <ResultsGrid>
                                {results.tracks.map(track => (
                                    <TrackCardStyled key={track.id} onClick={() => playTrack(track, results.tracks)}>
                                        <Cover src={track.cover_art_url || track.albums?.cover_art_url} />
                                        <div>
                                            <span>{track.title}</span>
                                            <p style={{color: '#888', fontSize: '0.9em', margin: 0}}>{track.artists.name}</p>
                                        </div>
                                    </TrackCardStyled>
                                ))}
                            </ResultsGrid>
                        </Section>
                    )}
                </ResultsContainer>
            </AnimatePresence>
        </PageWrapper>
    );
}