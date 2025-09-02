import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CardWrapper = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    padding: 20px;
    border-radius: 12px;
    transition: background 0.2s ease;

    &:hover {
        background: #181818;
    }
`;

const Avatar = styled.img`
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 20px rgba(0,0,0,0.7);
`;

const Name = styled.h4`
    margin: 0;
    color: white;
    font-weight: 600;
`;

export function ArtistCard({ artist }: { artist: any }) {
    return (
        // ✅ Оборачиваем всё в Link для перехода
        <Link to={`/artist/${artist.id}`} style={{ textDecoration: 'none' }}>
            <CardWrapper>
                <Avatar src={artist.avatar_url || `https://api.dicebear.com/8.x/bottts/svg?seed=${artist.name}`} />
                <Name>{artist.name}</Name>
            </CardWrapper>
        </Link>
    );
}

