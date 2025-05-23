// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Dados de exemplo para profissionais
    const profissionais = {
        saude: [
            { id: 1, nome: 'Dr. Rafael Chaves', especialidade: 'Psicólogo', avatar: 'RC', rating: 4.9 },
            { id: 2, nome: 'Dra. Maria Silva', especialidade: 'Nutricionista', avatar: 'MS', rating: 4.7 },
            { id: 3, nome: 'Dr. João Santos', especialidade: 'Fisioterapeuta', avatar: 'JS', rating: 4.8 }
        ],
        juridico: [
            { id: 4, nome: 'Dr. Carlos Mendes', especialidade: 'Advogado Civil', avatar: 'CM', rating: 4.6 },
            { id: 5, nome: 'Dra. Ana Oliveira', especialidade: 'Advogada Trabalhista', avatar: 'AO', rating: 4.9 }
        ],
        carreira: [
            { id: 6, nome: 'Paulo Ribeiro', especialidade: 'Coach de Carreira', avatar: 'PR', rating: 4.5 },
            { id: 7, nome: 'Fernanda Lima', especialidade: 'Consultora RH', avatar: 'FL', rating: 4.8 }
        ],
        contabil: [
            { id: 8, nome: 'Roberto Alves', especialidade: 'Contador', avatar: 'RA', rating: 4.7 },
            { id: 9, nome: 'Juliana Costa', especialidade: 'Consultora Financeira', avatar: 'JC', rating: 4.6 }
        ],
        'assistencia-social': [
            { id: 10, nome: 'Mariana Souza', especialidade: 'Assistente Social', avatar: 'MS', rating: 4.9 },
            { id: 11, nome: 'Pedro Gomes', especialidade: 'Psicólogo Social', avatar: 'PG', rating: 4.8 }
        ]
    };
    
    // Variáveis para armazenar a seleção do usuário
    let selectedService = null;
    let selectedProfessional = null;
    let selectedDate = null;
    let selectedTime = null;
    
    // Seleção de elementos
    const serviceCards = document.querySelectorAll('.service-card');
    const professionalModal = document.getElementById('professional-modal');
    const datetimeModal = document.getElementById('datetime-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const professionalsList = document.getElementById('professionals-list');
    const searchProfessional = document.getElementById('search-professional');
    const selectedProfessionalInfo = document.getElementById('selected-professional-info');
    const calendarElement = document.getElementById('calendar');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const timeSlotsContainer = document.querySelector('.slots-container');
    const confirmAppointmentButton = document.getElementById('confirm-appointment');
    const confirmationDetails = document.getElementById('confirmation-details');
    const backToHomeButton = document.getElementById('back-to-home');
    
    // Data atual
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Event listeners para os cards de serviço
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            selectedService = this.getAttribute('data-service');
            openProfessionalModal(selectedService);
        });
    });
    
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
    
    // Função para abrir o modal de seleção de profissional
    function openProfessionalModal(service) {
        // Limpa a busca
        if (searchProfessional) {
            searchProfessional.value = '';
        }
        
        // Renderiza a lista de profissionais para o serviço selecionado
        renderProfessionalsList(service);
        
        // Abre o modal
        professionalModal.style.display = 'block';
    }
    
    // Função para renderizar a lista de profissionais
    function renderProfessionalsList(service) {
        // Limpa a lista
        professionalsList.innerHTML = '';
        
        // Verifica se há profissionais para o serviço selecionado
        if (!profissionais[service] || profissionais[service].length === 0) {
            professionalsList.innerHTML = '<p class="no-results">Nenhum profissional encontrado para este serviço.</p>';
            return;
        }
        
        // Adiciona cada profissional à lista
        profissionais[service].forEach(professional => {
            const card = document.createElement('div');
            card.className = 'professional-card';
            card.setAttribute('data-id', professional.id);
            card.innerHTML = `
                <div class="professional-avatar">${professional.avatar}</div>
                <div class="professional-info">
                    <h3>${professional.nome}</h3>
                    <p>${professional.especialidade}</p>
                </div>
                <div class="professional-rating">★ ${professional.rating}</div>
            `;
            
            // Event listener para selecionar o profissional
            card.addEventListener('click', function() {
                selectedProfessional = professional;
                closeModal(professionalModal);
                openDatetimeModal();
            });
            
            professionalsList.appendChild(card);
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
        
        // Renderiza o calendário
        renderCalendar();
        
        // Limpa a seleção de horário
        selectedTime = null;
        
        // Abre o modal
        datetimeModal.style.display = 'block';
    }
    
    // Função para renderizar as informações do profissional selecionado
    function renderSelectedProfessional() {
        selectedProfessionalInfo.innerHTML = `
            <div class="professional-avatar">${selectedProfessional.avatar}</div>
            <div class="professional-info">
                <h3>${selectedProfessional.nome}</h3>
                <p>${selectedProfessional.especialidade}</p>
            </div>
            <div class="professional-rating">★ ${selectedProfessional.rating}</div>
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
                    renderTimeSlots();
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
    
    // Função para renderizar os horários disponíveis
    function renderTimeSlots() {
        // Limpa os horários
        timeSlotsContainer.innerHTML = '';
        
        // Horários de exemplo (em um sistema real, esses horários viriam de uma API)
        const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
        
        // Adiciona cada horário
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;
            
            // Simula alguns horários indisponíveis aleatoriamente
            const isAvailable = Math.random() > 0.3;
            
            if (!isAvailable) {
                slot.classList.add('disabled');
            } else {
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
            }
            
            timeSlotsContainer.appendChild(slot);
        });
    }
    
    // Função para confirmar o agendamento
    function confirmAppointment() {
        // Fecha o modal de data e hora
        closeModal(datetimeModal);
        
        // Renderiza os detalhes da confirmação
        renderConfirmationDetails();
        
        // Abre o modal de confirmação
        confirmationModal.style.display = 'block';
    }
    
    // Função para renderizar os detalhes da confirmação
    function renderConfirmationDetails() {
        // Formata a data para exibição
        const formattedDate = formatDateForDisplay(selectedDate);
        
        confirmationDetails.innerHTML = `
            <p><strong>Serviço:</strong> ${getServiceName(selectedService)}</p>
            <p><strong>Profissional:</strong> ${selectedProfessional.nome}</p>
            <p><strong>Especialidade:</strong> ${selectedProfessional.especialidade}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${selectedTime}</p>
            <p><strong>Código de agendamento:</strong> #${generateAppointmentCode()}</p>
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
    
    // Função para obter o nome do serviço
    function getServiceName(serviceCode) {
        const serviceNames = {
            'saude': 'Saúde',
            'juridico': 'Jurídico',
            'carreira': 'Carreira',
            'contabil': 'Contábil',
            'assistencia-social': 'Assistência Social'
        };
        
        return serviceNames[serviceCode] || serviceCode;
    }
    
    // Função para gerar um código de agendamento aleatório
    function generateAppointmentCode() {
        return Math.floor(100000 + Math.random() * 900000);
    }
});