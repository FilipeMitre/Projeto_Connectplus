// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Obter token do localStorage (assumindo que foi salvo após o login)
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    // Redirecionar para a página de login se não houver token
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
    
    // Configuração para requisições fetch
    const fetchConfig = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    // Variáveis para armazenar dados
    let servicos = {};
    let profissionais = {};
    
    // Variáveis para armazenar a seleção do usuário
    let selectedService = null;
    let selectedServiceCategory = null;
    let selectedServiceObject = null;
    let selectedProfessional = null;
    let selectedDate = null;
    let selectedTime = null;
    
    // Seleção de elementos
    const serviceCards = document.querySelectorAll('.service-card');
    const professionalModal = document.getElementById('professional-modal');
    const serviceModal = document.getElementById('service-modal');
    const datetimeModal = document.getElementById('datetime-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const professionalsList = document.getElementById('professionals-list');
    const servicesList = document.getElementById('services-list');
    const searchProfessional = document.getElementById('search-professional');
    const selectedProfessionalInfo = document.getElementById('selected-professional-info');
    const selectedServiceInfo = document.getElementById('selected-service-info');
    const calendarElement = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const timeSlotsContainer = document.querySelector('.slots-container');
    const confirmAppointmentButton = document.getElementById('confirm-appointment');
    const confirmationDetails = document.getElementById('confirmation-details');
    const backToHomeButton = document.getElementById('back-to-home');
    
    // Carregar serviços ao iniciar
    carregarServicos();
    
    // Data atual
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Função para carregar serviços da API
    function carregarServicos() {
        fetch('/api/servicos', {
            ...fetchConfig,
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar serviços');
            }
            return response.json();
        })
        .then(data => {
            // Organizar serviços por categoria
            data.servicos.forEach(servico => {
                if (!servicos[servico.categoria]) {
                    servicos[servico.categoria] = [];
                }
                servicos[servico.categoria].push(servico);
            });
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar serviços. Tente novamente mais tarde.');
        });
    }
    
    // Event listeners para os cards de serviço
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            selectedServiceCategory = this.getAttribute('data-service');
            carregarProfissionais(selectedServiceCategory);
        });
    });
    
    // Função para carregar profissionais por categoria
    function carregarProfissionais(categoria) {
        // Mostrar indicador de carregamento
        professionalsList.innerHTML = '<p class="loading">Carregando profissionais...</p>';
        
        // Abrir o modal
        professionalModal.style.display = 'block';
        
        // Buscar profissionais da API
        fetch(`/api/atendentes?categoria=${categoria}&situacao=aprovado`, {
            ...fetchConfig,
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar profissionais');
            }
            return response.json();
        })
        .then(data => {
            // Armazenar profissionais
            profissionais[categoria] = data.atendentes;
            
            // Renderizar lista de profissionais
            renderProfessionalsList(categoria);
        })
        .catch(error => {
            console.error('Erro:', error);
            professionalsList.innerHTML = '<p class="no-results">Erro ao carregar profissionais. Tente novamente.</p>';
        });
    }
    
    // Event listeners para os botões de fechar modais
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Event listener para fechar modais clicando fora do conteúdo
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Event listener para busca de profissionais
    if (searchProfessional) {
        searchProfessional.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProfessionals(searchTerm);
        });
    }
    
    // Event listeners para navegação do calendário
    if (prevMonthButton) {
        prevMonthButton.addEventListener('click', function() {
            navigateMonth(-1);
        });
    }
    
    if (nextMonthButton) {
        nextMonthButton.addEventListener('click', function() {
            navigateMonth(1);
        });
    }
    
    // Event listener para o botão de confirmar agendamento
    if (confirmAppointmentButton) {
        confirmAppointmentButton.addEventListener('click', function() {
            if (selectedDate && selectedTime) {
                confirmAppointment();
            } else {
                alert('Por favor, selecione uma data e um horário.');
            }
        });
    }
    
    // Event listener para o botão de voltar para home
    if (backToHomeButton) {
        backToHomeButton.addEventListener('click', function() {
            window.location.href = '../index.html';
        });
    }
    
    // Função para renderizar a lista de profissionais
    function renderProfessionalsList(serviceCategory) {
        // Limpa a lista
        professionalsList.innerHTML = '';
        
        // Verifica se há profissionais para a categoria de serviço selecionada
        if (!profissionais[serviceCategory] || profissionais[serviceCategory].length === 0) {
            professionalsList.innerHTML = '<p class="no-results">Nenhum profissional encontrado para este serviço.</p>';
            return;
        }
        
        // Adiciona cada profissional à lista
        profissionais[serviceCategory].forEach(professional => {
            // Criar iniciais para o avatar
            const nomes = professional.nome.split(' ');
            const iniciais = nomes.length > 1 
                ? (nomes[0][0] + nomes[nomes.length-1][0]).toUpperCase()
                : nomes[0].substring(0, 2).toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'professional-card';
            card.setAttribute('data-id', professional.id_usuario);
            card.innerHTML = `
                <div class="professional-avatar">${iniciais}</div>
                <div class="professional-info">
                    <h3>${professional.nome}</h3>
                    <p>${professional.qualificacao.substring(0, 30)}${professional.qualificacao.length > 30 ? '...' : ''}</p>
                </div>
                <div class="professional-rating">★ ${professional.avaliacao_media.toFixed(1)}</div>
            `;
            
            // Event listener para selecionar o profissional
            card.addEventListener('click', function() {
                selectedProfessional = professional;
                closeModal(professionalModal);
                
                // Se o profissional oferece apenas um serviço, selecioná-lo automaticamente
                if (professional.servicos.length === 1) {
                    selectedServiceObject = professional.servicos[0];
                    openDatetimeModal();
                } else {
                    // Se oferece múltiplos serviços, abrir modal de seleção de serviço
                    openServiceModal(professional);
                }
            });
            
            professionalsList.appendChild(card);
        });
    }
    
    // Função para abrir o modal de seleção de serviço
    function openServiceModal(professional) {
        // Renderiza a lista de serviços oferecidos pelo profissional
        renderServicesList(professional);
        
        // Abre o modal
        serviceModal.style.display = 'block';
    }
    
    // Função para renderizar a lista de serviços
    function renderServicesList(professional) {
        // Limpa a lista
        servicesList.innerHTML = '';
        
        // Verifica se há serviços disponíveis
        if (!professional.servicos || professional.servicos.length === 0) {
            servicesList.innerHTML = '<p class="no-results">Nenhum serviço disponível para este profissional.</p>';
            return;
        }
        
        // Adiciona cada serviço à lista
        professional.servicos.forEach(servico => {
            const card = document.createElement('div');
            card.className = 'service-list-card';
            card.setAttribute('data-id', servico.id_servico);
            card.innerHTML = `
                <h3>${servico.nome}</h3>
                <p>${servico.descricao}</p>
                <p class="service-duration"><i class="far fa-clock"></i> ${servico.duracao} minutos</p>
            `;
            
            // Event listener para selecionar o serviço
            card.addEventListener('click', function() {
                selectedServiceObject = servico;
                closeModal(serviceModal);
                openDatetimeModal();
            });
            
            servicesList.appendChild(card);
        });
    }
    
    // Função para filtrar profissionais
    function filterProfessionals(searchTerm) {
        const professionalCards = document.querySelectorAll('.professional-card');
        
        professionalCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const specialty = card.querySelector('p').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || specialty.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Função para abrir o modal de seleção de data e hora
    function openDatetimeModal() {
        // Renderiza as informações do profissional selecionado
        renderSelectedProfessional();
        
        // Renderiza as informações do serviço selecionado
        renderSelectedService();
        
        // Renderiza o calendário
        renderCalendar();
        
        // Limpa a seleção de horário
        selectedTime = null;
        
        // Abre o modal
        datetimeModal.style.display = 'block';
    }
    
    // Função para renderizar as informações do profissional selecionado
    function renderSelectedProfessional() {
        // Criar iniciais para o avatar
        const nomes = selectedProfessional.nome.split(' ');
        const iniciais = nomes.length > 1 
            ? (nomes[0][0] + nomes[nomes.length-1][0]).toUpperCase()
            : nomes[0].substring(0, 2).toUpperCase();
            
        selectedProfessionalInfo.innerHTML = `
            <div class="professional-avatar">${iniciais}</div>
            <div class="professional-info">
                <h3>${selectedProfessional.nome}</h3>
                <p>${selectedProfessional.qualificacao.substring(0, 50)}${selectedProfessional.qualificacao.length > 50 ? '...' : ''}</p>
            </div>
            <div class="professional-rating">★ ${selectedProfessional.avaliacao_media.toFixed(1)}</div>
        `;
    }
    
    // Função para renderizar as informações do serviço selecionado
    function renderSelectedService() {
        selectedServiceInfo.innerHTML = `
            <div class="service-info">
                <h3>${selectedServiceObject.nome}</h3>
                <p>${selectedServiceObject.descricao}</p>
                <p class="service-duration"><i class="far fa-clock"></i> ${selectedServiceObject.duracao} minutos</p>
            </div>
        `;
    }
    
    // Função para renderizar o calendário
    function renderCalendar() {
        // Atualiza o título do mês
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Limpa o calendário
        calendarElement.innerHTML = '';
        
        // Adiciona os dias da semana
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day header';
            dayElement.textContent = day;
            calendarElement.appendChild(dayElement);
        });
        
        // Obtém o primeiro dia do mês
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDay = firstDay.getDay();
        
        // Obtém o número de dias no mês
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Adiciona células vazias para os dias antes do primeiro dia do mês
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarElement.appendChild(emptyDay);
        }
        
        // Adiciona os dias do mês
        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.setAttribute('data-date', formatDate(date));
            
            // Desabilita dias passados
            if (date < new Date().setHours(0, 0, 0, 0)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', function() {
                    // Remove a seleção anterior
                    document.querySelectorAll('.calendar-day.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                                        // Adiciona a seleção ao dia clicado
                    this.classList.add('selected');
                    
                    // Armazena a data selecionada
                    selectedDate = this.getAttribute('data-date');
                    
                    // Renderiza os horários disponíveis
                    carregarHorariosDisponiveis();
                });
            }
            
            calendarElement.appendChild(dayElement);
        }
    }
    
    // Função para navegar entre os meses
    function navigateMonth(direction) {
        currentMonth += direction;
        
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        } else if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        
        renderCalendar();
    }
    
    // Função para carregar horários disponíveis da API
    function carregarHorariosDisponiveis() {
        // Mostrar indicador de carregamento
        timeSlotsContainer.innerHTML = '<p class="loading">Carregando horários...</p>';
        
        // Chamar a API para obter horários disponíveis
        fetch(`/api/agendamentos/horarios-disponiveis?id_atendente=${selectedProfessional.id_usuario}&data=${selectedDate}`, {
            ...fetchConfig,
            method: 'GET'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar horários disponíveis');
            }
            return response.json();
        })
        .then(data => {
            renderTimeSlots(data.horarios_disponiveis);
        })
        .catch(error => {
            console.error('Erro:', error);
            timeSlotsContainer.innerHTML = '<p class="error">Erro ao carregar horários. Tente novamente.</p>';
        });
    }
    
    // Função para renderizar os horários disponíveis
    function renderTimeSlots(availableSlots) {
        // Limpa os horários
        timeSlotsContainer.innerHTML = '';
        
        // Verifica se há horários disponíveis
        if (!availableSlots || availableSlots.length === 0) {
            timeSlotsContainer.innerHTML = '<p class="no-results">Não há horários disponíveis para esta data.</p>';
            return;
        }
        
        // Adiciona cada horário
        availableSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            slot.addEventListener('click', function() {
                // Remove a seleção anterior
                document.querySelectorAll('.time-slot.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Adiciona a seleção ao horário clicado
                this.classList.add('selected');
                
                // Armazena o horário selecionado
                selectedTime = this.textContent;
            });
            
            timeSlotsContainer.appendChild(slot);
        });
    }
    
    // Função para confirmar o agendamento
    function confirmAppointment() {
        // Fecha o modal de data e hora
        closeModal(datetimeModal);
        
        // Cria o objeto de agendamento conforme a estrutura do banco de dados
        const appointmentData = {
            id_usuario: userId,
            id_atendente: selectedProfessional.id_usuario,
            id_servico: selectedServiceObject.id_servico,
            data_horario: `${selectedDate}T${selectedTime}:00`
        };
        
        // Envia o agendamento para a API
        fetch('/api/agendamentos', {
            ...fetchConfig,
            method: 'POST',
            body: JSON.stringify(appointmentData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao criar agendamento');
            }
            return response.json();
        })
        .then(data => {
            // Armazena o ID do agendamento
            appointmentData.id_agendamento = data.id_agendamento;
            
            // Renderiza os detalhes da confirmação
            renderConfirmationDetails(appointmentData);
            
            // Abre o modal de confirmação
            confirmationModal.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        });
    }
    
    // Função para renderizar os detalhes da confirmação
    function renderConfirmationDetails(appointmentData) {
        // Formata a data para exibição
        const formattedDate = formatDateForDisplay(selectedDate);
        
        confirmationDetails.innerHTML = `
            <p><strong>Serviço:</strong> ${selectedServiceObject.nome}</p>
            <p><strong>Profissional:</strong> ${selectedProfessional.nome}</p>
            <p><strong>Especialidade:</strong> ${selectedProfessional.qualificacao.split(' ')[0]}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${selectedTime}</p>
            <p><strong>Duração:</strong> ${selectedServiceObject.duracao} minutos</p>
            <p><strong>Código de agendamento:</strong> #${appointmentData.id_agendamento}</p>
            <p><strong>Status:</strong> Pendente de confirmação</p>
        `;
    }
    
    // Função para fechar um modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    // Função para formatar a data (YYYY-MM-DD)
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Função para formatar a data para exibição (DD/MM/YYYY)
    function formatDateForDisplay(dateString) {
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
});