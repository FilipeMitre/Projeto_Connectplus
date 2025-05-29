document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const userType = localStorage.getItem('amadoUserType');
    const adminId = localStorage.getItem('amadoUserId');

    if (!token || userType !== 'ADMIN') {
        window.location.href = '/static/login/login.html';
        return;
    }

    const fetchConfig = (method = 'GET', body = null) => {
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
    const statusFilterSelect = document.getElementById('client-status-filter');
    const searchInput = document.getElementById('client-search-input');
    const applyFiltersButton = document.getElementById('apply-client-filters-button');
    const clientsTbody = document.getElementById('clients-list-tbody');

    const actionModal = document.getElementById('client-action-modal');
    const modalCloseButton = document.getElementById('client-modal-close-button');
    const modalTitle = document.getElementById('client-modal-title');
    const clientDetailsModalContent = document.getElementById('client-details-modal-content');
    const motivoFormGroup = document.getElementById('client-motivo-form-group');
    const actionReasonTextarea = document.getElementById('client-action-reason');
    const cancelActionButton = document.getElementById('client-cancel-action-button');
    const confirmActionButton = document.getElementById('client-confirm-action-button');

    let currentClients = [];
    let selectedClientForAction = null;

    function fetchClients() {
        clientsTbody.innerHTML = `<tr><td colspan="6" class="loading-message">Carregando clientes...</td></tr>`;

        const situacao = statusFilterSelect.value;
        const searchTerm = searchInput.value.trim();

        // Endpoint da API para buscar clientes (usuários do tipo CLIENTE)
        // `/api/usuarios` já permite filtrar por tipo e situação
        let apiUrl = `/api/usuarios?tipo=CLIENTE`;
        if (situacao !== 'TODOS') apiUrl += `&situacao=${situacao}`;
        if (searchTerm) apiUrl += `&busca=${encodeURIComponent(searchTerm)}`;
        
        fetch(apiUrl, fetchConfig())
            .then(response => {
                if (!response.ok) throw new Error(`Erro ao buscar clientes: ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                currentClients = data.usuarios || [];
                renderClientsTable(currentClients);
            })
            .catch(error => {
                console.error('Erro ao carregar clientes:', error);
                clientsTbody.innerHTML = `<tr><td colspan="6" class="error-message">Erro ao carregar clientes.</td></tr>`;
            });
    }

    function renderClientsTable(clients) {
        clientsTbody.innerHTML = ''; 

        if (clients.length === 0) {
            clientsTbody.innerHTML = `<tr><td colspan="6" class="no-results-message">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        clients.forEach(client => {
            const row = clientsTbody.insertRow();
            row.insertCell().textContent = client.nome_completo;
            row.insertCell().textContent = client.email;
            row.insertCell().textContent = client.cpf || 'N/A'; // CPF pode não estar na listagem inicial de /api/usuarios
            row.insertCell().textContent = new Date(client.data_criacao).toLocaleDateString('pt-BR');
            
            const statusCell = row.insertCell();
            const statusSpan = document.createElement('span');
            statusSpan.className = `status-${client.situacao}`; // Usa as classes de status do admin-panel-styles.css
            statusSpan.textContent = traduzirSituacao(client.situacao);
            statusCell.appendChild(statusSpan);

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions-cell');

            const viewButton = createActionButton('Visualizar', 'view-button', () => openClientActionModal('view', client));
            actionsCell.appendChild(viewButton);

            if (client.situacao === 'ATIVO') {
                const blockButton = createActionButton('Bloquear', 'block-button', () => openClientActionModal('block', client));
                actionsCell.appendChild(blockButton);
            } else if (client.situacao === 'BLOQUEADO') {
                const unblockButton = createActionButton('Desbloquear', 'unblock-button', () => openClientActionModal('unblock', client));
                actionsCell.appendChild(unblockButton);
            }
            // Adicionar mais ações se necessário (ex: Inativar)
        });
    }

    function createActionButton(text, className, onClickHandler) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `action-button ${className}`; // Reutiliza classes de admin-panel-styles.css
        button.addEventListener('click', onClickHandler);
        return button;
    }
    
    async function openClientActionModal(actionType, client) {
        selectedClientForAction = client;
        actionReasonTextarea.value = ''; 
        confirmActionButton.dataset.actionType = actionType;

        // Para "Visualizar", buscar mais detalhes do cliente se a listagem inicial for resumida
        let clientDetailsToDisplay = { ...client }; // Começa com os dados da tabela

        if (actionType === 'view') {
            try {
                // Supondo que /api/usuarios/<id> retorna detalhes completos (incluindo telefone, endereço)
                const response = await fetch(`/api/usuarios/${client.id_usuario}`, fetchConfig());
                if (response.ok) {
                    const detailedData = await response.json();
                    clientDetailsToDisplay = { ...client, ...detailedData.usuario }; // Mescla dados
                }
            } catch (err) {
                console.warn("Não foi possível buscar detalhes completos do cliente:", err);
            }
        }
        
        let detailsHtml = `
            <div class="detail-section">
                <h4>Informações Pessoais</h4>
                <p><strong>ID:</strong> ${clientDetailsToDisplay.id_usuario}</p>
                <p><strong>Nome Completo:</strong> ${clientDetailsToDisplay.nome_completo}</p>
                <p><strong>Nome Social:</strong> ${clientDetailsToDisplay.nome_social || 'Não informado'}</p>
                <p><strong>Email:</strong> ${clientDetailsToDisplay.email}</p>
                <p><strong>CPF:</strong> ${clientDetailsToDisplay.cpf || 'Não informado'}</p>
                <p><strong>Data de Nascimento:</strong> ${clientDetailsToDisplay.data_nascimento ? new Date(clientDetailsToDisplay.data_nascimento).toLocaleDateString('pt-BR') : 'Não informada'}</p>
                <p><strong>Gênero:</strong> ${traduzirIdentidadeGenero(clientDetailsToDisplay.identidade_genero)}</p>
                <p><strong>Orientação:</strong> ${traduzirOrientacaoSexual(clientDetailsToDisplay.orientacao_sexual)}</p>
                <p><strong>Pronomes:</strong> ${clientDetailsToDisplay.pronomes || 'Não informados'}</p>
                <p><strong>Data de Cadastro:</strong> ${new Date(clientDetailsToDisplay.data_criacao).toLocaleString('pt-BR')}</p>
                <p><strong>Status Atual:</strong> <span class="status-${clientDetailsToDisplay.situacao}">${traduzirSituacao(clientDetailsToDisplay.situacao)}</span></p>
            </div>`;
            
        if (clientDetailsToDisplay.telefones && clientDetailsToDisplay.telefones.length > 0) {
            detailsHtml += `<div class="detail-section"><h4>Telefones</h4>`;
            clientDetailsToDisplay.telefones.forEach(tel => {
                detailsHtml += `<p>${tel.numero_telefone} (${tel.tipo_telefone || 'N/A'}) ${tel.is_principal ? '<strong>(Principal)</strong>' : ''}</p>`;
            });
            detailsHtml += `</div>`;
        }
        if (clientDetailsToDisplay.enderecos && clientDetailsToDisplay.enderecos.length > 0) {
            detailsHtml += `<div class="detail-section"><h4>Endereços</h4>`;
            clientDetailsToDisplay.enderecos.forEach(end => {
                detailsHtml += `<p>${end.logradouro}, ${end.numero} ${end.complemento || ''} - ${end.bairro}, ${end.cidade}/${end.estado} - CEP: ${end.cep} ${end.is_principal ? '<strong>(Principal)</strong>' : ''}</p>`;
            });
            detailsHtml += `</div>`;
        }


        clientDetailsModalContent.innerHTML = detailsHtml;
        motivoFormGroup.style.display = 'none';
        confirmActionButton.style.display = 'none';
        actionReasonTextarea.removeAttribute('required');

        switch (actionType) {
            case 'view':
                modalTitle.textContent = 'Detalhes do Cliente';
                break;
            case 'block':
                modalTitle.textContent = `Bloquear Cliente: ${client.nome_completo}`;
                motivoFormGroup.style.display = 'block';
                actionReasonTextarea.placeholder = 'Motivo do bloqueio (obrigatório).';
                actionReasonTextarea.setAttribute('required', 'required');
                confirmActionButton.textContent = 'Confirmar Bloqueio';
                confirmActionButton.style.display = 'block';
                confirmActionButton.className = 'confirm-button block-button action-button';
                break;
            case 'unblock': 
                modalTitle.textContent = `Desbloquear Cliente: ${client.nome_completo}`;
                motivoFormGroup.style.display = 'block';
                actionReasonTextarea.placeholder = 'Motivo do desbloqueio (opcional).';
                confirmActionButton.textContent = 'Confirmar Desbloqueio';
                confirmActionButton.style.display = 'block';
                confirmActionButton.className = 'confirm-button approve-button action-button'; 
                break;
        }
        actionModal.style.display = 'block';
    }

    function closeClientModal() {
        actionModal.style.display = 'none';
        selectedClientForAction = null;
    }

    confirmActionButton.addEventListener('click', function() {
        if (!selectedClientForAction) return;

        const action = this.dataset.actionType;
        const motivo = actionReasonTextarea.value.trim();

        if (action === 'block' && !motivo) {
            alert('O motivo é obrigatório para bloquear.');
            actionReasonTextarea.focus();
            return;
        }

        let endpoint = '';
        let novoStatusParaLog = ''; // Backend vai definir, mas pode ser útil para o payload
        let payload = { motivo: motivo, id_admin_responsavel: adminId };

        // Para bloquear/desbloquear clientes, você precisará de um endpoint específico na API
        // Ex: PUT /api/usuarios/<id_usuario>/status
        // Ou pode ser um endpoint mais genérico de admin para mudar status de qualquer usuário.
        // Vamos assumir que o endpoint `/api/admin/usuarios/<id>/alterar-status` existe (precisa criar no backend)
        
        if (action === 'block') {
            endpoint = `/api/admin/usuarios/${selectedClientForAction.id_usuario}/alterar-status`;
            payload.novo_status = 'BLOQUEADO';
        } else if (action === 'unblock') {
            endpoint = `/api/admin/usuarios/${selectedClientForAction.id_usuario}/alterar-status`;
            payload.novo_status = 'ATIVO';
        } else {
            console.warn('Ação desconhecida no cliente:', action);
            return;
        }
        
        confirmActionButton.disabled = true;
        confirmActionButton.textContent = 'Processando...';

        fetch(endpoint, fetchConfig('PUT', payload)) // Usar PUT para alterar status
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || `Erro ao ${action} cliente`) });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message || `Cliente ${action === 'block' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
            closeClientModal();
            fetchClients(); 
        })
        .catch(error => {
            console.error(`Erro ao ${action} cliente:`, error);
            alert(`Erro: ${error.message}`);
        })
        .finally(() => {
            confirmActionButton.disabled = false;
        });
    });
    
    // Tradutores (copiar ou importar de admin-panel-script.js se forem globais)
    function traduzirSituacao(situacao) {
        const situacoes = { 'ATIVO': 'Ativo', 'PENDENTE_APROVACAO': 'Pendente', 'BLOQUEADO': 'Bloqueado', 'INATIVO': 'Inativo' };
        return situacoes[situacao] || situacao || 'N/A';
    }
     function traduzirIdentidadeGenero(id) { /* ... (copiar) ... */ return id || 'N/A';}
     function traduzirOrientacaoSexual(id) { /* ... (copiar) ... */ return id || 'N/A';}


    applyFiltersButton.addEventListener('click', fetchClients);
    modalCloseButton.addEventListener('click', closeClientModal);
    cancelActionButton.addEventListener('click', closeClientModal);
    window.addEventListener('click', (event) => {
        if (event.target === actionModal) closeClientModal();
    });

    fetchClients(); // Carga inicial
});