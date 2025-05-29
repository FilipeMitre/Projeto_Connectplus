// static/atendente/solicitacoes-script.js
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

    const currentYearSpan = document.getElementById('currentYearFooterSolic');
    if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const fetchConfig = (method = 'GET', body = null) => {
        const config = {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        };
        if (body) config.body = JSON.stringify(body);
        return config;
    };

    const listaSolicitacoesContainer = document.getElementById('lista-solicitacoes-container');
    
    // Modais e seus elementos
    const confirmarModal = document.getElementById('confirmar-agendamento-modal');
    const confirmarModalClose = document.getElementById('confirmar-modal-close');
    const confirmarClienteNomeSpan = document.getElementById('confirmar-cliente-nome');
    const confirmarDataHoraSpan = document.getElementById('confirmar-data-hora');
    const linkAtendimentoInput = document.getElementById('link-atendimento-online');
    const observacoesConfirmarTextarea = document.getElementById('observacoes-atendente-confirmar');
    const botaoFinalConfirmar = document.getElementById('botao-final-confirmar');

    const recusarModal = document.getElementById('recusar-agendamento-modal');
    const recusarModalClose = document.getElementById('recusar-modal-close');
    const recusarClienteNomeSpan = document.getElementById('recusar-cliente-nome');
    const recusarDataHoraSpan = document.getElementById('recusar-data-hora');
    const motivoRecusaTextarea = document.getElementById('motivo-recusa');
    const botaoFinalRecusar = document.getElementById('botao-final-recusar');
    
    let agendamentoSelecionadoParaAcao = null;

    // Função para formatar datas considerando o fuso horário
    function formatarDataHora(dataISOString) {
        if (!dataISOString) return 'Data não disponível';
        
        try {
            // Extrair a data no formato brasileiro
            const data = new Date(dataISOString);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            
            // Extrair as horas e minutos diretamente da string ISO
            const horaMinuto = dataISOString.split('T')[1].substring(0, 5);
            
            return `${dataFormatada} às ${horaMinuto}`;
        } catch (error) {
            console.error("Erro ao formatar data:", error);
            return String(dataISOString);
        }
    }

    function traduzirModalidade(modalidade) { return modalidade === 'ONLINE' ? 'Online' : 'Presencial'; }

    async function carregarSolicitacoes() {
        listaSolicitacoesContainer.innerHTML = '<p class="loading-message">Carregando...</p>';
        try {
            // Endpoint para buscar agendamentos com status SOLICITADO para este atendente
            const response = await fetch(`/api/atendentes/${atendenteId}/agendamentos?status=SOLICITADO`, fetchConfig());
            if (!response.ok) throw new Error('Falha ao carregar solicitações.');
            const data = await response.json();
            renderSolicitacoes(data.agendamentos || []);
        } catch (error) {
            console.error("Erro:", error);
            listaSolicitacoesContainer.innerHTML = '<p class="error-message">Não foi possível carregar as solicitações.</p>';
        }
    }

    function renderSolicitacoes(solicitacoes) {
        listaSolicitacoesContainer.innerHTML = '';
        if (solicitacoes.length === 0) {
            listaSolicitacoesContainer.innerHTML = '<p class="no-items-message">Nenhuma solicitação de agendamento pendente.</p>';
            return;
        }

        solicitacoes.forEach(ag => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'solicitacao-item';

            itemDiv.innerHTML = `
                <div class="solicitacao-info">
                    <h4>Solicitação de ${ag.nome_cliente}</h4>
                    <p><strong>Data:</strong> ${formatarDataHora(ag.data_hora_inicio)}</p>
                    <p><strong>Duração:</strong> ${ag.duracao_minutos} min</p>
                    <p><strong>Modalidade:</strong> ${traduzirModalidade(ag.modalidade)}</p>
                    ${ag.assunto_solicitacao ? `<p><strong>Assunto do Cliente:</strong> ${ag.assunto_solicitacao}</p>` : ''}
                </div>
                <div class="solicitacao-actions">
                    <button class="action-button confirmar-button" data-id="${ag.id_agendamento}">Confirmar</button>
                    <button class="action-button recusar-button" data-id="${ag.id_agendamento}">Recusar</button>
                </div>
            `;
            listaSolicitacoesContainer.appendChild(itemDiv);

            itemDiv.querySelector('.confirmar-button').addEventListener('click', () => {
                agendamentoSelecionadoParaAcao = ag;
                confirmarClienteNomeSpan.textContent = ag.nome_cliente;
                confirmarDataHoraSpan.textContent = formatarDataHora(ag.data_hora_inicio);
                linkAtendimentoInput.value = ''; // Limpar campo
                observacoesConfirmarTextarea.value = '';
                confirmarModal.style.display = 'block';
            });
            itemDiv.querySelector('.recusar-button').addEventListener('click', () => {
                agendamentoSelecionadoParaAcao = ag;
                recusarClienteNomeSpan.textContent = ag.nome_cliente;
                recusarDataHoraSpan.textContent = formatarDataHora(ag.data_hora_inicio);
                motivoRecusaTextarea.value = ''; // Limpar campo
                recusarModal.style.display = 'block';
            });
        });
    }
    
    // Ações dos Modais
    confirmarModalClose.addEventListener('click', () => confirmarModal.style.display = 'none');
    recusarModalClose.addEventListener('click', () => recusarModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === confirmarModal) confirmarModal.style.display = 'none';
        if (event.target === recusarModal) recusarModal.style.display = 'none';
    });

    botaoFinalConfirmar.addEventListener('click', async () => {
        if (!agendamentoSelecionadoParaAcao) return;
        
        const payload = {
            link_atendimento_online: linkAtendimentoInput.value.trim() || null,
            observacoes_atendente: observacoesConfirmarTextarea.value.trim() || null
        };
        
        botaoFinalConfirmar.disabled = true;
        botaoFinalConfirmar.textContent = 'Confirmando...';

        try {
            const response = await fetch(`/api/agendamentos/${agendamentoSelecionadoParaAcao.id_agendamento}/confirmar/atendente`, fetchConfig('POST', payload));
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao confirmar agendamento.');

            alert(data.message || 'Agendamento confirmado com sucesso!');
            confirmarModal.style.display = 'none';
            carregarSolicitacoes(); // Recarrega
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            botaoFinalConfirmar.disabled = false;
            botaoFinalConfirmar.textContent = 'Confirmar Agendamento';
        }
    });

    botaoFinalRecusar.addEventListener('click', async () => {
        if (!agendamentoSelecionadoParaAcao) return;
        const motivo = motivoRecusaTextarea.value.trim();
        if (!motivo) {
            alert('Por favor, informe o motivo da recusa.');
            motivoRecusaTextarea.focus();
            return;
        }

        const payload = { motivo_recusa: motivo };
        
        botaoFinalRecusar.disabled = true;
        botaoFinalRecusar.textContent = 'Enviando...';

        try {
            const response = await fetch(`/api/agendamentos/${agendamentoSelecionadoParaAcao.id_agendamento}/recusar/atendente`, fetchConfig('POST', payload));
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao recusar agendamento.');
            
            alert(data.message || 'Agendamento recusado com sucesso.');
            recusarModal.style.display = 'none';
            carregarSolicitacoes(); // Recarrega
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            botaoFinalRecusar.disabled = false;
            botaoFinalRecusar.textContent = 'Enviar Recusa';
        }
    });

    carregarSolicitacoes();
});