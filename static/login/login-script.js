// static/login/login-script.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const loginMessagesDiv = document.getElementById('login-messages');
    const loginSubmitButton = document.getElementById('login-submit-button');

    const currentYearSpanFooter = document.getElementById('currentYearFooterLogin');
    if (currentYearSpanFooter) {
        currentYearSpanFooter.textContent = new Date().getFullYear();
    }

    // Verifica se já está logado, se sim, redireciona para o painel apropriado
    const token = localStorage.getItem('amadoAuthToken');
    const userType = localStorage.getItem('amadoUserType');
    const userStatus = localStorage.getItem('amadoUserStatus');
    
    if (token && userType) {
        redirectToPanel(userType, userStatus);
        return; // Impede a renderização da página de login se já logado
    }

    function mostrarMensagemLogin(mensagem, tipo = 'error') {
        loginMessagesDiv.textContent = mensagem;
        loginMessagesDiv.className = `form-messages ${tipo}`; // Certifique-se que tem estilos para .error e .success
        loginMessagesDiv.style.display = 'block';
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginMessagesDiv.style.display = 'none';

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        if (!email || !senha) {
            mostrarMensagemLogin('Por favor, preencha email e senha.');
            return;
        }

        const originalButtonText = loginSubmitButton.textContent;
        loginSubmitButton.disabled = true;
        loginSubmitButton.textContent = 'Entrando...';

        fetch('/api/auth/login', { // Seu endpoint de login
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Email ou senha inválidos.');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.token && data.usuario) {
                console.log('Dados do usuário recebidos:', data.usuario); // Log para debug
                
                // Armazenar o token e informações do usuário no localStorage
                localStorage.setItem('amadoAuthToken', data.token);
                localStorage.setItem('amadoUserId', data.usuario.id_usuario);
                localStorage.setItem('amadoUserType', data.usuario.tipo_usuario); // CLIENTE, ATENDENTE, ADMIN
                localStorage.setItem('amadoUserName', data.usuario.nome_completo);
                localStorage.setItem('amadoUserEmail', data.usuario.email);
                localStorage.setItem('amadoUserStatus', data.usuario.situacao); // Salvar a situação do usuário

                // Verificar se há um redirecionamento pendente
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');

                if (redirectUrl) {
                    window.location.href = redirectUrl; // Redireciona para a URL original
                } else {
                    redirectToPanel(data.usuario.tipo_usuario, data.usuario.situacao); // Redireciona para o painel padrão
                }
            } else {
                mostrarMensagemLogin('Resposta inesperada do servidor.');
            }
        })
        .catch(error => {
            console.error('Erro no login:', error);
            mostrarMensagemLogin(error.message || 'Ocorreu um erro. Tente novamente.');
        })
        .finally(() => {
            loginSubmitButton.disabled = false;
            loginSubmitButton.textContent = originalButtonText;
        });
    });

    function redirectToPanel(tipoUsuario, situacaoUsuario) {
        console.log(`Redirecionando usuário do tipo ${tipoUsuario} com situação ${situacaoUsuario}`);
        
        if (tipoUsuario === 'ADMIN') {
            window.location.href = '/static/admin/admin-panel.html';
        } else if (tipoUsuario === 'ATENDENTE') {
            // Verificar se o cadastro do atendente está ATIVO
            if (situacaoUsuario === 'PENDENTE_APROVACAO') {
                window.location.href = '/static/atendente/aguardando-aprovacao.html'; // Página de "Aguardando Aprovação"
            } else if (situacaoUsuario === 'BLOQUEADO') {
                window.location.href = '/static/atendente/conta-bloqueada.html';
            } else {
                window.location.href = '/static/atendente/minha-agenda.html'; // Painel principal do atendente
            }
        } else if (tipoUsuario === 'CLIENTE') {
            window.location.href = '/static/cliente/meus-agendamentos.html'; // Ou painel do cliente
        } else {
            window.location.href = '/static/index.html'; // Fallback
        }
    }
});