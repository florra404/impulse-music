import { useState, useRef, ChangeEvent, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile } from './Header';

const ModalOverlay = styled(motion.div)`
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
`;
const ModalContent = styled(motion.div)`
    width: 100%; max-width: 450px; padding: 30px;
    background: #181818;
    border-radius: 20px;
    border: 1px solid #222;
    display: flex; flex-direction: column; gap: 20px;
`;
const AvatarEditor = styled.div`
    position: relative; cursor: pointer;
    align-self: center;
    &:hover div { opacity: 1; }
`;
const AvatarImage = styled.img`
    width: 100px; height: 100px; border-radius: 50%;
    object-fit: cover; border: 3px solid #facc15;
`;
const AvatarOverlay = styled.div`
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    border-radius: 50%; background: rgba(0,0,0,0.5); color: white;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.3s;
`;
const Input = styled.input`
    width: 100%; padding: 12px;
    background: #121212; border: 1px solid #333;
    border-radius: 8px; color: white; font-size: 1rem;
    &:focus { outline: none; border-color: #facc15; }
`;
const SaveButton = styled.button`
    padding: 12px 30px; background-color: #facc15;
    color: #111; border: none; border-radius: 8px;
    cursor: pointer; font-weight: bold;
    &:disabled { opacity: 0.5; }
`;
const BannerPreview = styled.div<{ $bgUrl?: string }>`
    width: 100%; height: 120px; border-radius: 12px;
    background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${props => props.$bgUrl});
    background-size: cover; background-position: center;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: white; border: 1px dashed #555;
    &:hover { border-color: #facc15; }
`;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    onProfileUpdate: () => void;
}

export function ProfileModal({ isOpen, onClose, profile, onProfileUpdate }: ModalProps) {
    const { session } = useAuth();
    const [username, setUsername] = useState(profile.username);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Сбрасываем состояние при каждом открытии
    useEffect(() => {
        if(isOpen) {
            setUsername(profile.username);
            setAvatarFile(null);
            setBannerFile(null);
        }
    }, [isOpen, profile]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'avatar') setAvatarFile(e.target.files[0]);
            else setBannerFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!session?.user) return;
        setUploading(true);
        
        let avatarUrl = profile.avatar_url;
        let bannerUrl = profile.banner_url;

        try {
            if (avatarFile) {
                const filePath = `${session.user.id}/avatar_${Date.now()}`;
                const { data, error } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
                if (error) throw error;
                avatarUrl = supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
            }

            if (bannerFile) {
                const filePath = `${session.user.id}/banner_${Date.now()}`;
                const { data, error } = await supabase.storage.from('profile-banners').upload(filePath, bannerFile, { upsert: true });
                if (error) throw error;
                bannerUrl = supabase.storage.from('profile-banners').getPublicUrl(data.path).data.publicUrl;
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username, avatar_url: avatarUrl, banner_url: bannerUrl })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

        } catch (error) {
            console.error('Ошибка при обновлении профиля:', error);
        } finally {
            setUploading(false);
            onProfileUpdate();
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                    <ModalContent initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                        <h3>Редактировать профиль</h3>
                        
                        <BannerPreview 
                            $bgUrl={bannerFile ? URL.createObjectURL(bannerFile) : profile.banner_url}
                            onClick={() => bannerInputRef.current?.click()}
                        >
                            Сменить баннер
                        </BannerPreview>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} hidden accept="image/*" />
                        
                        <AvatarEditor onClick={() => avatarInputRef.current?.click()}>
                            <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url} />
                            <AvatarOverlay>Сменить</AvatarOverlay>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} hidden accept="image/*" />
                        </AvatarEditor>
                        
                        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ваш никнейм" />
                        
                        <SaveButton onClick={handleSave} disabled={uploading}>
                            {uploading ? 'Сохранение...' : 'Сохранить'}
                        </SaveButton>
                    </ModalContent>
                </ModalOverlay>
            )}
        </AnimatePresence>
    );
}

