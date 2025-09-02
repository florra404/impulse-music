import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  /* Сбрасываем все отступы по умолчанию */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: #000;
    color: #fff;
    font-family: 'Poppins', sans-serif;
    overflow-x: hidden; // Запрещаем горизонтальный скролл на всей странице
  }

  /* Делаем все скроллбары красивыми и тёмными */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #111;
  }
  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;
