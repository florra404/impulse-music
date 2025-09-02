import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AuthContextType = {
    session: Session | null;
};

const AuthContext = createContext<AuthContextType>({ session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        // Сразу получаем текущую сессию
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Слушаем изменения состояния аутентификации (вход, выход)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Отписываемся от слушателя при размонтировании компонента
        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session }}>
            {children}
        </AuthContext.Provider>
    );
}

// Кастомный хук для легкого доступа к контексту
export const useAuth = () => {
    return useContext(AuthContext);
};