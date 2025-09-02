import styled from 'styled-components';

const FooterContainer = styled.footer`
    width: 100%;
    padding: 50px;
    margin-top: 50px;
    background: #0A0A0A;
    border-top: 1px solid #222;
    text-align: center;
`;

const Title = styled.h2`
    color: #888;
    font-size: 1.5rem;
    margin-bottom: 30px;
`;

const CreatorsGrid = styled.div`
    display: flex;
    justify-content: center;
    gap: 40px;
`;

const CreatorCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
`;

const Avatar = styled.img`
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #facc15;
`;

const Name = styled.h4`margin: 0; color: white;`;
const Role = styled.p`margin: 0; color: #facc15;`;

export function Footer() {
    return (
        <FooterContainer>
            <Title>Команда проекта</Title>
            <CreatorsGrid>
                <CreatorCard>
                    <Avatar src="https://media.discordapp.net/attachments/1349679155406569585/1410396535170007143/f102cf0272013cc8e3ff0a4235af28c8.jpg?ex=68b6cc61&is=68b57ae1&hm=dcaadfb75bb5ae64752f908443b51e4fd852f2e85eedf269a326dae60fd0112a&=&format=webp" />
                    <Name>flora</Name>
                    <Role>Тех. Админ</Role>
                </CreatorCard>
                <CreatorCard>
                    <Avatar src="https://media.discordapp.net/attachments/1349679155406569585/1410396625402069103/cfc02f388b7943a5c9c58859734e3b27.jpg?ex=68b6cc77&is=68b57af7&hm=b916ceec5bc25a7cc78297ab70cf21c413e000b8fd6f63540c96cc37e3f4d8d1&=&format=webp&width=960&height=960" />
                    <Name>Am1go</Name>
                    <Role>Бета-тестер</Role>
                </CreatorCard>
            </CreatorsGrid>
        </FooterContainer>
    );
}
