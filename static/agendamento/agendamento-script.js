// static/agendamento/agendamento-script.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const userType = localStorage.getItem('amadoUserType');
    const clienteId = localStorage.getItem('amadoUserId'); // ID do cliente logado

    const fetchConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Elementos do DOM - Filtros e Lista
    const filtroAreaSelect = document.getElementById('filtro-area');
    const filtroBuscaNomeInput = document.getElementById('filtro-busca-nome');
    const aplicarFiltrosButton = document.getElementById('botao-aplicar-filtros');
    const listaAtendentesContainer = document.getElementById('lista-atendentes-container');
    const loginPromptContainer = document.getElementById('login-prompt-container');

    // Elementos do DOM - Modal de Agendamento
    const agendamentoModal = document.getElementById('agendamento-modal');
    const agendamentoModalClose = document.getElementById('agendamento-modal-close');
    const modalAtendenteNomeSpan = document.getElementById('modal-atendente-nome');
    const selectedProfessionalInfoModal = document.getElementById('selected-professional-info-modal');
    const modalAtendenteQualificacaoP = document.getElementById('modal-atendente-qualificacao');
    const modalAtendenteEspecialidadesP = document.getElementById('modal-atendente-especialidades');
    
    const prevMonthButton = document.getElementById('prev-month-button');
    const nextMonthButton = document.getElementById('next-month-button');
    const currentMonthYearDisplay = document.getElementById('current-month-year-display');
    const calendarGrid = document.getElementById('calendar-grid');
    const timeSlotsContainer = document.getElementById('time-slots-container'); // O H3 está dentro
    const timeSlotsGrid = document.getElementById('time-slots-grid');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const assuntoSolicitacaoTextarea = document.getElementById('assunto-solicitacao');
    const confirmAgendamentoButton = document.getElementById('confirm-agendamento-button');

    // Elementos do DOM - Modal de Confirmação de Solicitação
    const confirmacaoSolicitacaoModal = document.getElementById('confirmacao-solicitacao-modal');
    const confirmacaoSolicitacaoModalClose = document.getElementById('confirmacao-solicitacao-modal-close');
    const confirmacaoSolicitacaoDetails = document.getElementById('confirmacao-solicitacao-details');
    const verMeusAgendamentosButton = document.getElementById('ver-meus-agendamentos-button');

    let atendentesListados = [];
    let atendenteSelecionadoParaAgendar = null;
    let dataSelecionadaNoCalendario = null;
    let horarioSelecionado = null;
    let calendarioDataAtual = new Date(); // Para navegação do calendário

    // Tradutores (Reutilizar ou definir aqui se necessário)
    function traduzirArea(area) {
        const areas = { 'SAUDE': 'Saúde', 'JURIDICO': 'Jurídico', 'CARREIRA': 'Carreira', 'CONTABIL': 'Contábil', 'ASSISTENCIA_SOCIAL': 'Assistência Social' };
        return areas[area] || area || 'N/A';
    }
    function traduzirIdentidadeGenero(id) {
        const map = {
            'MULHER_CIS': 'Mulher Cis', 'HOMEM_CIS': 'Homem Cis', 'MULHER_TRANS': 'Mulher Trans', 
            'HOMEM_TRANS': 'Homem Trans', 'NAO_BINARIE': 'Não Binárie', 'AGENERO': 'Agênero', 
            'GENERO_FLUIDO': 'Gênero Fluido', 'TRAVESTI': 'Travesti', 
            'OUTRA_IDENTIDADE': 'Outra', 'PREFIRO_NAO_DECLARAR_GENERO': 'Prefiro Não Declarar'
        };
        return map[id] || id || 'Não informado';
    }

    function carregarAtendentes() {
        listaAtendentesContainer.innerHTML = '<p class="loading-message">Buscando atendentes...</p>';
        loginPromptContainer.style.display = 'none';

        const area = filtroAreaSelect.value;
        const busca = filtroBuscaNomeInput.value.trim();

        // Corrigindo o endpoint para usar /api/atendentes com situacao=ATIVO
        let apiUrl = `/api/atendentes?situacao=ATIVO`; 
        if (area !== 'TODAS') apiUrl += `&area_atuacao=${area}`;
        if (busca) apiUrl += `&busca=${encodeURIComponent(busca)}`;

        console.log('Tentando acessar a API na URL:', apiUrl); // Log detalhado da URL

        fetch(apiUrl)
            .then(response => {
                console.log('Status da resposta:', response.status); // Log do status da resposta
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error('Corpo da resposta de erro:', text); // Log do corpo da resposta
                        throw new Error(`Erro ${response.status}: ${text || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Dados recebidos da API:', data); // Log para debug
                if (!data || !Array.isArray(data.atendentes)) {
                    throw new Error('Formato de resposta inválido');
                }
                atendentesListados = data.atendentes || [];
                renderAtendentes(atendentesListados);
            })
            .catch(error => {
                console.error('Erro detalhado ao carregar atendentes:', error);
                listaAtendentesContainer.innerHTML = `
                    <div class="error-container">
                        <p class="error-message">Não foi possível carregar os atendentes.</p>
                        <p class="error-details">Detalhes: ${error.message}</p>
                        <button onclick="carregarAtendentes()" class="retry-button">Tentar Novamente</button>
                    </div>`;
            });
    }

    function renderAtendentes(atendentes) {
        listaAtendentesContainer.innerHTML = '';
        if (atendentes.length === 0) {
            listaAtendentesContainer.innerHTML = '<p class="no-results-message">Nenhum atendente encontrado com os critérios selecionados.</p>';
            return;
        }

        atendentes.forEach(atendente => {
            const card = document.createElement('div');
            card.className = 'atendente-card';

            const nomes = atendente.nome_completo.split(' ');
            const iniciais = nomes.length > 1 ? (nomes[0][0] + nomes[nomes.length-1][0]).toUpperCase() : nomes[0].substring(0,2).toUpperCase();
            
            let avatarClass = 'outro'; // Padrão
            if (atendente.identidade_genero) {
                if (atendente.identidade_genero.includes('MULHER')) avatarClass = 'feminino';
                else if (atendente.identidade_genero.includes('HOMEM')) avatarClass = 'masculino';
                else if (atendente.identidade_genero === 'NAO_BINARIE') avatarClass = 'nao-binarie';
            }


            card.innerHTML = `
                <div class="atendente-card-header">
                    <div class="atendente-avatar ${avatarClass}">${iniciais}</div>
                    <div class="atendente-info">
                        <h3>${atendente.nome_social || atendente.nome_completo}</h3>
                        <p class="area">${traduzirArea(atendente.area_atuacao)}</p>
                    </div>
                </div>
                <p class="qualificacao">${atendente.qualificacao_descricao.substring(0, 100)}${atendente.qualificacao_descricao.length > 100 ? '...' : ''}</p>
                <div class="rating-container">
                    ${generateStars(atendente.media_avaliacoes)} (${Number(atendente.media_avaliacoes || 0).toFixed(1)})
                    <span class="total-avaliacoes">(${atendente.total_avaliacoes || 0} avaliações)</span>
                </div>
                <p class="duracao-padrao"><i class="far fa-clock"></i> Duração padrão: ${atendente.duracao_padrao_atendimento_min || 'N/A'} min</p>
                <div class="atendente-card-actions">
                    <button class="action-button view-profile-button" data-id="${atendente.id_usuario}">Ver Perfil Completo</button>
                    <button class="action-button agendar-button" data-id="${atendente.id_usuario}">Agendar</button>
                </div>
            `;
            listaAtendentesContainer.appendChild(card);
        });

        // Adicionar event listeners aos novos botões
        document.querySelectorAll('.agendar-button').forEach(button => {
            button.addEventListener('click', function() {
                if (!token || !clienteId) {
                    loginPromptContainer.style.display = 'block';
                    window.scrollTo(0, document.body.scrollHeight); // Scroll para o prompt
                    return;
                }
                const atendenteId = this.dataset.id;
                atendenteSelecionadoParaAgendar = atendentesListados.find(a => a.id_usuario == atendenteId);
                if (atendenteSelecionadoParaAgendar) {
                    abrirModalAgendamento();
                }
            });
        });
        document.querySelectorAll('.view-profile-button').forEach(button => {
            button.addEventListener('click', function() {
                 window.location.href = `/static/atendente/perfil-publico.html?id=${this.dataset.id}`;
            });
        });
    }
    
    function generateStars(rating) {
        const totalStars = 5;
        let starsHtml = '';
        const numRating = Number(rating || 0);
        for (let i = 1; i <= totalStars; i++) {
            if (i <= numRating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 <= numRating) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>'; // Estrela vazia
            }
        }
        return starsHtml;
    }


    function abrirModalAgendamento() {
        if (!atendenteSelecionadoParaAgendar) return;

        modalAtendenteNomeSpan.textContent = atendenteSelecionadoParaAgendar.nome_social || atendenteSelecionadoParaAgendar.nome_completo;
        
        const nomes = atendenteSelecionadoParaAgendar.nome_completo.split(' ');
        const iniciais = nomes.length > 1 ? (nomes[0][0] + nomes[nomes.length-1][0]).toUpperCase() : nomes[0].substring(0,2).toUpperCase();
        let avatarClassModal = 'outro';
        if (atendenteSelecionadoParaAgendar.identidade_genero) {
            if (atendenteSelecionadoParaAgendar.identidade_genero.includes('MULHER')) avatarClassModal = 'feminino';
            else if (atendenteSelecionadoParaAgendar.identidade_genero.includes('HOMEM')) avatarClassModal = 'masculino';
            else if (atendenteSelecionadoParaAgendar.identidade_genero === 'NAO_BINARIE') avatarClassModal = 'nao-binarie';
        }

        selectedProfessionalInfoModal.innerHTML = `
            <div class="atendente-avatar ${avatarClassModal}">${iniciais}</div>
            <div class="atendente-info">
                <h3>${atendenteSelecionadoParaAgendar.nome_social || atendenteSelecionadoParaAgendar.nome_completo}</h3>
                <p class="area">${traduzirArea(atendenteSelecionadoParaAgendar.area_atuacao)}</p>
            </div>`;
        
        modalAtendenteQualificacaoP.textContent = `Principal Qualificação: ${atendenteSelecionadoParaAgendar.qualificacao_descricao}`;
        modalAtendenteEspecialidadesP.textContent = `Especialidades: ${atendenteSelecionadoParaAgendar.especialidades || 'Não informado'}`;

        calendarioDataAtual = new Date(); // Resetar para o mês atual ao abrir
        calendarioDataAtual.setDate(1); // Ir para o primeiro dia do mês para consistência
        dataSelecionadaNoCalendario = null;
        horarioSelecionado = null;
        assuntoSolicitacaoTextarea.value = '';
        confirmAgendamentoButton.disabled = true;
        timeSlotsGrid.innerHTML = '<p class="no-results-message">Selecione uma data para ver os horários.</p>';
        selectedDateDisplay.textContent = '--/--/----';

        renderizarCalendario();
        agendamentoModal.style.display = 'block';
    }

    function renderizarCalendario() {
        calendarGrid.innerHTML = `
            <div class="calendar-day-label">Dom</div><div class="calendar-day-label">Seg</div>
            <div class="calendar-day-label">Ter</div><div class="calendar-day-label">Qua</div>
            <div class="calendar-day-label">Qui</div><div class="calendar-day-label">Sex</div>
            <div class="calendar-day-label">Sáb</div>`; // Recria os labels dos dias da semana

        const mes = calendarioDataAtual.getMonth();
        const ano = calendarioDataAtual.getFullYear();
        currentMonthYearDisplay.textContent = `${calendarioDataAtual.toLocaleString('default', { month: 'long' })} ${ano}`;

        const primeiroDiaDoMes = new Date(ano, mes, 1).getDay();
        const diasNoMes = new Date(ano, mes + 1, 0).getDate();
        const hoje = new Date();
        hoje.setHours(0,0,0,0); // Comparar apenas data

        for (let i = 0; i < primeiroDiaDoMes; i++) {
            calendarGrid.appendChild(document.createElement('div')); // Células vazias
        }

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const diaElement = document.createElement('div');
            diaElement.classList.add('calendar-day');
            diaElement.textContent = dia;
            const dataAtualIteracao = new Date(ano, mes, dia);
            dataAtualIteracao.setHours(0,0,0,0);

            if (dataAtualIteracao < hoje) {
                diaElement.classList.add('disabled');
            } else {
                if (dataAtualIteracao.getTime() === hoje.getTime()) {
                    diaElement.classList.add('today');
                }
                diaElement.addEventListener('click', () => {
                    if (dataSelecionadaNoCalendario) {
                        document.querySelector(`.calendar-day[data-full-date="${dataSelecionadaNoCalendario}"].selected`)?.classList.remove('selected');
                    }
                    dataSelecionadaNoCalendario = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    diaElement.classList.add('selected');
                    diaElement.dataset.fullDate = dataSelecionadaNoCalendario; // para remover a classe depois
                    selectedDateDisplay.textContent = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
                    horarioSelecionado = null; // Reseta horário ao mudar data
                    confirmAgendamentoButton.disabled = true;
                    carregarHorariosDisponiveis();
                });
            }
            calendarGrid.appendChild(diaElement);
        }
    }

    prevMonthButton.addEventListener('click', () => {
        calendarioDataAtual.setMonth(calendarioDataAtual.getMonth() - 1);
        renderizarCalendario();
    });
    nextMonthButton.addEventListener('click', () => {
        calendarioDataAtual.setMonth(calendarioDataAtual.getMonth() + 1);
        renderizarCalendario();
    });

    function carregarHorariosDisponiveis() {
        if (!dataSelecionadaNoCalendario || !atendenteSelecionadoParaAgendar) return;
        timeSlotsGrid.innerHTML = '<p class="loading-message">Verificando horários...</p>';

        // Endpoint da API para buscar horários disponíveis
        // Ex: /api/atendentes/{id_atendente}/disponibilidade?data=YYYY-MM-DD&duracao={minutos}
        // A duração pode vir de atendenteSelecionadoParaAgendar.duracao_padrao_atendimento_min
        const duracao = atendenteSelecionadoParaAgendar.duracao_padrao_atendimento_min || 60;
        fetch(`/api/atendentes/${atendenteSelecionadoParaAgendar.id_usuario}/disponibilidade?data=${dataSelecionadaNoCalendario}&duracao=${duracao}`)
            .then(response => {
                if (!response.ok) throw new Error('Erro ao buscar horários.');
                return response.json();
            })
            .then(data => {
                renderizarHorarios(data.horarios_disponiveis || []);
            })
            .catch(error => {
                console.error("Erro ao carregar horários:", error);
                timeSlotsGrid.innerHTML = '<p class="error-message">Não foi possível carregar os horários.</p>';
            });
    }

    function renderizarHorarios(horarios) {
        timeSlotsGrid.innerHTML = '';
        if (horarios.length === 0) {
            timeSlotsGrid.innerHTML = '<p class="no-results-message">Nenhum horário disponível para esta data.</p>';
            return;
        }
        horarios.forEach(horario => {
            const slot = document.createElement('div');
            slot.classList.add('time-slot');
            slot.textContent = horario; // Ex: "09:00"
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                horarioSelecionado = horario;
                confirmAgendamentoButton.disabled = false; // Habilita o botão de confirmar
            });
            timeSlotsGrid.appendChild(slot);
        });
    }

    confirmAgendamentoButton.addEventListener('click', function() {
        if (!clienteId || !atendenteSelecionadoParaAgendar || !dataSelecionadaNoCalendario || !horarioSelecionado) {
            alert('Por favor, complete todos os passos para o agendamento.');
            return;
        }
        this.disabled = true;
        this.textContent = 'Enviando Solicitação...';

        const payload = {
            id_cliente: parseInt(clienteId),
            id_atendente: atendenteSelecionadoParaAgendar.id_usuario,
            data_hora_inicio: `${dataSelecionadaNoCalendario}T${horarioSelecionado}:00`, // Formato YYYY-MM-DDTHH:MM:SS
            duracao_minutos: atendenteSelecionadoParaAgendar.duracao_padrao_atendimento_min || 60,
            modalidade: 'ONLINE', // TODO: Permitir escolher, se aplicável (ou pegar do perfil do atendente)
            assunto_solicitacao: assuntoSolicitacaoTextarea.value.trim() || null
        };

        fetch('/api/agendamentos', { // Endpoint para criar agendamento
            method: 'POST',
            headers: fetchConfig.headers, // Inclui o token
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Falha ao solicitar agendamento.') });
            }
            return response.json();
        })
        .then(data => {
            agendamentoModal.style.display = 'none';
            mostrarConfirmacaoSolicitacao(data.agendamento_criado); // data.agendamento_criado deve ser o objeto do agendamento
        })
        .catch(error => {
            console.error("Erro ao criar agendamento:", error);
            alert(`Erro: ${error.message}`);
        })
        .finally(() => {
            this.disabled = false;
            this.textContent = 'Solicitar Agendamento';
        });
    });
    
    function mostrarConfirmacaoSolicitacao(agendamento) {
        confirmacaoSolicitacaoDetails.innerHTML = `
            <p><strong>Atendente:</strong> ${atendenteSelecionadoParaAgendar.nome_social || atendenteSelecionadoParaAgendar.nome_completo}</p>
            <p><strong>Data e Hora:</strong> ${new Date(agendamento.data_hora_inicio).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}</p>
            <p><strong>Duração:</strong> ${agendamento.duracao_minutos} minutos</p>
            <p><strong>Modalidade:</strong> ${agendamento.modalidade}</p>
            <p><strong>Status:</strong> ${traduzirStatusAgendamento(agendamento.status_agendamento)}</p>
            <p><em>Você receberá uma notificação quando o atendente confirmar.</em></p>
        `;
        confirmacaoSolicitacaoModal.style.display = 'block';
    }
    
    function traduzirStatusAgendamento(status) {
        const mapa = {
            'SOLICITADO': 'Solicitado (Aguardando Confirmação)',
            'CONFIRMADO': 'Confirmado',
            'REALIZADO': 'Realizado',
            'CANCELADO_CLIENTE': 'Cancelado pelo Cliente',
            'CANCELADO_ATENDENTE': 'Cancelado pelo Atendente',
            'NAO_COMPARECEU_CLIENTE': 'Cliente Não Compareceu',
            'NAO_COMPARECEU_ATENDENTE': 'Atendente Não Compareceu'
        };
        return mapa[status] || status;
    }

    // Event Listeners para fechar modais
    agendamentoModalClose.addEventListener('click', () => agendamentoModal.style.display = 'none');
    confirmacaoSolicitacaoModalClose.addEventListener('click', () => confirmacaoSolicitacaoModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === agendamentoModal) agendamentoModal.style.display = 'none';
        if (event.target === confirmacaoSolicitacaoModal) confirmacaoSolicitacaoModal.style.display = 'none';
    });
    
    verMeusAgendamentosButton.addEventListener('click', () => {
        window.location.href = '/static/cliente/meus-agendamentos.html'; // Link para o painel do cliente
    });

    // Inicialização
    const urlParams = new URLSearchParams(window.location.search);
    const areaParam = urlParams.get('area');
    if (areaParam) {
        filtroAreaSelect.value = areaParam;
    }
    carregarAtendentes();
    aplicarFiltrosButton.addEventListener('click', carregarAtendentes);
});