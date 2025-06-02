// static/cliente/meus-agendamentos-script.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const clienteId = localStorage.getItem('amadoUserId');

    if (!token || !clienteId) {
        window.location.href = '/static/login/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    const currentYearSpan = document.getElementById('currentYearFooterAgendamentos');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const fetchConfig = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'} };

    const listaFuturosUl = document.getElementById('lista-agendamentos-futuros');
    const listaPassadosUl = document.getElementById('lista-agendamentos-passados');
    
    const avaliacaoModal = document.getElementById('avaliacao-modal');
    const avaliacaoModalClose = document.getElementById('avaliacao-modal-close');
    const avaliacaoForm = document.getElementById('avaliacao-form');
    const avaliacaoAtendenteNomeSpan = document.getElementById('avaliacao-atendente-nome');
    const avaliacaoDataAgendamentoSpan = document.getElementById('avaliacao-data-agendamento');
    const avaliacaoAgendamentoIdInput = document.getElementById('avaliacao-agendamento-id');
    const avaliacaoAtendenteIdInput = document.getElementById('avaliacao-atendente-id');
    const notaAvaliacaoInput = document.getElementById('nota-avaliacao');
    const starsContainer = document.querySelector('#avaliacao-form .stars-input');

    // Função para formatar datas considerando o fuso horário
    function formatarDataHora(dataISOString) {
        if (!dataISOString) return 'Data não disponível';
        
        try {
            // Criar uma data a partir da string ISO
            const data = new Date(dataISOString);
            
            // Formatar a data no padrão brasileiro
            const dataFormatada = data.toLocaleDateString('pt-BR');
            
            // Extrair as horas e minutos diretamente da string ISO
            // O formato esperado é: "2023-11-30T11:00:00" ou similar
            const horaMinuto = dataISOString.split('T')[1].substring(0, 5);
            
            return `${dataFormatada} às ${horaMinuto}`;
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return String(dataISOString);
        }
    }

    // Lógica das Abas
    const tabLinks = document.querySelectorAll('.panel-tabs .tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            document.querySelector(this.dataset.tabTarget).classList.add('active');
        });
    });


    function traduzirStatusAgendamento(status) {
        const mapa = {
            'SOLICITADO': 'Solicitado', 'CONFIRMADO': 'Confirmado', 'REALIZADO': 'Realizado',
            'CANCELADO_CLIENTE': 'Cancelado por Você', 'CANCELADO_ATENDENTE': 'Cancelado pelo Atendente',
            'NAO_COMPARECEU_CLIENTE': 'Você Não Compareceu', 'NAO_COMPARECEU_ATENDENTE': 'Atendente Não Compareceu'
        };
        return mapa[status] || status;
    }
    function traduzirArea(area) {
        const areas = { 'SAUDE': 'Saúde', 'JURIDICO': 'Jurídico', 'CARREIRA': 'Carreira', 'CONTABIL': 'Contábil', 'ASSISTENCIA_SOCIAL': 'Assistência Social' };
        return areas[area] || area || 'N/A';
    }


    async function carregarAgendamentos() {
        try {
            listaFuturosUl.innerHTML = '<p class="loading-message">Carregando...</p>';
            listaPassadosUl.innerHTML = '<p class="loading-message">Carregando...</p>';

            // Usar a rota genérica de agendamentos em vez da rota específica de clientes
            const response = await fetch('/api/agendamentos', fetchConfig);
            if (!response.ok) throw new Error('Falha ao carregar agendamentos.');
            const data = await response.json();
            
            console.log('Dados recebidos:', data); // Log para debug
            
            renderAgendamentos(data.agendamentos_futuros || [], listaFuturosUl, true);
            renderAgendamentos(data.agendamentos_passados || [], listaPassadosUl, false);

        } catch (error) {
            console.error("Erro:", error);
            listaFuturosUl.innerHTML = '<p class="error-message">Não foi possível carregar os agendamentos.</p>';
            listaPassadosUl.innerHTML = '<p class="error-message">Não foi possível carregar o histórico.</p>';
        }
    }

    function renderAgendamentos(agendamentos, ulElement, isFuturo) {
        ulElement.innerHTML = '';
        if (agendamentos.length === 0) {
            ulElement.innerHTML = `<p class="no-items-message">Nenhum agendamento ${isFuturo ? 'futuro' : 'passado'} encontrado.</p>`;
            return;
        }

        agendamentos.forEach(ag => {
            const li = document.createElement('li');
            li.className = 'agendamento-item';

            li.innerHTML = `
                <div class="agendamento-info">
                    <h4>${traduzirArea(ag.area_atendente)} com ${ag.nome_atendente}</h4>
                    <p><strong>Data:</strong> ${formatarDataHora(ag.data_hora_inicio)}</p>
                    <p><strong>Duração:</strong> ${ag.duracao_minutos} min</p>
                    <p><strong>Modalidade:</strong> ${ag.modalidade}</p>
                    ${ag.assunto_solicitacao ? `<p><strong>Assunto:</strong> ${ag.assunto_solicitacao}</p>` : ''}
                    ${ag.link_atendimento_online && ag.status_agendamento === 'CONFIRMADO' && isFuturo ? `<p><strong>Link:</strong> <a href="${ag.link_atendimento_online}" target="_blank" rel="noopener noreferrer">Acessar Atendimento</a></p>` : ''}
                </div>
                <div class="agendamento-status status-${ag.status_agendamento}">${traduzirStatusAgendamento(ag.status_agendamento)}</div>
                <div class="agendamento-actions">
                    ${isFuturo && (ag.status_agendamento === 'SOLICITADO' || ag.status_agendamento === 'CONFIRMADO') ? 
                        `<button class="action-button cancelar-button" data-id="${ag.id_agendamento}">Cancelar</button>` : ''}
                    ${!isFuturo && ag.status_agendamento === 'REALIZADO' && !ag.avaliacao_existente ? 
                        `<button class="action-button avaliar-button" data-id="${ag.id_agendamento}" data-atendente-id="${ag.id_atendente}" data-atendente-nome="${ag.nome_atendente}" data-ag-data="${formatarDataHora(ag.data_hora_inicio)}">Avaliar</button>` : ''}
                     ${!isFuturo && ag.status_agendamento === 'REALIZADO' && ag.avaliacao_existente ?
                        `<p style="font-size:0.85em; color:green; text-align:right; margin-top:5px;"><i class="fas fa-check-circle"></i> Avaliado</p>` : ''}
                </div>
            `;
            ulElement.appendChild(li);
        });

        // Add event listeners for new buttons
        ulElement.querySelectorAll('.cancelar-button').forEach(btn => {
            btn.addEventListener('click', () => handleCancelarAgendamento(btn.dataset.id));
        });
        ulElement.querySelectorAll('.avaliar-button').forEach(btn => {
            btn.addEventListener('click', () => abrirModalAvaliacao(btn.dataset));
        });
    }

    async function handleCancelarAgendamento(agendamentoId) {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            const response = await fetch(`/api/agendamentos/${agendamentoId}/cancelar/cliente`, {
                method: 'POST', // Ou PUT
                ...fetchConfig
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao cancelar.');
            
            alert(data.message || 'Agendamento cancelado com sucesso.');
            carregarAgendamentos(); // Recarrega
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
    
    // Lógica do Modal de Avaliação
    let currentRating = 0;
    starsContainer.querySelectorAll('i').forEach(star => {
        star.addEventListener('mouseover', function() {
            resetStars();
            const rating = parseInt(this.dataset.value);
            highlightStars(rating);
        });
        star.addEventListener('mouseout', function() {
            resetStars();
            if (currentRating > 0) highlightStars(currentRating);
        });
        star.addEventListener('click', function() {
            currentRating = parseInt(this.dataset.value);
            notaAvaliacaoInput.value = currentRating;
            highlightStars(currentRating);
        });
    });

    function resetStars() {
        starsContainer.querySelectorAll('i').forEach(s => {
            s.classList.remove('fas', 'selected'); // Remove preenchida e selecionada
            s.classList.add('far'); // Volta para vazia
        });
    }
    function highlightStars(rating) {
        for (let i = 1; i <= rating; i++) {
            const star = starsContainer.querySelector(`i[data-value="${i}"]`);
            if (star) {
                star.classList.remove('far');
                star.classList.add('fas', 'selected');
            }
        }
    }
    
    function abrirModalAvaliacao(dataset) {
        avaliacaoAgendamentoIdInput.value = dataset.id;
        avaliacaoAtendenteIdInput.value = dataset.atendenteId;
        avaliacaoAtendenteNomeSpan.textContent = dataset.atendenteNome;
        avaliacaoDataAgendamentoSpan.textContent = dataset.agData;
        
        currentRating = 0; // Reset
        notaAvaliacaoInput.value = '';
        resetStars();
        document.getElementById('comentario-avaliacao').value = '';
        document.getElementById('avaliacao-anonima').checked = false;
        
        avaliacaoModal.style.display = 'block';
    }
    
    avaliacaoModalClose.addEventListener('click', () => avaliacaoModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === avaliacaoModal) avaliacaoModal.style.display = 'none';
    });

    avaliacaoForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (currentRating === 0) {
            alert('Por favor, selecione uma nota (estrelas).');
            return;
        }

        const payload = {
            id_agendamento: parseInt(avaliacaoAgendamentoIdInput.value),
            id_avaliador: parseInt(clienteId),
            id_avaliado: parseInt(avaliacaoAtendenteIdInput.value),
            nota: currentRating,
            comentario: document.getElementById('comentario-avaliacao').value.trim() || null,
            anonima: document.getElementById('avaliacao-anonima').checked
        };
        
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        try {
            const response = await fetch('/api/agendamentos/avaliacoes', { // Corrigido para /api/agendamentos/avaliacoes
                method: 'POST',
                body: JSON.stringify(payload),
                ...fetchConfig
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao enviar avaliação.');

            alert(data.message || 'Avaliação enviada com sucesso!');
            avaliacaoModal.style.display = 'none';
            carregarAgendamentos(); // Recarrega para mostrar que foi avaliado
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Avaliação';
        }
    });


    carregarAgendamentos();
});