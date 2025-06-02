// static/script.js
document.addEventListener('DOMContentLoaded', function() {
    
    // ---- Lógica do Menu e Autenticação agora está em authManager.js ----

    // Preencher o ano atual no footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Animação para os cards de profissionais (se existirem na página)
    function animateProfessionalCards() {
        const professionalCards = document.querySelectorAll('.professional-card');
        professionalCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)'; // Ajuste sutil
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // Carregar Atendentes em Destaque
    const featuredContainer = document.getElementById('featuredProfessionalsContainer');
    if (featuredContainer) {
        fetch('/api/atendentes/destaque?limite=3') // Exemplo de endpoint, você precisará criá-lo
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) return { atendentes: [] }; // Trata 404 como lista vazia
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                featuredContainer.innerHTML = ''; // Limpa o "Carregando..."
                if (data.atendentes && data.atendentes.length > 0) {
                    data.atendentes.forEach(atendente => {
                        const card = document.createElement('div');
                        card.className = 'professional-card';
                        // A média de avaliações virá de `vw_atendentes_aprovados`
                        const mediaAvaliacoes = atendente.media_avaliacoes ? parseFloat(atendente.media_avaliacoes).toFixed(1) : 'N/A';
                        const areaAtuacaoNome = traduzirAreaAtuacao(atendente.area_atuacao);

                        // Criar iniciais para o avatar
                        const nomes = atendente.nome_completo.split(' ');
                        const iniciais = nomes.length > 1 
                            ? (nomes[0][0] + nomes[nomes.length-1][0]).toUpperCase()
                            : nomes[0].substring(0, 2).toUpperCase();
                        
                        card.innerHTML = `
                            <div class="professional-icon">${iniciais}</div>
                            <h3>${atendente.nome_social || atendente.nome_completo}</h3>
                            <p class="professional-area">${areaAtuacaoNome}</p>
                            <div class="rating">★ ${mediaAvaliacoes} (${atendente.total_avaliacoes || 0} avaliações)</div>
                            <p style="font-size: 0.9em; color: #555; margin-bottom: 15px; min-height: 40px;">
                                ${atendente.qualificacao_descricao.substring(0, 70)}${atendente.qualificacao_descricao.length > 70 ? '...' : ''}
                            </p>
                            <button class="view-profile" data-id="${atendente.id_usuario}">Ver Perfil</button>
                        `;
                        featuredContainer.appendChild(card);
                    });
                    addProfileButtonListeners();
                    animateProfessionalCards(); // Aplica animação após carregar
                } else {
                    featuredContainer.innerHTML = '<p>Nenhum atendente em destaque no momento.</p>';
                }
            })
            .catch(error => {
                console.error('Erro ao carregar atendentes em destaque:', error);
                featuredContainer.innerHTML = '<p>Não foi possível carregar os atendentes. Tente novamente mais tarde.</p>';
            });
    }

    function traduzirAreaAtuacao(area) {
        const areas = {
            'SAUDE': 'Saúde',
            'JURIDICO': 'Jurídico',
            'CARREIRA': 'Carreira',
            'CONTABIL': 'Contábil',
            'ASSISTENCIA_SOCIAL': 'Assistência Social'
        };
        return areas[area] || area;
    }

    // Funcionalidade para os botões "Ver Perfil"
    function addProfileButtonListeners() {
        const viewProfileButtons = document.querySelectorAll('.view-profile');
        viewProfileButtons.forEach(button => {
            button.addEventListener('click', function() {
                const professionalId = this.getAttribute('data-id');
                viewProfessionalProfile(professionalId);
            });
        });
    }
    
    // Botão CTA "Encontre Apoio e Agende"
    const ctaAgendarButton = document.getElementById('ctaAgendarButton');
    if (ctaAgendarButton) {
        ctaAgendarButton.addEventListener('click', function() {
            window.location.href = '/static/agendamento/agendamento.html';
        });
    }

    // Botão "Ver todos os Atendentes"
    const viewAllButton = document.getElementById('viewAllProfessionalsButton');
    if (viewAllButton) {
        viewAllButton.addEventListener('click', function() {
             // Você precisará criar uma página de listagem/busca de todos os atendentes
            window.location.href = '/static/agendamento/agendamento.html';
        });
    }

    // Links nas Áreas de Apoio para levar à página de agendamento com filtro
    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach(item => {
        item.style.cursor = 'pointer'; // Indica que é clicável
        item.addEventListener('click', function() {
            const area = this.getAttribute('data-area');
            window.location.href = `/static/agendamento/agendamento.html?area=${area}`;
        });
    });

    // Efeito de scroll suave (removido pois `active-section` não estava definido no CSS e pode causar problemas se não bem implementado)
    // Se quiser, pode reimplementar com cuidado.
});

function viewProfessionalProfile(professionalId) {
    mostrarPerfilAtendente(professionalId);
}