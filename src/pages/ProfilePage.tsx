import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Crown, Edit, Heart, UserPlus, Clock, Users } from 'lucide-react';
import { ProfileModal } from '../components/ProfileModal';
import { TrackCard } from '../components/TrackCard';
import type { Track } from '../context/PlayerContext';
import type { Profile } from '../components/Header';
import { motion } from 'framer-motion';

const PageWrapper = styled.div`
    padding-bottom: 120px;
`;
const Banner = styled.div<{ $bgUrl?: string }>`
    height: 40vh;
    background-image: linear-gradient(to top, #121212 5%, transparent 50%), url(${props => props.$bgUrl || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&q=80'});
    background-size: cover;
    background-position: center;
`;
const UserInfoContainer = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 30px;
    padding: 0 50px;
    transform: translateY(-75px);
`;
const Avatar = styled.img`
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 5px solid #121212;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    object-fit: cover;
`;
const TextInfo = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
`;
const Username = styled.h1`
    font-size: 3.5rem;
    font-weight: 900;
    display: flex;
    align-items: center;
    gap: 15px;
    color: white;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
`;
const Stats = styled.div`
    display: flex;
    gap: 20px;
    color: #b3b3b3;
    margin-top: 10px;
`;
const ActionButton = styled.button`
    margin-left: auto;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    transition: background 0.2s;

    &:hover { 
        background: rgba(255,255,255,0.2); 
    }
    &:disabled { 
        background: #222; 
        color: #888; 
        cursor: not-allowed; 
    }
`;
const Content = styled.div`
    padding: 0 50px;
    margin-top: -50px;
`;
const SectionTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 20px;
`;
const TracksGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
`;

export function ProfilePage() {
    const { id: profileId } = useParams<{ id: string }>();
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [likedTracks, setLikedTracks] = useState<Track[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [friendStatus, setFriendStatus] = useState<'not_friends' | 'pending_sent' | 'pending_received' | 'accepted' | 'is_self'>('is_self');

    const isOwner = session?.user?.id === profileId;

    const fetchData = useCallback(async () => {
        if (!profileId) return;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', profileId).single();
        if (profileData) setProfile(profileData as Profile);

        const { data: likedData } = await supabase.from('liked_songs').select('tracks(*, artists(id, name), albums(cover_art_url))').eq('user_id', profileId);
        if (likedData) {
            const tracks = likedData.map(item => (item as any).tracks).filter(Boolean) as Track[];
            setLikedTracks(tracks);
        }

        if (session?.user && !isOwner) {
            const { data } = await supabase.from('friends')
                .select('status, action_user_id')
                .or(`(user_one_id.eq.${session.user.id},user_two_id.eq.${profileId}),(user_one_id.eq.${profileId},user_two_id.eq.${session.user.id})`)
                .single();

            if (data) {
                if (data.status === 'pending') {
                    setFriendStatus(data.action_user_id === session.user.id ? 'pending_sent' : 'pending_received');
                } else {
                    setFriendStatus('accepted');
                }
            } else {
                setFriendStatus('not_friends');
            }
        } else if (isOwner) {
            setFriendStatus('is_self');
        }

    }, [profileId, session, isOwner]);

    useEffect(() => {
        fetchData();
        // Подписываемся на изменения в таблице friends, чтобы обновлять статус в реальном времени
        const channel = supabase.channel(`friends-status-${profileId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData, profileId]);

    const handleFriendAction = async () => {
        if (!session?.user || !profileId || isOwner) return;

        if (friendStatus === 'not_friends') {
            const { error } = await supabase.from('friends').insert({
                user_one_id: session.user.id,
                user_two_id: profileId,
                status: 'pending',
                action_user_id: session.user.id
            });
            if (!error) {
                // ✅ ИСПРАВЛЕНИЕ: Мгновенно обновляем состояние кнопки
                setFriendStatus('pending_sent');
            }
        }
    };

    const renderFriendButton = () => {
        switch (friendStatus) {
            case 'is_self':
                return <ActionButton onClick={() => setIsModalOpen(true)}><Edit size={16}/> Редактировать</ActionButton>;
            case 'pending_sent':
                return <ActionButton disabled><Clock size={16}/> Запрос отправлен</ActionButton>;
            case 'pending_received':
                return <ActionButton style={{ background: '#facc15', color: '#111' }} onClick={() => navigate('/friends')}>Ответить на запрос</ActionButton>;
            case 'accepted':
                return <ActionButton><Users size={16}/> В друзьях</ActionButton>;
            default:
                return <ActionButton onClick={handleFriendAction}><UserPlus size={16}/> Добавить в друзья</ActionButton>;
        }
    };

    if (!profile) return <div>Загрузка профиля...</div>;
    const navigate = useNavigate();

    return (
        <>
            <PageWrapper>
                <Banner $bgUrl={profile.banner_url} />
                <UserInfoContainer>
                    <Avatar src={profile.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${profile.username}`} />
                    <TextInfo>
                        <Username>
                            {profile.username}
                            {profile.is_admin && <Crown size={30} color="#facc15" />}
                        </Username>
                        <Stats>
                            <span><Heart size={14}/> {likedTracks.length} любимых треков</span>
                        </Stats>
                    </TextInfo>
                    {renderFriendButton()}
                </UserInfoContainer>
                <Content>
                    {likedTracks.length > 0 ? (
                        <>
                            <SectionTitle>Любимые треки</SectionTitle>
                            <TracksGrid>
                                {likedTracks.map((track, index) => (
                                    <motion.div key={track.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                                        <TrackCard track={track} queue={likedTracks} />
                                    </motion.div>
                                ))}
                            </TracksGrid>
                        </>
                    ) : (
                        <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>
                            {isOwner ? 'Вы еще не лайкнули ни одного трека.' : 'Пользователь еще не добавил треки в избранное.'}
                        </p>
                    )}
                </Content>
            </PageWrapper>
            
            {isOwner && profile && (
                <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} profile={profile} onProfileUpdate={fetchData} />
            )}
        </>
    );
}

