// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Seleção de elementos
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    
    // Variável para armazenar o tipo de usuário selecionado
    let tipoUsuarioSelecionado = 'usuario'; // Valor padrão
    
    // Funcionalidade para as abas de tipo de usuário
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe active de todos os botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona a classe active ao botão clicado
            this.classList.add('active');
            
            // Obtém o tipo de usuário (usuario, atendente ou admin)
            tipoUsuarioSelecionado = this.getAttribute('data-tab');
            console.log(`Tipo de usuário selecionado: ${tipoUsuarioSelecionado}`);
        });
    });
    
    // Manipulação do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obter os valores dos campos
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            
            // Verificar se os campos estão preenchidos
            if (!email || !senha) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            // Criar objeto com os dados de login
            const loginData = {
                email: email,
                senha: senha,
                tipo_usuario: tipoUsuarioSelecionado
            };
            
            // Enviar dados para a API
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Erro ao realizar login');
                    });
                }
                return response.json();
            })
            .then(data => {
                // Armazenar o token e dados do usuário no localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userName', data.user.nome);
                localStorage.setItem('userType', data.user.tipo_usuario);
                
                // Redirecionar com base no tipo de usuário
                let redirectUrl = '../index.html';
                
                if (data.user.tipo_usuario === 'atendente') {
                    redirectUrl = '../atendente/dashboard.html';
                } else if (data.user.tipo_usuario === 'admin') {
                    redirectUrl = '../admin-panel/admin-panel.html';
                }
                
                alert('Login realizado com sucesso! Redirecionando...');
                
                // Redirecionar para a página apropriada
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            })
            .catch(error => {
                console.error('Erro:', error);
                alert(error.message);
            });
        });
    }
    
    // Link "Esqueci senha"
    const forgotPasswordLink = document.querySelector('.forgot-password a');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            
            if (!email) {
                alert('Por favor, informe seu email antes de solicitar a recuperação de senha.');
                return;
            }
            
            // Enviar solicitação de recuperação de senha
            fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao solicitar recuperação de senha. Tente novamente.');
            });
        });
    }
});