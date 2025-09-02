import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';

const PageWrapper = styled.div`
    padding: 50px;
    background: #0A0A0A;
`;
const Title = styled.h1`
    font-size: 3.5rem;
    font-weight: 900;
    text-align: center;
    margin-bottom: 50px;
    background: -webkit-linear-gradient(45deg, #facc15, #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;
const ItemsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 30px;
`;

const ItemCard = styled(motion.div)`
    background: #121212;
    border: 1px solid #222;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
`;
const ItemImage = styled.img`
    width: 100%;
    height: 180px;
    object-fit: cover;
`;
const ItemInfo = styled.div`
    padding: 25px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
`;
const ItemName = styled.h3`
    font-size: 1.5rem;
    font-weight: 700;
`;
const ItemDesc = styled.p`
    color: #b3b3b3;
    margin-top: 10px;
    flex-grow: 1;
`;
const GetButton = styled.button`
    margin-top: 20px;
    padding: 12px;
    width: 100%;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s;

    &:disabled {
        background: #333;
        color: #888;
        cursor: not-allowed;
    }
    
    &:not(:disabled) {
        background: #facc15;
        color: #111;
    }

    &:not(:disabled):hover {
        transform: scale(1.05);
    }
`;

export function StorePage() {
    const { session } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [inventory, setInventory] = useState<string[]>([]);

    const fetchData = async () => {
        const { data: itemsData } = await supabase.from('store_items').select('*');
        if (itemsData) setItems(itemsData);

        if (session?.user) {
            const { data: inventoryData } = await supabase.from('user_inventory').select('item_id').eq('user_id', session.user.id);
            if (inventoryData) setInventory(inventoryData.map(i => i.item_id));
        }
    };

    useEffect(() => {
        fetchData();
    }, [session]);

    const handleGetItem = async (itemId: string) => {
        if (!session?.user) return;
        await supabase.from('user_inventory').insert({ user_id: session.user.id, item_id: itemId });
        fetchData();
    };

    return (
        <PageWrapper>
            <Title>Хранилище Impulse</Title>
            <ItemsGrid>
                {items.map((item, index) => {
                    const isOwned = inventory.includes(item.id);
                    return (
                        <ItemCard 
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ItemImage src={item.image_url} />
                            <ItemInfo>
                                <ItemName>{item.name}</ItemName>
                                <ItemDesc>{item.description}</ItemDesc>
                                <GetButton onClick={() => handleGetItem(item.id)} disabled={isOwned}>
                                    {isOwned ? <><CheckCircle size={18}/> В инвентаре</> : <><Lock size={18}/> Получить бесплатно</>}
                                </GetButton>
                            </ItemInfo>
                        </ItemCard>
                    );
                })}
            </ItemsGrid>
        </PageWrapper>
    );
}

