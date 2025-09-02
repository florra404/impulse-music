import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabase';
import { PlusCircle, Music, User, Disc, ArrowLeft, Book, Radio, Trash2, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

// Вспомогательная функция для "очистки" имен файлов перед загрузкой
const sanitizeFileName = (filename: string) => {
    const translitMap: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    let sanitized = filename.toLowerCase().split('').map(char => translitMap[char] || char).join('');
    return sanitized.replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
};

const AdminContainer = styled.div`
    padding: 50px;
    width: 100%;
`;

const Title = styled.h1`
    font-size: 2.5rem;
    font-weight: 900;
    margin-bottom: 40px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 30px;
`;

const FormSection = styled.form`
    background: #121212;
    padding: 30px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 1px solid #222;
`;

const SectionTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 1.5rem;
    margin-bottom: 10px;
`;

const Input = styled.input`
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #181818;
    color: white;
    font-size: 1rem;
`;

const Textarea = styled.textarea`
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #181818;
    color: white;
    font-size: 1rem;
    min-height: 100px;
    resize: vertical;
`;

const Select = styled.select`
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #181818;
    color: white;
    font-size: 1rem;
`;

const FileInputLabel = styled.label`
    width: 100%;
    display: block;
`;

const ImagePreview = styled.div`
    width: 100%;
    height: 120px;
    border-radius: 8px;
    border: 1px dashed #555;
    background-color: #181818;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: #888;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
        border-color: #facc15;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const AudioFileInput = styled.div`
    padding: 12px;
    border-radius: 8px;
    border: 1px dashed #555;
    background: #181818;
    color: #888;
    text-align: center;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover { background: #222; }
`;

const Button = styled.button`
    padding: 14px;
    border-radius: 8px;
    border: none;
    background: #facc15;
    color: #111;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BackLink = styled(Link)`
    display: flex;
    align-items: center;
    gap: 10px;
    color: #888;
    text-decoration: none;
    margin-bottom: 20px;
    width: fit-content;
    &:hover { color: white; }
`;

const RadioScheduleList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 10px;
`;

const RadioTrackItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #181818;
    padding: 10px;
    border-radius: 6px;
`;

export function AdminPage() {
    const [artists, setArtists] = useState<any[]>([]);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [allTracks, setAllTracks] = useState<any[]>([]);
    const [radioSchedule, setRadioSchedule] = useState<any[]>([]);

    const [artistName, setArtistName] = useState('');
    const [artistDesc, setArtistDesc] = useState('');
    const [artistAvatar, setArtistAvatar] = useState<File | null>(null);

    const [singleTitle, setSingleTitle] = useState('');
    const [singleArtistId, setSingleArtistId] = useState('');
    const [singleCover, setSingleCover] = useState<File | null>(null);
    const [singleFile, setSingleFile] = useState<File | null>(null);
    
    const [albumTitle, setAlbumTitle] = useState('');
    const [albumArtistId, setAlbumArtistId] = useState('');
    const [albumCover, setAlbumCover] = useState<File | null>(null);

    const [trackAlbumId, setTrackAlbumId] = useState('');
    const [trackTitle, setTrackTitle] = useState('');
    const [trackFile, setTrackFile] = useState<File | null>(null);

    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationContent, setNotificationContent] = useState('');

    const fetchData = useCallback(async () => {
        const { data: artistsData } = await supabase.from('artists').select('*');
        if (artistsData) setArtists(artistsData);
        const { data: albumsData } = await supabase.from('albums').select('*');
        if (albumsData) setAlbums(albumsData);
        const { data: tracksData } = await supabase.from('tracks').select('id, title, artists(name)');
        if (tracksData) setAllTracks(tracksData);
        const { data: scheduleData } = await supabase.from('radio_schedule').select('id, play_order, tracks(title, artists(name))').order('play_order');
        if (scheduleData) setRadioSchedule(scheduleData);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const uploadFile = async (file: File, bucket: string, path: string) => {
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };
    
    const handleAddArtist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!artistAvatar) return alert('Выберите аватар для артиста');
        setLoading(true);
        try {
            const avatarPath = `public/${Date.now()}_${sanitizeFileName(artistAvatar.name)}`;
            const avatar_url = await uploadFile(artistAvatar, 'artist-avatars', avatarPath);
            await supabase.from('artists').insert({ name: artistName, description: artistDesc, avatar_url });
            alert('Артист добавлен!');
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(`Ошибка при добавлении артиста: ${error.message}`);
        }
        setLoading(false);
    };

    const handleAddAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!albumCover) return alert('Выберите обложку для альбома');
        setLoading(true);
        try {
            const coverPath = `public/${Date.now()}_${sanitizeFileName(albumCover.name)}`;
            const cover_art_url = await uploadFile(albumCover, 'album-covers', coverPath);
            await supabase.from('albums').insert({ title: albumTitle, artist_id: albumArtistId, cover_art_url });
            alert('Альбом добавлен!');
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(`Ошибка при добавлении альбома: ${error.message}`);
        }
        setLoading(false);
    };

    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleCover || !singleFile) return alert('Выберите обложку и аудиофайл');
        setLoading(true);
        try {
            const coverPath = `public/singles/${Date.now()}_${sanitizeFileName(singleCover.name)}`;
            const cover_art_url = await uploadFile(singleCover, 'album-covers', coverPath);
            const songPath = `public/${Date.now()}_${sanitizeFileName(singleFile.name)}`;
            const song_url = await uploadFile(singleFile, 'songs', songPath);
            await supabase.from('tracks').insert({ title: singleTitle, artist_id: singleArtistId, song_url, cover_art_url });
            alert('Сингл добавлен!');
        } catch (error: any) {
            console.error(error);
            alert(`Ошибка при добавлении сингла: ${error.message}`);
        }
        setLoading(false);
    };
    
    const handleAddTrackToAlbum = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackFile) return alert('Выберите аудиофайл');
        setLoading(true);
        try {
            const songPath = `public/${Date.now()}_${sanitizeFileName(trackFile.name)}`;
            const song_url = await uploadFile(trackFile, 'songs', songPath);
            const { data: albumData } = await supabase.from('albums').select('artist_id').eq('id', trackAlbumId).single();
            if (!albumData) throw new Error('Альбом не найден');
            await supabase.from('tracks').insert({ title: trackTitle, artist_id: albumData.artist_id, album_id: trackAlbumId, song_url });
            alert('Трек добавлен в альбом!');
        } catch (error: any) {
            console.error(error);
            alert(`Ошибка при добавлении трека: ${error.message}`);
        }
        setLoading(false);
    };

    const handleAddTrackToRadio = async (trackId: string) => {
        if (!trackId) return;
        const newOrder = radioSchedule.length;
        const { error } = await supabase.from('radio_schedule').insert({ track_id: trackId, play_order: newOrder });
        if (!error) fetchData();
    };

    const handleRemoveTrackFromRadio = async (scheduleId: string) => {
        const { error } = await supabase.from('radio_schedule').delete().eq('id', scheduleId);
        if (!error) fetchData();
    };

    const handleAddNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('notifications').insert({ title: notificationTitle, content: notificationContent });
            if (error) throw error;
            alert('Новость успешно опубликована!');
            setNotificationTitle('');
            setNotificationContent('');
        } catch (error: any) {
            console.error('Ошибка при создании новости:', error);
            alert(`Ошибка: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <AdminContainer>
            <BackLink to="/"><ArrowLeft size={20}/> На главную</BackLink>
            <Title>Панель управления</Title>
            <Grid>
                <FormSection onSubmit={handleAddArtist}>
                    <SectionTitle><User/>Добавить артиста</SectionTitle>
                    <Input type="text" placeholder="Имя артиста" onChange={e => setArtistName(e.target.value)} required />
                    <Textarea placeholder="Описание артиста" onChange={e => setArtistDesc(e.target.value)} />
                    <FileInputLabel>
                        <ImagePreview>
                            {artistAvatar ? <img src={URL.createObjectURL(artistAvatar)} alt="Превью" /> : 'Выбрать фото артиста'}
                        </ImagePreview>
                        <input type="file" hidden onChange={e => e.target.files && setArtistAvatar(e.target.files[0])} accept="image/*" />
                    </FileInputLabel>
                    <Button type="submit" disabled={loading}>Добавить артиста</Button>
                </FormSection>

                <FormSection onSubmit={handleAddAlbum}>
                    <SectionTitle><Disc/>Добавить альбом</SectionTitle>
                    <Input type="text" placeholder="Название альбома" onChange={e => setAlbumTitle(e.target.value)} required />
                    <Select onChange={e => setAlbumArtistId(e.target.value)} required defaultValue="">
                        <option value="" disabled>Выберите артиста</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                    <FileInputLabel>
                         <ImagePreview>
                            {albumCover ? <img src={URL.createObjectURL(albumCover)} alt="Превью" /> : 'Выбрать обложку альбома'}
                        </ImagePreview>
                        <input type="file" hidden onChange={e => e.target.files && setAlbumCover(e.target.files[0])} accept="image/*" />
                    </FileInputLabel>
                    <Button type="submit" disabled={loading}>Добавить альбом</Button>
                </FormSection>
                
                <FormSection onSubmit={handleAddSingle}>
                    <SectionTitle><Music/>Добавить сингл</SectionTitle>
                    <Input type="text" placeholder="Название сингла" onChange={e => setSingleTitle(e.target.value)} required />
                    <Select onChange={e => setSingleArtistId(e.target.value)} required defaultValue="">
                        <option value="" disabled>Выберите артиста</option>
                        {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                    <FileInputLabel>
                        <ImagePreview>
                            {singleCover ? <img src={URL.createObjectURL(singleCover)} alt="Превью" /> : 'Выбрать обложку сингла'}
                        </ImagePreview>
                        <input type="file" hidden onChange={e => e.target.files && setSingleCover(e.target.files[0])} accept="image/*" />
                    </FileInputLabel>
                    <FileInputLabel>
                        <AudioFileInput>
                            {singleFile ? singleFile.name : 'Выбрать аудиофайл'}
                        </AudioFileInput>
                        <input type="file" hidden onChange={e => e.target.files && setSingleFile(e.target.files[0])} accept="audio/*" />
                    </FileInputLabel>
                    <Button type="submit" disabled={loading}>Добавить сингл</Button>
                </FormSection>

                <FormSection onSubmit={handleAddTrackToAlbum}>
                    <SectionTitle><Book/>Добавить трек в альбом</SectionTitle>
                    <Select onChange={e => setTrackAlbumId(e.target.value)} required defaultValue="">
                        <option value="" disabled>Выберите альбом</option>
                        {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </Select>
                    <Input type="text" placeholder="Название трека" onChange={e => setTrackTitle(e.target.value)} required />
                    <FileInputLabel>
                        <AudioFileInput>
                            {trackFile ? trackFile.name : 'Выбрать аудиофайл'}
                        </AudioFileInput>
                        <input type="file" hidden onChange={e => e.target.files && setTrackFile(e.target.files[0])} accept="audio/*" />
                    </FileInputLabel>
                    <Button type="submit" disabled={loading}>Добавить трек</Button>
                </FormSection>
                
                <FormSection as="div">
                    <SectionTitle><Radio/>Управление "Impulse Radio"</SectionTitle>
                    <div>
                        <h4>Плейлист на сегодня ({radioSchedule.length} треков):</h4>
                        <RadioScheduleList>
                            {radioSchedule.map(item => (
                                <RadioTrackItem key={item.id}>
                                    <span>{item.play_order + 1}. {item.tracks.artists.name} - {item.tracks.title}</span>
                                    <button onClick={() => handleRemoveTrackFromRadio(item.id)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer'}}><Trash2 size={16}/></button>
                                </RadioTrackItem>
                            ))}
                        </RadioScheduleList>
                    </div>
                    <div>
                        <h4>Добавить трек в эфир:</h4>
                        <Select onChange={(e) => handleAddTrackToRadio(e.target.value)} value="">
                            <option value="" disabled>Выберите трек</option>
                            {allTracks.map(track => (
                                <option key={track.id} value={track.id}>{track.artists.name} - {track.title}</option>
                            ))}
                        </Select>
                    </div>
                </FormSection>

                <FormSection onSubmit={handleAddNotification}>
                    <SectionTitle><Bell/>Создать новость</SectionTitle>
                    <Input 
                        type="text" 
                        placeholder="Заголовок новости" 
                        value={notificationTitle}
                        onChange={e => setNotificationTitle(e.target.value)} 
                        required 
                    />
                    <Textarea 
                        placeholder="Текст новости или уведомления..." 
                        value={notificationContent}
                        onChange={e => setNotificationContent(e.target.value)}
                        required
                    />
                    <Button type="submit" disabled={loading}>Опубликовать</Button>
                </FormSection>
            </Grid>
        </AdminContainer>
    );
}

