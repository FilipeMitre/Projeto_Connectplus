// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Seleção de elementos
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    
    // Funcionalidade para as abas de tipo de usuário
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe active de todos os botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe active ao botão clicado
            this.classList.add('active');
            
            // Obtém o tipo de usuário (cliente ou atendente)
            const userType = this.getAttribute('data-tab');
            console.log(`Tipo de usuário selecionado: ${userType}`);
            
            // Aqui você pode personalizar o formulário com base no tipo de usuário
            // Por exemplo, adicionar campos específicos para atendentes
        });
    });
    
    // Manipulação do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obter os valores dos campos
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Verificar se os campos estão preenchidos
            if (!email || !password) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            // Aqui você pode adicionar a lógica de autenticação
            // Por exemplo, enviar os dados para um servidor
            console.log('Tentativa de login com:', { email, password });
            
            // Simulação de login bem-sucedido
            alert('Login realizado com sucesso! Redirecionando...');
            
            // Redirecionar para a página inicial após o login
            // window.location.href = 'index.html';
        });
    }
    
    // Link "Esqueci senha"
    const forgotPasswordLink = document.querySelector('.forgot-password a');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Funcionalidade de recuperação de senha em desenvolvimento.');
        });
    }
});