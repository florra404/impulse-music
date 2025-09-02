import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion'; // Импортируем motion

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Регистрируем...');

        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
                setStatus(`Ошибка: ${error.message}`);
            } else {
                setStatus('Успешно! Проверьте вашу почту для подтверждения.');
            }
        } catch (error) {
            setStatus('Ошибка сети.');
        }
    };

    return (
        // Добавляем анимацию появления с помощью motion.div
        <motion.div
            initial={{ opacity: 0, y: 50 }} // Начальное состояние (невидимый, сдвинут вниз)
            animate={{ opacity: 1, y: 0 }}   // Конечное состояние (видимый, на месте)
            transition={{ duration: 0.7 }}   // Длительность анимации
            className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8"
        >
            <h1 className="text-5xl font-bold text-pink-500 mb-4">Impulse</h1>
            <p className="mb-8 text-gray-300">Создайте новый аккаунт</p>
            
            <form onSubmit={handleRegister} className="flex flex-col gap-4 w-full max-w-xs">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-b-2 border-pink-500 p-3 rounded-t-lg focus:outline-none focus:bg-gray-700 transition-colors"
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-b-2 border-pink-500 p-3 rounded-t-lg focus:outline-none focus:bg-gray-700 transition-colors"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }} // Анимация при наведении
                    whileTap={{ scale: 0.95 }}   // Анимация при клике
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 font-bold py-3 rounded-lg transition-colors mt-4"
                >
                    Зарегистрироваться
                </motion.button>
            </form>
            {status && <p className="mt-4 text-sm">{status}</p>}
        </motion.div>
    );
}