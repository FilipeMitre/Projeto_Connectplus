// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Dados de exemplo para atendentes pendentes
    const atendentes = [
        { id: 1, nome: 'Rafael Chaves', email: 'rafael@gmail.com', documento: 'CRP12345', raio: '10 KM', status: 'pendente', area: 'saude' },
        { id: 2, nome: 'Maria Silva', email: 'maria@gmail.com', documento: 'CRP67890', raio: '15 KM', status: 'pendente', area: 'juridico' },
        { id: 3, nome: 'João Santos', email: 'joao@gmail.com', documento: 'CRP54321', raio: '20 KM', status: 'pendente', area: 'carreira' },
        { id: 4, nome: 'Ana Oliveira', email: 'ana@gmail.com', documento: 'CRP98765', raio: '5 KM', status: 'pendente', area: 'contabil' },
        { id: 5, nome: 'Carlos Mendes', email: 'carlos@gmail.com', documento: 'CRP45678', raio: '12 KM', status: 'pendente', area: 'assistencia-social' }
    ];
    
    // Seleção de elementos
    const areaFilter = document.getElementById('area-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    const updateButton = document.getElementById('update-list');
    const attendantsList = document.getElementById('attendants-list');
    
    // Função para renderizar a lista de atendentes
    function renderAttendants(attendantsData) {
        // Limpa a tabela
        attendantsList.innerHTML = '';
        
        // Verifica se há atendentes para exibir
        if (attendantsData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">Nenhum atendente encontrado</td>`;
            attendantsList.appendChild(emptyRow);
            return;
        }
        
        // Adiciona cada atendente à tabela
        attendantsData.forEach(attendant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${attendant.nome}</td>
                <td>${attendant.email}</td>
                <td>${attendant.documento}</td>
                <td>${attendant.raio}</td>
                <td class="actions-cell">
                    <button class="approve-button" data-id="${attendant.id}">Aprovar</button>
                    <button class="reject-button" data-id="${attendant.id}">Reprovar</button>
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
                const attendantId = this.getAttribute('data-id');
                approveAttendant(attendantId);
            });
        });
        
        // Botões de reprovação
        const rejectButtons = document.querySelectorAll('.reject-button');
        rejectButtons.forEach(button => {
            button.addEventListener('click', function() {
                const attendantId = this.getAttribute('data-id');
                rejectAttendant(attendantId);
            });
        });
    }
    
    // Função para aprovar um atendente
    function approveAttendant(id) {
        // Encontra o atendente pelo ID
        const index = atendentes.findIndex(a => a.id == id);
        
        if (index !== -1) {
            // Atualiza o status do atendente
            atendentes[index].status = 'aprovado';
            
            // Exibe mensagem de sucesso
            alert(`Atendente ${atendentes[index].nome} aprovado com sucesso!`);
            
            // Atualiza a lista
            filterAttendants();
        }
    }
    
    // Função para reprovar um atendente
    function rejectAttendant(id) {
        // Encontra o atendente pelo ID
        const index = atendentes.findIndex(a => a.id == id);
        
        if (index !== -1) {
            // Atualiza o status do atendente
            atendentes[index].status = 'reprovado';
            
            // Exibe mensagem de sucesso
            alert(`Atendente ${atendentes[index].nome} reprovado.`);
            
            // Atualiza a lista
            filterAttendants();
        }
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
            const areaMatch = !areaValue || attendant.area === areaValue;
            
            // Filtro de status
            const statusMatch = !statusValue || attendant.status === statusValue;
            
            // Filtro de busca
            const searchMatch = !searchValue || 
                attendant.nome.toLowerCase().includes(searchValue) || 
                attendant.email.toLowerCase().includes(searchValue);
            
            return areaMatch && statusMatch && searchMatch;
        });
        
        // Renderiza os atendentes filtrados
        renderAttendants(filteredAttendants);
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
    
    // Inicializa a tabela com todos os atendentes
    renderAttendants(atendentes);
});