// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Seleção de elementos
    const tabButtons = document.querySelectorAll('.tab-button');
    const cadastroForm = document.getElementById('cadastro-form');
    const camposAtendente = document.getElementById('campos-atendente');
    
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
            
            // Mostra ou oculta os campos específicos para atendentes
            if (userType === 'atendente') {
                camposAtendente.style.display = 'block';
                
                // Torna os campos de atendente obrigatórios
                document.getElementById('area-atuacao').required = true;
                document.getElementById('documentos').required = true;
                document.getElementById('raio-atendimento').required = true;
            } else {
                camposAtendente.style.display = 'none';
                
                // Remove a obrigatoriedade dos campos de atendente
                document.getElementById('area-atuacao').required = false;
                document.getElementById('documentos').required = false;
                document.getElementById('raio-atendimento').required = false;
            }
        });
    });
    
    // Formatação de campos
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remove caracteres não numéricos
            value = value.replace(/\D/g, '');
            
            // Aplica a máscara de CPF: XXX.XXX.XXX-XX
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
    
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remove caracteres não numéricos
            value = value.replace(/\D/g, '');
            
            // Aplica a máscara de telefone: (XX) XXXXX-XXXX
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            }
            
            e.target.value = value;
        });
    }
    
    // Funcionalidade para exibir o nome do arquivo selecionado
    const fileInput = document.getElementById('documentos');
    const fileName = document.querySelector('.file-name');
    
    if (fileInput && fileName) {
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileName.textContent = this.files[0].name;
            } else {
                fileName.textContent = 'Nenhum arquivo selecionado';
            }
        });
    }
    
    // Manipulação do formulário de cadastro
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Determina o tipo de usuário ativo
            const tipoUsuario = document.querySelector('.tab-button.active').getAttribute('data-tab');
            
            // Obter os valores dos campos comuns
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const cpf = document.getElementById('cpf').value;
            const telefone = document.getElementById('telefone').value;
            const endereco = document.getElementById('endereco').value;
            const senha = document.getElementById('senha').value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            
            // Verificar se os campos comuns estão preenchidos
            if (!nome || !email || !cpf || !telefone || !endereco || !senha || !confirmarSenha) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Verificar se as senhas coincidem
            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem.');
                return;
            }
            
            // Se for atendente, verificar os campos específicos
            if (tipoUsuario === 'atendente') {
                const areaAtuacao = document.getElementById('area-atuacao').value;
                const documentos = document.getElementById('documentos').files;
                const raioAtendimento = document.getElementById('raio-atendimento').value;
                
                if (!areaAtuacao || documentos.length === 0 || !raioAtendimento) {
                    alert('Por favor, preencha todos os campos específicos para atendentes.');
                    return;
                }
                
                // Log dos dados específicos de atendente
                console.log('Dados específicos de atendente:', {
                    areaAtuacao,
                    documentosNome: documentos[0].name,
                    raioAtendimento
                });
            }
            
            // Log dos dados comuns
            console.log('Dados de cadastro:', {
                tipoUsuario,
                nome,
                email,
                cpf,
                telefone,
                endereco,
                senha
            });
            
            // Simulação de cadastro bem-sucedido
            alert(`Cadastro de ${tipoUsuario} realizado com sucesso! Redirecionando para a página de login...`);
            
            // Redirecionar para a página de login após o cadastro
            // window.location.href = '../login/login.html';
        });
    }
});