import styled from 'styled-components';
import { Minus, Square, X } from 'lucide-react';

// ✅ ГЛАВНОЕ ПРАВИЛО: Весь контейнер можно перетаскивать
const BarWrapper = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: #121212;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 10px;
    z-index: 2000;
    -webkit-app-region: drag; // Позволяет перетаскивать окно за эту область
`;

const Title = styled.span`
    color: #888;
    font-size: 0.8rem;
    padding-left: 10px;
`;

const Controls = styled.div`
    display: flex;
    gap: 5px;
    // ✅ ВАЖНО: Кнопки должны быть исключены из области перетаскивания
    -webkit-app-region: no-drag; 
`;

const ControlButton = styled.button`
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    color: #888;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover {
        background: #333;
        color: white;
    }
`;

export function TitleBar() {
    const handleMinimize = () => window.electron.windowControls.minimize();
    const handleMaximize = () => window.electron.windowControls.maximize();
    const handleClose = () => window.electron.windowControls.close();

    return (
        <BarWrapper>
            <Title>Impulse</Title>
            <Controls>
                <ControlButton onClick={handleMinimize} title="Свернуть">
                    <Minus size={16} />
                </ControlButton>
                <ControlButton onClick={handleMaximize} title="Развернуть">
                    <Square size={14} />
                </ControlButton>
                <ControlButton onClick={handleClose} title="Закрыть" style={{'--hover-bg': '#e81123'} as any}>
                    <X size={16} />
                </ControlButton>
            </Controls>
        </BarWrapper>
    );
}
