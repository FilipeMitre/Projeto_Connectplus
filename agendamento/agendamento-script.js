// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Dados de exemplo para serviços (baseados na tabela servicos do banco de dados)
    const servicos = {
        saude: [
            { id: 1, nome: 'Consulta Médica', descricao: 'Consulta clínica geral', categoria: 'saude', duracao: 30 },
            { id: 2, nome: 'Consulta Psicológica', descricao: 'Atendimento psicológico', categoria: 'saude', duracao: 45 },
            { id: 3, nome: 'Fisioterapia', descricao: 'Sessão de fisioterapia', categoria: 'saude', duracao: 60 }
        ],
        juridico: [
            { id: 4, nome: 'Consulta Jurídica Civil', descricao: 'Orientação em direito civil', categoria: 'juridico', duracao: 45 },
            { id: 5, nome: 'Consulta Jurídica Trabalhista', descricao: 'Orientação em direito trabalhista', categoria: 'juridico', duracao: 45 }
        ],
        contabil: [
            { id: 6, nome: 'Consultoria Contábil', descricao: 'Orientação contábil geral', categoria: 'contabil', duracao: 30 },
            { id: 7, nome: 'Planejamento Financeiro', descricao: 'Consultoria financeira', categoria: 'contabil', duracao: 60 }
        ],
        outros: [
            { id: 8, nome: 'Coaching de Carreira', descricao: 'Orientação profissional', categoria: 'outros', duracao: 60 },
            { id: 9, nome: 'Assistência Social', descricao: 'Suporte e orientação social', categoria: 'outros', duracao: 45 }
        ]
    };
    
    // Dados de exemplo para profissionais (baseados nas tabelas usuario, atendente e atendente_servico)
    const profissionais = {
        saude: [
            { id: 1, nome: 'Dr. Rafael Chaves', especialidade: 'Psicólogo', avatar: 'RC', rating: 4.9, servicos: [2] },
            { id: 2, nome: 'Dra. Maria Silva', especialidade: 'Nutricionista', avatar: 'MS', rating: 4.7, servicos: [1] },
            { id: 3, nome: 'Dr. João Santos', especialidade: 'Fisioterapeuta', avatar: 'JS', rating: 4.8, servicos: [3] }
        ],
        juridico: [
            { id: 4, nome: 'Dr. Carlos Mendes', especialidade: 'Advogado Civil', avatar: 'CM', rating: 4.6, servicos: [4] },
            { id: 5, nome: 'Dra. Ana Oliveira', especialidade: 'Advogada Trabalhista', avatar: 'AO', rating: 4.9, servicos: [5] }
        ],
        contabil: [
            { id: 8, nome: 'Roberto Alves', especialidade: 'Contador', avatar: 'RA', rating: 4.7, servicos: [6] },
            { id: 9, nome: 'Juliana Costa', especialidade: 'Consultora Financeira', avatar: 'JC', rating: 4.6, servicos: [7] }
        ],
        outros: [
            { id: 6, nome: 'Paulo Ribeiro', especialidade: 'Coach de Carreira', avatar: 'PR', rating: 4.5, servicos: [8] },
            { id: 10, nome: 'Mariana Souza', especialidade: 'Assistente Social', avatar: 'MS', rating: 4.9, servicos: [9] }
        ]
    };
    
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
    
    // Data atual
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Event listeners para os cards de serviço
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            selectedServiceCategory = this.getAttribute('data-service');
            openProfessionalModal(selectedServiceCategory);
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
    function openProfessionalModal(serviceCategory) {
        // Limpa a busca
        if (searchProfessional) {
            searchProfessional.value = '';
        }
        
        // Renderiza a lista de profissionais para a categoria de serviço selecionada
        renderProfessionalsList(serviceCategory);
        
        // Abre o modal
        professionalModal.style.display = 'block';
    }
    
    // Função para abrir o modal de seleção de serviço
    function openServiceModal(professional) {
        // Renderiza a lista de serviços oferecidos pelo profissional
        renderServicesList(professional);
        
        // Abre o modal
        serviceModal.style.display = 'block';
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
                
                // Se o profissional oferece apenas um serviço, selecioná-lo automaticamente
                if (professional.servicos.length === 1) {
                    const servicoId = professional.servicos[0];
                    // Encontrar o objeto de serviço correspondente
                    for (const categoria in servicos) {
                        const servicoEncontrado = servicos[categoria].find(s => s.id === servicoId);
                        if (servicoEncontrado) {
                            selectedServiceObject = servicoEncontrado;
                            break;
                        }
                    }
                    openDatetimeModal();
                } else {
                    // Se oferece múltiplos serviços, abrir modal de seleção de serviço
                    openServiceModal(professional);
                }
            });
            
            professionalsList.appendChild(card);
        });
    }
    
    // Função para renderizar a lista de serviços
    function renderServicesList(professional) {
        // Limpa a lista
        servicesList.innerHTML = '';
        
        // Obtém os IDs dos serviços oferecidos pelo profissional
        const servicosIds = professional.servicos;
        
        // Lista para armazenar os objetos de serviço
        const servicosDisponiveis = [];
        
        // Encontra os objetos de serviço correspondentes
        for (const categoria in servicos) {
            servicos[categoria].forEach(servico => {
                if (servicosIds.includes(servico.id)) {
                    servicosDisponiveis.push(servico);
                }
            });
        }
        
        // Verifica se há serviços disponíveis
        if (servicosDisponiveis.length === 0) {
            servicesList.innerHTML = '<p class="no-results">Nenhum serviço disponível para este profissional.</p>';
            return;
        }
        
        // Adiciona cada serviço à lista
        servicosDisponiveis.forEach(servico => {
            const card = document.createElement('div');
            card.className = 'service-list-card';
            card.setAttribute('data-id', servico.id);
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
        selectedProfessionalInfo.innerHTML = `
            <div class="professional-avatar">${selectedProfessional.avatar}</div>
            <div class="professional-info">
                <h3>${selectedProfessional.nome}</h3>
                <p>${selectedProfessional.especialidade}</p>
            </div>
            <div class="professional-rating">★ ${selectedProfessional.rating}</div>
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
        
        // Cria o objeto de agendamento conforme a estrutura do banco de dados
        const appointmentData = {
            id_usuario: 1, // ID do usuário logado (em um sistema real, viria da sessão)
            id_atendente: selectedProfessional.id,
            id_servico: selectedServiceObject.id,
            data_horario: `${selectedDate}T${selectedTime}:00`,
            situacao: 'pendente'
        };
        
        console.log('Dados do agendamento:', appointmentData);
        
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
            <p><strong>Serviço:</strong> ${selectedServiceObject.nome}</p>
            <p><strong>Profissional:</strong> ${selectedProfessional.nome}</p>
            <p><strong>Especialidade:</strong> ${selectedProfessional.especialidade}</p>
            <p><strong>Data:</strong> ${formattedDate}</p>
            <p><strong>Horário:</strong> ${selectedTime}</p>
            <p><strong>Duração:</strong> ${selectedServiceObject.duracao} minutos</p>
            <p><strong>Código de agendamento:</strong> #${generateAppointmentCode()}</p>
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
    
    // Função para gerar um código de agendamento aleatório
    function generateAppointmentCode() {
        return Math.floor(100000 + Math.random() * 900000);
    }
});
