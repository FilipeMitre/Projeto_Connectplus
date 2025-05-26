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
            
            console.log('Dados de login:', loginData);
            
            // Simulação de verificação de login
            // Em um ambiente real, isso seria uma chamada de API para verificar as credenciais
            let redirectUrl = '';
            let mensagem = '';
            
            // Simulação de diferentes tipos de usuário e situações
            if (tipoUsuarioSelecionado === 'usuario') {
                // Verificar se é um usuário comum
                if (email === 'usuario@example.com' && senha === 'senha123') {
                    redirectUrl = '../index.html';
                    mensagem = 'Login de usuário realizado com sucesso!';
                }
            } else if (tipoUsuarioSelecionado === 'atendente') {
                // Verificar se é um atendente
                if (email === 'atendente@example.com' && senha === 'senha123') {
                    // Verificar se o atendente está aprovado
                    const situacao = 'aprovado'; // Simulação - em um sistema real, viria do banco
                    
                    if (situacao === 'aprovado') {
                        redirectUrl = '../atendente/dashboard.html';
                        mensagem = 'Login de atendente realizado com sucesso!';
                    } else if (situacao === 'pendente') {
                        mensagem = 'Seu cadastro ainda está em análise. Por favor, aguarde a aprovação.';
                    } else if (situacao === 'bloqueado') {
                        mensagem = 'Seu cadastro foi bloqueado. Entre em contato com o suporte.';
                    }
                }
            } else if (tipoUsuarioSelecionado === 'admin') {
                // Verificar se é um administrador
                if (email === 'admin@example.com' && senha === 'admin123') {
                    redirectUrl = '../admin-panel/admin-panel.html';
                    mensagem = 'Login de administrador realizado com sucesso!';
                }
            }
            
            if (redirectUrl) {
                // Login bem-sucedido
                alert(mensagem);
                
                // Redirecionar para a página apropriada
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                // Login falhou
                alert('Email ou senha incorretos, ou tipo de usuário inválido.');
            }
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
            
            // Simulação de envio de email de recuperação
            alert(`Um email de recuperação de senha foi enviado para ${email}. Por favor, verifique sua caixa de entrada.`);
        });
    }
});
