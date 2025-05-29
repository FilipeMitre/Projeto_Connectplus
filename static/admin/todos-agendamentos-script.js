document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const userType = localStorage.getItem('amadoUserType');

    if (!token || userType !== 'ADMIN') {
        window.location.href = '/static/login/login.html';
        return;
    }

    const fetchConfig = (method = 'GET', body = null) => { /* ... (copiar de gerenciar-clientes-script.js) ... */
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        if (body) config.body = JSON.stringify(body);
        return config;
    };

    // Elementos do DOM
    const statusFilterSelect = document.getElementById('ag-status-filter');
    const areaFilterSelect = document.getElementById('ag-area-filter');
    const dateFilterInput = document.getElementById('ag-date-filter');
    const searchInput = document.getElementById('ag-search-input');
    const applyFiltersButton = document.getElementById('apply-ag-filters-button');
    const appointmentsTbody = document.getElementById('appointments-list-tbody');

    const actionModal = document.getElementById('appointment-action-modal');
    const modalCloseButton = document.getElementById('appointment-modal-close-button');
    const modalTitle = document.getElementById('appointment-modal-title');
    const appointmentDetailsModalContent = document.getElementById('appointment-details-modal-content');
    const motivoFormGroup = document.getElementById('appointment-motivo-form-group'); // Renomeado para evitar conflito
    const actionReasonTextarea = document.getElementById('appointment-action-reason'); // Renomeado
    const cancelActionButton = document.getElementById('appointment-cancel-action-button'); // Renomeado
    const confirmActionButton = document.getElementById('appointment-confirm-action-button'); // Renomeado

    let currentAppointments = [];
    let selectedAppointmentForAction = null;

    function fetchAllAppointments() {
        appointmentsTbody.innerHTML = `<tr><td colspan="9" class="loading-message">Carregando agendamentos...</td></tr>`;

        const status = statusFilterSelect.value;
        const area = areaFilterSelect.value;
        const data = dateFilterInput.value;
        const searchTerm = searchInput.value.trim();

        // Endpoint da API para buscar todos os agendamentos com filtros
        // `/api/agendamentos` com permissão de admin e filtros
        let apiUrl = `/api/agendamentos?admin_view=true`; // Adicionar um param para indicar que é visão de admin
        if (status !== 'TODOS') apiUrl += `&status_agendamento=${status}`;
        if (area !== 'TODOS') apiUrl += `&area_atuacao=${area}`; // Backend precisa filtrar por área do atendente
        if (data) apiUrl += `&data_selecionada=${data}`; // Backend precisa filtrar por data
        if (searchTerm) apiUrl += `&busca=${encodeURIComponent(searchTerm)}`; // Busca por nome de cliente/atendente
        
        fetch(apiUrl, fetchConfig())
            .then(response => {
                if (!response.ok) throw new Error(`Erro ao buscar agendamentos: ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                // A API /api/agendamentos na função get_meus_agendamentos_filtrados já pode retornar o formato correto
                // Ajustar aqui se a resposta for apenas `data.agendamentos` simples
                currentAppointments = data.agendamentos_futuros.concat(data.agendamentos_passados) || data.agendamentos || [];
                renderAppointmentsTable(currentAppointments);
            })
            .catch(error => {
                console.error('Erro ao carregar agendamentos:', error);
                appointmentsTbody.innerHTML = `<tr><td colspan="9" class="error-message">Erro ao carregar agendamentos.</td></tr>`;
            });
    }

    function renderAppointmentsTable(appointments) {
        appointmentsTbody.innerHTML = ''; 

        if (appointments.length === 0) {
            appointmentsTbody.innerHTML = `<tr><td colspan="9" class="no-results-message">Nenhum agendamento encontrado.</td></tr>`;
            return;
        }
        
        // Ordenar por data mais recente primeiro, se a API não fizer
        appointments.sort((a, b) => new Date(b.data_hora_inicio) - new Date(a.data_hora_inicio));

        appointments.forEach(ag => {
            const row = appointmentsTbody.insertRow();
            row.insertCell().textContent = ag.id_agendamento;
            row.insertCell().textContent = ag.nome_cliente || 'N/A';
            row.insertCell().textContent = ag.nome_atendente || 'N/A';
            row.insertCell().textContent = new Date(ag.data_hora_inicio).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});
            row.insertCell().textContent = `${ag.duracao_minutos} min`;
            row.insertCell().textContent = ag.modalidade;
            row.insertCell().textContent = traduzirArea(ag.area_atendente) || 'N/A'; // area_atendente vem da API
            
            const statusCell = row.insertCell();
            const statusSpan = document.createElement('span');
            statusSpan.className = `status-${ag.status_agendamento}`; // Reutiliza classes de status
            statusSpan.textContent = traduzirStatusAgendamento(ag.status_agendamento);
            statusCell.appendChild(statusSpan);

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions-cell');
            const viewButton = createActionButton('Detalhes', 'view-button', () => openAppointmentActionModal('view', ag));
            actionsCell.appendChild(viewButton);

            // Admin pode cancelar qualquer agendamento que não esteja Realizado ou já Cancelado
            if (!['REALIZADO', 'CANCELADO_CLIENTE', 'CANCELADO_ATENDENTE'].includes(ag.status_agendamento)) {
                 const cancelButton = createActionButton('Cancelar', 'reject-button', () => openAppointmentActionModal('cancel_admin', ag));
                 actionsCell.appendChild(cancelButton);
            }
        });
    }
    
    function createActionButton(text, className, onClickHandler) { /* ... (copiar de gerenciar-clientes-script.js) ... */
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `action-button ${className}`;
        button.addEventListener('click', onClickHandler);
        return button;
    }

    function openAppointmentActionModal(actionType, appointment) {
        selectedAppointmentForAction = appointment;
        actionReasonTextarea.value = ''; 
        confirmActionButton.dataset.actionType = actionType;

        let detailsHtml = `
            <div class="detail-section">
                <h4>Detalhes do Agendamento</h4>
                <p><strong>ID Agendamento:</strong> ${appointment.id_agendamento}</p>
                <p><strong>Data/Hora:</strong> ${new Date(appointment.data_hora_inicio).toLocaleString('pt-BR')}</p>
                <p><strong>Duração:</strong> ${appointment.duracao_minutos} min</p>
                <p><strong>Modalidade:</strong> ${appointment.modalidade}</p>
                <p><strong>Status:</strong> <span class="status-${appointment.status_agendamento}">${traduzirStatusAgendamento(appointment.status_agendamento)}</span></p>
                <p><strong>Assunto Cliente:</strong> ${appointment.assunto_solicitacao || 'N/A'}</p>
                <p><strong>Link Online:</strong> ${appointment.link_atendimento_online ? `<a href="${appointment.link_atendimento_online}" target="_blank">${appointment.link_atendimento_online}</a>` : 'N/A'}</p>
                <p><strong>Observações Atendente:</strong> ${appointment.observacoes_atendente || 'N/A'}</p>
            </div>
            <div class="detail-section">
                <h4>Cliente</h4>
                <p><strong>Nome:</strong> ${appointment.nome_cliente || 'N/A'} (ID: ${appointment.id_cliente})</p>
                <!-- Adicionar mais detalhes do cliente se necessário, buscando da API /api/usuarios/<id_cliente> -->
            </div>
             <div class="detail-section">
                <h4>Atendente</h4>
                <p><strong>Nome:</strong> ${appointment.nome_atendente || 'N/A'} (ID: ${appointment.id_atendente})</p>
                <p><strong>Área:</strong> ${traduzirArea(appointment.area_atendente) || 'N/A'}</p>
            </div>
        `;
        // Se houver avaliação
        if (appointment.avaliacao_existente) {
            // Aqui você poderia fazer um fetch para buscar os detalhes da avaliação
            // GET /api/agendamentos/<id_agendamento>/avaliacao (precisa criar este endpoint)
            detailsHtml += `<div class="detail-section"><h4>Avaliação Recebida</h4><p>Este agendamento foi avaliado.</p></div>`;
        }

        appointmentDetailsModalContent.innerHTML = detailsHtml;
        motivoFormGroup.style.display = 'none';
        confirmActionButton.style.display = 'none';
        actionReasonTextarea.removeAttribute('required');

        if (actionType === 'cancel_admin') {
            modalTitle.textContent = 'Cancelar Agendamento (Admin)';
            motivoFormGroup.style.display = 'block';
            actionReasonTextarea.placeholder = 'Motivo do cancelamento (obrigatório).';
            actionReasonTextarea.setAttribute('required', 'required');
            confirmActionButton.textContent = 'Confirmar Cancelamento';
            confirmActionButton.style.display = 'block';
            confirmActionButton.className = 'confirm-button reject-button action-button';
        } else { // view
             modalTitle.textContent = 'Detalhes do Agendamento';
        }
        actionModal.style.display = 'block';
    }

    function closeAppointmentModal() {
        actionModal.style.display = 'none';
        selectedAppointmentForAction = null;
    }

    confirmActionButton.addEventListener('click', function() {
        if (!selectedAppointmentForAction) return;
        const action = this.dataset.actionType;
        if (action !== 'cancel_admin') return;

        const motivo = actionReasonTextarea.value.trim();
        if (!motivo) {
            alert('O motivo é obrigatório para cancelar.');
            actionReasonTextarea.focus();
            return;
        }

        // Endpoint para admin cancelar agendamento
        // POST /api/agendamentos/<id_agendamento>/cancelar/admin (ou um endpoint genérico de admin)
        const endpoint = `/api/agendamentos/${selectedAppointmentForAction.id_agendamento}/cancelar/admin`;
        const payload = { motivo: motivo, id_admin_responsavel: localStorage.getItem('amadoUserId') };
        
        confirmActionButton.disabled = true;
        confirmActionButton.textContent = 'Processando...';

        fetch(endpoint, fetchConfig('POST', payload))
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Erro ao cancelar agendamento') });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || 'Agendamento cancelado com sucesso!');
            closeAppointmentModal();
            fetchAllAppointments(); 
        })
        .catch(error => {
            console.error('Erro ao cancelar agendamento:', error);
            alert(`Erro: ${error.message}`);
        })
        .finally(() => {
            confirmActionButton.disabled = false;
        });
    });
    
    // Tradutores
    function traduzirArea(area) { /* ... (copiar) ... */ return area || 'N/A';}
    function traduzirStatusAgendamento(status) { /* ... (copiar de meus-agendamentos-script.js ou similar) ... */ return status || 'N/A';}

    applyFiltersButton.addEventListener('click', fetchAllAppointments);
    modalCloseButton.addEventListener('click', closeAppointmentModal);
    cancelActionButton.addEventListener('click', closeAppointmentModal);
    window.addEventListener('click', (event) => {
        if (event.target === actionModal) closeAppointmentModal();
    });

    fetchAllAppointments(); // Carga inicial
});