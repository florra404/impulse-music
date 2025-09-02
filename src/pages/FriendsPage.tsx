import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Check, X, Search } from 'lucide-react';

const PageWrapper = styled.div`
    padding: 50px;
    width: 100%;
    min-height: 100vh;
`;

const Title = styled.h1`
    font-size: 3rem;
    font-weight: 900;
    margin-bottom: 40px;
`;

const TabsContainer = styled.div`
    display: flex;
    gap: 20px;
    border-bottom: 1px solid #222;
    margin-bottom: 30px;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
    background: none;
    border: none;
    color: ${props => props.$isActive ? 'white' : '#888'};
    font-size: 1.2rem;
    padding: 15px 0;
    cursor: pointer;
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #facc15;
        transform: ${props => props.$isActive ? 'scaleX(1)' : 'scaleX(0)'};
        transition: transform 0.3s ease;
    }
`;

const SearchInputWrapper = styled.div`
    position: relative;
    margin-bottom: 30px;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 15px 20px 15px 50px;
    background: #181818;
    border: 1px solid #333;
    border-radius: 8px;
    color: white;
    font-size: 1.1rem;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
        border-color: #facc15;
    }
`;

const FriendList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
`;

const FriendCard = styled(motion.div)`
    background: #181818;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const UserInfo = styled(Link)`
    display: flex;
    align-items: center;
    gap: 15px;
    text-decoration: none;
    color: white;
`;

const Avatar = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 10px;
`;

const IconButton = styled.button`
    background: #282828;
    border: none;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #383838; }
`;


export function FriendsPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        if (!session?.user) return;
        
        const { data, error } = await supabase
            .from('friends')
            .select('*, user_one:profiles!user_one_id(*), user_two:profiles!user_two_id(*)')
            .or(`user_one_id.eq.${session.user.id},user_two_id.eq.${session.user.id}`);
        
        if (error) { console.error("Ошибка загрузки друзей:", error); return; }

        const acceptedFriends = data
            .filter(f => f.status === 'accepted')
            .map(f => f.user_one_id === session.user.id ? f.user_two : f.user_one);
            
        const pendingRequests = data
            .filter(f => f.status === 'pending' && f.action_user_id !== session.user.id);

        setFriends(acceptedFriends);
        setRequests(pendingRequests);

    }, [session]);

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('friends-page-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchData]);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.length < 2 || !session?.user) {
                setSearchResults([]);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${searchTerm}%`)
                .neq('id', session.user.id)
                .limit(10);

            if (data) setSearchResults(data);
        };

        const debounce = setTimeout(handleSearch, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, session]);

    const handleAcceptRequest = async (request: any) => {
        if (!session?.user) return;
        const { error } = await supabase
            .from('friends')
            .update({ status: 'accepted', action_user_id: session.user.id })
            .match({ user_one_id: request.user_one_id, user_two_id: request.user_two_id });
        if (!error) fetchData(); // Обновляем списки после действия
    };

    const handleDeclineRequest = async (request: any) => {
        const { error } = await supabase
            .from('friends')
            .delete()
            .match({ user_one_id: request.user_one_id, user_two_id: request.user_two_id });
        if (!error) fetchData(); // Обновляем списки после действия
    };

    const renderContent = () => {
        const listVariants = {
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
        };
        const itemVariants = {
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 },
        };

        switch (activeTab) {
            case 'requests':
                return requests.map(req => (
                    <FriendCard key={req.user_one_id} variants={itemVariants}>
                        <UserInfo to={`/profile/${req.user_one.id}`}>
                            <Avatar src={req.user_one.avatar_url} />
                            <span>{req.user_one.username}</span>
                        </UserInfo>
                        <ActionButtons>
                            <IconButton onClick={() => handleAcceptRequest(req)} title="Принять"><Check color="#2dd4bf"/></IconButton>
                            <IconButton onClick={() => handleDeclineRequest(req)} title="Отклонить"><X color="#f472b6"/></IconButton>
                        </ActionButtons>
                    </FriendCard>
                ));
            case 'add':
                return searchResults.map(user => (
                    <FriendCard key={user.id} variants={itemVariants}>
                         <UserInfo to={`/profile/${user.id}`}>
                            <Avatar src={user.avatar_url} />
                            <span>{user.username}</span>
                        </UserInfo>
                        {/* Кнопка "Добавить" находится на странице профиля пользователя */}
                    </FriendCard>
                ));
            default: // friends
                return friends.map(friend => (
                    <FriendCard key={friend.id} variants={itemVariants}>
                        <UserInfo to={`/profile/${friend.id}`}>
                            <Avatar src={friend.avatar_url} />
                            <span>{friend.username}</span>
                        </UserInfo>
                    </FriendCard>
                ));
        }
    };

    return (
        <PageWrapper>
            <Title>Друзья</Title>
            <TabsContainer>
                <TabButton $isActive={activeTab === 'friends'} onClick={() => setActiveTab('friends')}>Мои друзья ({friends.length})</TabButton>
                <TabButton $isActive={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>Заявки ({requests.length})</TabButton>
                <TabButton $isActive={activeTab === 'add'} onClick={() => setActiveTab('add')}>Найти друзей</TabButton>
            </TabsContainer>

            {activeTab === 'add' && (
                <SearchInputWrapper>
                    <Search size={20} style={{position: 'absolute', top: '16px', left: '18px', color: '#888'}}/>
                    <SearchInput 
                        type="text" 
                        placeholder="Введите имя пользователя..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </SearchInputWrapper>
            )}

            <FriendList as={motion.div} variants={{ visible: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible">
                <AnimatePresence>
                    {renderContent()}
                </AnimatePresence>
            </FriendList>
        </PageWrapper>
    );
}

