import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { TrackCard } from './TrackCard'; // Импортируем новую карточку

// Описываем типы для наших данных
export type Artist = { name: string };
export type Album = { title: string; cover_art_url: string };
export type Track = {
    id: string;
    title: string;
    duration: number;
    artists: Artist;
    albums: Album;
};

// Стили
const SectionTitle = styled.h2`
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 20px;
`;

const TrackGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 25px;
`;

export function TrackList() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTracks = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tracks')
                .select('*, artists(name), albums(title, cover_art_url)');

            if (error) console.error('Error fetching tracks:', error);
            else if (data) setTracks(data as Track[]);
            setLoading(false);
        };

        fetchTracks();
    }, []);

    if (loading) return <p>Загрузка треков...</p>;

    return (
        <div>
            <SectionTitle>Новые релизы</SectionTitle>
            <TrackGrid>
                {tracks.map(track => (
                    <TrackCard key={track.id} track={track} />
                ))}
            </TrackGrid>
        </div>
    );
}
