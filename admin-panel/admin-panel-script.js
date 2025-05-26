// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Dados de exemplo para atendentes (baseados nas tabelas usuario e atendente)
    const atendentes = [
        { 
            id_usuario: 1, 
            nome: 'Rafael Chaves', 
            email: 'rafael@gmail.com', 
            cpf: '123.456.789-01', 
            genero: 'masculino',
            qualificacao: 'Psicólogo com especialização em terapia cognitivo-comportamental',
            area: 'saude', 
            situacao: 'pendente',
            data_criacao: '2025-05-10T14:30:00Z'
        },
        { 
            id_usuario: 2, 
            nome: 'Maria Silva', 
            email: 'maria@gmail.com', 
            cpf: '987.654.321-09', 
            genero: 'feminino',
            qualificacao: 'Advogada com OAB ativa e especialização em direito civil',
            area: 'juridico', 
            situacao: 'pendente',
            data_criacao: '2025-05-11T09:45:00Z'
        },
        { 
            id_usuario: 3, 
            nome: 'João Santos', 
            email: 'joao@gmail.com', 
            cpf: '456.789.123-45', 
            genero: 'masculino',
            qualificacao: 'Consultor de carreira com 10 anos de experiência',
            area: 'outros', 
            situacao: 'pendente',
            data_criacao: '2025-05-12T16:20:00Z'
        },
        { 
            id_usuario: 4, 
            nome: 'Ana Oliveira', 
            email: 'ana@gmail.com', 
            cpf: '789.123.456-78', 
            genero: 'feminino',
            qualificacao: 'Contadora com CRC ativo',
            area: 'contabil', 
            situacao: 'pendente',
            data_criacao: '2025-05-13T11:15:00Z'
        },
        { 
            id_usuario: 5, 
            nome: 'Carlos Mendes', 
            email: 'carlos@gmail.com', 
            cpf: '321.654.987-32', 
            genero: 'masculino',
            qualificacao: 'Assistente Social com registro no CRESS',
            area: 'outros', 
            situacao: 'pendente',
            data_criacao: '2025-05-14T13:40:00Z'
        }
    ];
    
    // ID do administrador logado (em um sistema real, viria da sessão)
    const adminId = 10;
    
    // Seleção de elementos
    const areaFilter = document.getElementById('area-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    const updateButton = document.getElementById('update-list');
    const attendantsList = document.getElementById('attendants-list');
    const actionModal = document.getElementById('action-modal');
    const modalTitle = document.getElementById('modal-title');
    const attendantDetails = document.getElementById('attendant-details');
    const actionReason = document.getElementById('action-reason');
    const confirmActionButton = document.getElementById('confirm-action');
    const cancelActionButton = document.getElementById('cancel-action');
    const closeButton = document.querySelector('.close-button');
    
    // Variáveis de estado
    let selectedAttendant = null;
    let actionType = null; // 'approve' ou 'reject'
    
    // Função para renderizar a lista de atendentes
    function renderAttendants(attendantsData) {
        // Limpa a tabela
        attendantsList.innerHTML = '';
        
        // Verifica se há atendentes para exibir
        if (attendantsData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="8" style="text-align: center;">Nenhum atendente encontrado</td>`;
            attendantsList.appendChild(emptyRow);
            return;
        }
        
        // Adiciona cada atendente à tabela
        attendantsData.forEach(attendant => {
            // Formatar a data de criação
            const dataCriacao = new Date(attendant.data_criacao);
            const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' ' + 
                                 dataCriacao.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            
            // Traduzir área
            const areaTraduzida = traduzirArea(attendant.area);
            
            // Traduzir status
            const statusTraduzido = traduzirStatus(attendant.situacao);
            const statusClass = `status-${attendant.situacao}`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${attendant.nome}</td>
                <td>${attendant.email}</td>
                <td>${attendant.cpf}</td>
                <td>${areaTraduzida}</td>
                <td>${attendant.qualificacao}</td>
                <td>${dataFormatada}</td>
                <td><span class="${statusClass}">${statusTraduzido}</span></td>
                <td class="actions-cell">
                    ${attendant.situacao === 'pendente' ? `
                        <button class="approve-button" data-id="${attendant.id_usuario}">Aprovar</button>
                        <button class="reject-button" data-id="${attendant.id_usuario}">Reprovar</button>
                    ` : `
                        <button class="view-button" data-id="${attendant.id_usuario}">Visualizar</button>
                    `}
                </td>
            `;
            attendantsList.appendChild(row);
        });
        
        // Adiciona event listeners aos botões de ação
        addActionButtonListeners();
    }
    
    // Função para adicionar event listeners aos botões de ação
    function addActionButtonListeners() {
        // Botões de aprovação
        const approveButtons = document.querySelectorAll('.approve-button');
        approveButtons.forEach(button => {
            button.addEventListener('click', function() {
                const attendantId = parseInt(this.getAttribute('data-id'));
                openActionModal('approve', attendantId);
            });
        });
        
        // Botões de reprovação
        const rejectButtons = document.querySelectorAll('.reject-button');
        rejectButtons.forEach(button => {
            button.addEventListener('click', function() {
                const attendantId = parseInt(this.getAttribute('data-id'));
                openActionModal('reject', attendantId);
            });
        });
        
        // Botões de visualização
        const viewButtons = document.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const attendantId = parseInt(this.getAttribute('data-id'));
                openActionModal('view', attendantId);
            });
        });
    }
    
    // Função para abrir o modal de ação
    function openActionModal(action, attendantId) {
        // Encontra o atendente pelo ID
        const attendant = atendentes.find(a => a.id_usuario === attendantId);
        
        if (!attendant) {
            alert('Atendente não encontrado.');
            return;
        }
        
        // Armazena o atendente selecionado e o tipo de ação
        selectedAttendant = attendant;
        actionType = action;
        
        // Configura o título do modal
        if (action === 'approve') {
            modalTitle.textContent = 'Aprovar Atendente';
            confirmActionButton.textContent = 'Aprovar';
            confirmActionButton.className = 'confirm-button approve';
            actionReason.style.display = 'block';
            document.querySelector('label[for="action-reason"]').style.display = 'block';
            confirmActionButton.style.display = 'block';
        } else if (action === 'reject') {
            modalTitle.textContent = 'Reprovar Atendente';
            confirmActionButton.textContent = 'Reprovar';
            confirmActionButton.className = 'confirm-button reject';
            actionReason.style.display = 'block';
            document.querySelector('label[for="action-reason"]').style.display = 'block';
            confirmActionButton.style.display = 'block';
        } else {
            modalTitle.textContent = 'Detalhes do Atendente';
            actionReason.style.display = 'none';
            document.querySelector('label[for="action-reason"]').style.display = 'none';
            confirmActionButton.style.display = 'none';
        }
        
        // Preenche os detalhes do atendente
        const areaTraduzida = traduzirArea(attendant.area);
        const generoTraduzido = traduzirGenero(attendant.genero);
        const dataCriacao = new Date(attendant.data_criacao);
        const dataFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' ' + 
                             dataCriacao.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        
        attendantDetails.innerHTML = `
            <p><strong>Nome:</strong> ${attendant.nome}</p>
            <p><strong>Email:</strong> ${attendant.email}</p>
            <p><strong>CPF:</strong> ${attendant.cpf}</p>
            <p><strong>Gênero:</strong> ${generoTraduzido}</p>
            <p><strong>Área de Atuação:</strong> ${areaTraduzida}</p>
            <p><strong>Qualificação:</strong> ${attendant.qualificacao}</p>
            <p><strong>Data de Cadastro:</strong> ${dataFormatada}</p>
            <p><strong>Status:</strong> <span class="status-${attendant.situacao}">${traduzirStatus(attendant.situacao)}</span></p>
        `;
        
        // Limpa o campo de motivo
        actionReason.value = '';
        
        // Exibe o modal
        actionModal.style.display = 'block';
    }
    
    // Função para fechar o modal
    function closeModal() {
        actionModal.style.display = 'none';
    }
    
    // Função para confirmar a ação
    function confirmAction() {
        if (!selectedAttendant) {
            alert('Nenhum atendente selecionado.');
            return;
        }
        
        const reason = actionReason.value.trim();
        
        if (!reason && (actionType === 'approve' || actionType === 'reject')) {
            alert('Por favor, informe o motivo da ação.');
            return;
        }
        
        if (actionType === 'approve') {
            // Em um sistema real, aqui seria feita uma chamada à API para executar a procedure aprovar_atendente
            console.log(`Aprovando atendente ${selectedAttendant.id_usuario} com motivo: ${reason}`);
            
            // Simulação da procedure aprovar_atendente
            selectedAttendant.situacao = 'aprovado';
            
            // Simulação de inserção na tabela usuario_status_log
            const logEntry = {
                id_usuario: selectedAttendant.id_usuario,
                novo_status: 'aprovado',
                id_admin: adminId,
                motivo: reason,
                data_hora: new Date().toISOString()
            };
            
            console.log('Log de alteração de status:', logEntry);
            
            alert(`Atendente ${selectedAttendant.nome} aprovado com sucesso!`);
        } else if (actionType === 'reject') {
            // Em um sistema real, aqui seria feita uma chamada à API
            console.log(`Reprovando atendente ${selectedAttendant.id_usuario} com motivo: ${reason}`);
            
            // Simulação da atualização do status
            selectedAttendant.situacao = 'bloqueado';
            
            // Simulação de inserção na tabela usuario_status_log
            const logEntry = {
                id_usuario: selectedAttendant.id_usuario,
                novo_status: 'bloqueado',
                id_admin: adminId,
                motivo: reason,
                data_hora: new Date().toISOString()
            };
            
            console.log('Log de alteração de status:', logEntry);
            
            alert(`Atendente ${selectedAttendant.nome} reprovado.`);
        }
        
        // Fecha o modal
        closeModal();
        
        // Atualiza a lista
        filterAttendants();
    }
    
    // Função para filtrar atendentes
    function filterAttendants() {
        // Obtém os valores dos filtros
        const areaValue = areaFilter.value;
        const statusValue = statusFilter.value;
        const searchValue = searchInput.value.toLowerCase();
        
        // Filtra os atendentes
        const filteredAttendants = atendentes.filter(attendant => {
            // Filtro de área
            const areaMatch = !areaValue || areaValue === 'todos' || attendant.area === areaValue;
            
            // Filtro de status
            const statusMatch = !statusValue || statusValue === 'todos' || attendant.situacao === statusValue;
            
            // Filtro de busca
            const searchMatch = !searchValue || 
                attendant.nome.toLowerCase().includes(searchValue) || 
                attendant.email.toLowerCase().includes(searchValue);
            
            return areaMatch && statusMatch && searchMatch;
        });
        
        // Renderiza os atendentes filtrados
        renderAttendants(filteredAttendants);
    }
    
    // Função para traduzir área
    function traduzirArea(area) {
        const areas = {
            'saude': 'Saúde',
            'juridico': 'Jurídico',
            'contabil': 'Contábil',
            'outros': 'Outros'
        };
        return areas[area] || area;
    }
    
    // Função para traduzir status
    function traduzirStatus(status) {
        const statusMap = {
            'pendente': 'Pendente',
            'aprovado': 'Aprovado',
            'bloqueado': 'Bloqueado'
        };
        return statusMap[status] || status;
    }
    
    // Função para traduzir gênero
    function traduzirGenero(genero) {
        const generoMap = {
            'masculino': 'Masculino',
            'feminino': 'Feminino',
            'outro': 'Outro',
            'prefiro_nao_informar': 'Prefiro não informar'
        };
        return generoMap[genero] || genero;
    }
    
    // Event listener para o botão de atualizar lista
    if (updateButton) {
        updateButton.addEventListener('click', filterAttendants);
    }
    
    // Event listener para o campo de busca
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            // Atualiza a lista ao digitar
            filterAttendants();
        });
    }
    
    // Event listeners para os selects de filtro
    if (areaFilter) {
        areaFilter.addEventListener('change', filterAttendants);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAttendants);
    }
    
    // Event listeners para os botões do modal
    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', confirmAction);
    }
    
    if (cancelActionButton) {
        cancelActionButton.addEventListener('click', closeModal);
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Inicializa a tabela com todos os atendentes
    renderAttendants(atendentes);
});
