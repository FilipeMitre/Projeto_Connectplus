// static/atendente/minha-agenda-script.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const atendenteId = localStorage.getItem('amadoUserId');
    const userStatus = localStorage.getItem('amadoUserStatus');

    if (!token || !atendenteId || localStorage.getItem('amadoUserType') !== 'ATENDENTE') {
        window.location.href = '/static/login/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
     if (userStatus === 'PENDENTE_APROVACAO') {
        window.location.href = '/static/atendente/aguardando-aprovacao.html';
        return;
    }
    if (userStatus === 'BLOQUEADO') {
        window.location.href = '/static/atendente/conta-bloqueada.html';
        return;
    }

    const currentYearSpan = document.getElementById('currentYearFooterAgenda');
    if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const fetchConfig = (method = 'GET', body = null) => {
        const config = {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        };
        if (body) config.body = JSON.stringify(body);
        return config;
    };

    const listaConfirmadosDiv = document.getElementById('lista-agenda-confirmados');
    const listaRealizadosDiv = document.getElementById('lista-agenda-realizados');
    
    const detalheModal = document.getElementById('detalhe-agendamento-modal');
    const detalheModalClose = document.getElementById('detalhe-modal-close');
    const detalheAgendamentoConteudo = document.getElementById('detalhe-agendamento-conteudo');
    const observacoesEdicaoTextarea = document.getElementById('observacoes-atendente-edicao');
    const salvarObservacoesButton = document.getElementById('salvar-observacoes-ag-button');
    const marcarRealizadoButton = document.getElementById('marcar-realizado-button');
    let agendamentoAbertoNoModal = null;

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

    function traduzirStatusAgendamento(status) { /* ... (copiar do meus-agendamentos-script.js) ... */
        const mapa = {
            'SOLICITADO': 'Solicitado', 'CONFIRMADO': 'Confirmado', 'REALIZADO': 'Realizado',
            'CANCELADO_CLIENTE': 'Cancelado pelo Cliente', 'CANCELADO_ATENDENTE': 'Cancelado por Você',
            'NAO_COMPARECEU_CLIENTE': 'Cliente Não Compareceu', 'NAO_COMPARECEU_ATENDENTE': 'Você Não Compareceu'
        };
        return mapa[status] || status;
    }

    async function carregarMinhaAgenda() {
        listaConfirmadosDiv.innerHTML = '<p class="loading-message">Carregando...</p>';
        listaRealizadosDiv.innerHTML = '<p class="loading-message">Carregando...</p>';
        try {
            const responseConfirmados = await fetch(`/api/atendentes/${atendenteId}/agendamentos?status=CONFIRMADO`, fetchConfig());
            if (!responseConfirmados.ok) throw new Error('Falha ao carregar agendamentos confirmados.');
            const dataConfirmados = await responseConfirmados.json();
            renderAgendaItems(dataConfirmados.agendamentos || [], listaConfirmadosDiv, true);

            const responseRealizados = await fetch(`/api/atendentes/${atendenteId}/agendamentos?status=REALIZADO`, fetchConfig());
            if (!responseRealizados.ok) throw new Error('Falha ao carregar histórico.');
            const dataRealizados = await responseRealizados.json();
            renderAgendaItems(dataRealizados.agendamentos || [], listaRealizadosDiv, false);

        } catch (error) {
            console.error("Erro:", error);
            listaConfirmadosDiv.innerHTML = '<p class="error-message">Erro ao carregar.</p>';
            listaRealizadosDiv.innerHTML = '<p class="error-message">Erro ao carregar.</p>';
        }
    }

    function renderAgendaItems(agendamentos, divElement, isConfirmado) {
        divElement.innerHTML = '';
        if (agendamentos.length === 0) {
            divElement.innerHTML = `<p class="no-items-message">Nenhum agendamento ${isConfirmado ? 'confirmado' : 'realizado'} encontrado.</p>`;
            return;
        }

        agendamentos.forEach(ag => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'agenda-evento-item';
            const dataHoraInicio = new Date(ag.data_hora_inicio);

            itemDiv.innerHTML = `
                <div class="agenda-evento-info">
                    <h4>Atendimento com ${ag.nome_cliente}</h4>
                    <p><strong>Data:</strong> ${dataHoraInicio.toLocaleDateString('pt-BR')} às ${dataHoraInicio.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p><strong>Duração:</strong> ${ag.duracao_minutos} min</p>
                    <p><strong>Modalidade:</strong> ${ag.modalidade}</p>
                    ${ag.assunto_solicitacao ? `<p><strong>Assunto do Cliente:</strong> ${ag.assunto_solicitacao}</p>` : ''}
                    ${ag.link_atendimento_online && isConfirmado ? `<p><strong>Link:</strong> <a href="${ag.link_atendimento_online}" target="_blank" rel="noopener noreferrer">Acessar Atendimento</a></p>` : ''}
                    ${ag.observacoes_atendente ? `<p style="font-style:italic; color:#007bff;"><strong>Suas Obs:</strong> ${ag.observacoes_atendente}</p>` : ''}
                </div>
                <div class="agenda-evento-actions">
                    <button class="action-button view-details-button" data-id="${ag.id_agendamento}">Ver/Editar Detalhes</button>
                    ${isConfirmado && dataHoraInicio < new Date() ? `<button class="action-button marcar-realizado-quick-button" data-id="${ag.id_agendamento}">Marcar Realizado</button>` : ''}
                </div>
            `;
            divElement.appendChild(itemDiv);

            itemDiv.querySelector('.view-details-button').addEventListener('click', () => abrirModalDetalhes(ag));
            const marcarRealizadoQuickBtn = itemDiv.querySelector('.marcar-realizado-quick-button');
            if(marcarRealizadoQuickBtn) {
                marcarRealizadoQuickBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita abrir modal se o botão estiver dentro
                    handleMarcarComoRealizado(ag.id_agendamento);
                });
            }
        });
    }

    function abrirModalDetalhes(agendamento) {
        agendamentoAbertoNoModal = agendamento;
        const dataHoraInicio = new Date(agendamento.data_hora_inicio);
        detalheAgendamentoConteudo.innerHTML = `
            <p><strong>Cliente:</strong> ${agendamento.nome_cliente} (${agendamento.email_cliente || 'Email não disponível'})</p>
            <p><strong>Data/Hora:</strong> ${dataHoraInicio.toLocaleString('pt-BR')}</p>
            <p><strong>Duração:</strong> ${agendamento.duracao_minutos} minutos</p>
            <p><strong>Modalidade:</strong> ${agendamento.modalidade}</p>
            ${agendamento.assunto_solicitacao ? `<p><strong>Assunto Cliente:</strong> ${agendamento.assunto_solicitacao}</p>` : ''}
            ${agendamento.link_atendimento_online ? `<p><strong>Link Online:</strong> <a href="${agendamento.link_atendimento_online}" target="_blank">${agendamento.link_atendimento_online}</a></p>` : ''}
        `;
        observacoesEdicaoTextarea.value = agendamento.observacoes_atendente || '';
        
        // Mostrar botão "Marcar como Realizado" apenas para agendamentos confirmados e que já passaram
        if (agendamento.status_agendamento === 'CONFIRMADO' && dataHoraInicio < new Date()) {
            marcarRealizadoButton.style.display = 'inline-block';
        } else {
            marcarRealizadoButton.style.display = 'none';
        }
        detalheModal.style.display = 'block';
    }
    
    detalheModalClose.addEventListener('click', () => detalheModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === detalheModal) detalheModal.style.display = 'none';
    });

    salvarObservacoesButton.addEventListener('click', async () => {
        if (!agendamentoAbertoNoModal) return;
        const payload = { observacoes_atendente: observacoesEdicaoTextarea.value.trim() };
        
        salvarObservacoesButton.disabled = true;
        salvarObservacoesButton.textContent = 'Salvando...';
        try {
            // PUT /api/agendamentos/{id}/observacoes
            const response = await fetch(`/api/agendamentos/${agendamentoAbertoNoModal.id_agendamento}/observacoes`, fetchConfig('PUT', payload));
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao salvar observações.');
            alert(data.message || 'Observações salvas!');
            // Atualiza o objeto local para refletir na UI se o modal for reaberto sem recarregar a lista
            agendamentoAbertoNoModal.observacoes_atendente = payload.observacoes_atendente; 
            carregarMinhaAgenda(); // Recarrega a lista para mostrar as obs atualizadas
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            salvarObservacoesButton.disabled = false;
            salvarObservacoesButton.textContent = 'Salvar Observações';
        }
    });

    marcarRealizadoButton.addEventListener('click', () => {
        if(agendamentoAbertoNoModal) handleMarcarComoRealizado(agendamentoAbertoNoModal.id_agendamento);
    });

    async function handleMarcarComoRealizado(agendamentoId) {
        if (!confirm('Tem certeza que deseja marcar este agendamento como REALIZADO?')) return;
        
        try {
            // POST /api/agendamentos/{id}/marcar-realizado
            const response = await fetch(`/api/agendamentos/${agendamentoId}/marcar-realizado`, fetchConfig('POST'));
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao marcar como realizado.');

            alert(data.message || 'Agendamento marcado como realizado!');
            detalheModal.style.display = 'none'; // Fecha o modal se estiver aberto
            carregarMinhaAgenda(); // Recarrega as listas
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
    
    carregarMinhaAgenda();
});