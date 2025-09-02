import { useState } from 'react';
import { supabase } from '../services/supabase';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const auroraAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -100%; left: -100%;
    width: 300%; height: 300%;
    background: linear-gradient(115deg, transparent 40%, rgba(8, 2, 43, 0.5) 50%, rgba(68, 1, 40, 0.5) 70%, transparent 80%);
    animation: ${auroraAnimation} 20s ease-in-out infinite alternate;
    z-index: 0;
  }
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  z-index: 1;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const Subtitle = styled.p`
  margin-top: 8px;
  color: #b3b3b3;
`;

const Form = styled.form`
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #facc15;
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.3);
  }
`;

const Button = styled.button`
  padding: 14px;
  background: #facc15;
  color: #111;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const ToggleText = styled.p`
  margin-top: 25px;
  color: #888;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #facc15;
  font-weight: 600;
  margin-left: 8px;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) setMessage(error.message);
        else setMessage(isLogin ? 'Вход выполнен успешно!' : 'Проверьте почту для подтверждения!');
        
        setLoading(false);
    };
    
    const formVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <PageWrapper>
            <AnimatePresence mode="wait">
                <FormContainer key={isLogin ? 'login' : 'register'} variants={formVariants} initial="hidden" animate="visible" exit="exit">
                    <Title>{isLogin ? 'С возвращением' : 'Присоединяйтесь'}</Title>
                    <Subtitle>в мир Impulse</Subtitle>
                    <Form onSubmit={handleSubmit}>
                        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <Input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Button type="submit" disabled={loading}>
                            {loading ? '...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
                        </Button>
                    </Form>
                    {message && <p style={{ marginTop: '15px', color: '#ccc' }}>{message}</p>}
                    <ToggleText>
                        {isLogin ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'}
                        <ToggleButton onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'Регистрация' : 'Войти'}
                        </ToggleButton>
                    </ToggleText>
                </FormContainer>
            </AnimatePresence>
        </PageWrapper>
    );
}