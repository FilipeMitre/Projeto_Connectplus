// static/cadastro/cadastro-script.js
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const cadastroForm = document.getElementById('cadastro-form');
    const camposAtendenteDiv = document.getElementById('campos-atendente');
    const formMessagesDiv = document.getElementById('form-messages');
    const submitButton = document.getElementById('submit-cadastro-button');

    const nomeCompletoInput = document.getElementById('nome-completo');
    const nomeSocialInput = document.getElementById('nome-social');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const dataNascimentoInput = document.getElementById('data-nascimento');
    const telefoneNumeroInput = document.getElementById('telefone-numero');
    const identidadeGeneroSelect = document.getElementById('identidade-genero');
    const orientacaoSexualSelect = document.getElementById('orientacao-sexual');
    const pronomesInput = document.getElementById('pronomes');
    const cepInput = document.getElementById('cep');
    const logradouroInput = document.getElementById('logradouro');
    const numeroEnderecoInput = document.getElementById('numero-endereco');
    const complementoInput = document.getElementById('complemento');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const estadoSelect = document.getElementById('estado');
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const termosUsoCheckbox = document.getElementById('termos-uso');

    // Campos do Atendente
    const areaAtuacaoSelect = document.getElementById('area-atuacao');
    const qualificacaoDescricaoTextarea = document.getElementById('qualificacao-descricao');
    const especialidadesInput = document.getElementById('especialidades');
    const registroProfissionalInput = document.getElementById('registro-profissional');
    const anosExperienciaInput = document.getElementById('anos-experiencia');
    const curriculoLinkInput = document.getElementById('curriculo-link');
    const aceitaOnlineCheckbox = document.getElementById('aceita-online');
    const aceitaPresencialCheckbox = document.getElementById('aceita-presencial');
    const duracaoPadraoInput = document.getElementById('duracao-padrao-atendimento');


    const currentYearSpanFooter = document.getElementById('currentYearFooter');
    if (currentYearSpanFooter) {
        currentYearSpanFooter.textContent = new Date().getFullYear();
    }
    
    // Popula select de estados
    const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
    ufs.forEach(uf => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = uf;
        estadoSelect.appendChild(option);
    });


    let tipoUsuarioSelecionado = 'CLIENTE'; // Padrão

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tipoUsuarioSelecionado = this.dataset.tab;

            if (tipoUsuarioSelecionado === 'ATENDENTE') {
                camposAtendenteDiv.style.display = 'block';
                // Tornar campos de atendente obrigatórios
                areaAtuacaoSelect.required = true;
                qualificacaoDescricaoTextarea.required = true;
                duracaoPadraoInput.required = true;

            } else {
                camposAtendenteDiv.style.display = 'none';
                // Remover obrigatoriedade
                areaAtuacaoSelect.required = false;
                qualificacaoDescricaoTextarea.required = false;
                duracaoPadraoInput.required = false;
            }
        });
    });

    // Máscaras (CPF, Telefone, CEP)
    cpfInput.addEventListener('input', maskCPF);
    telefoneNumeroInput.addEventListener('input', maskTelefone);
    cepInput.addEventListener('input', maskCEP);
    cepInput.addEventListener('blur', buscarEnderecoPorCEP); // Auto-preenchimento

    function maskCPF(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    }
    function maskTelefone(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        if (value.length > 10) { // Celular com 9º dígito
            value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) { // Fixo ou celular incompleto
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
             value = value.replace(/^(\d{2})(\d*)/, '($1) $2');
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, '($1');
        }
        e.target.value = value;
    }
    function maskCEP(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.substring(0, 8);
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    }

    async function buscarEnderecoPorCEP() {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                if (!response.ok) throw new Error('CEP não encontrado.');
                const data = await response.json();
                if (data.erro) {
                    mostrarMensagem('CEP não encontrado.', 'error');
                    return;
                }
                logradouroInput.value = data.logradouro || '';
                bairroInput.value = data.bairro || '';
                cidadeInput.value = data.cidade || '';
                estadoSelect.value = data.uf || '';
                numeroEnderecoInput.focus(); // Foca no número após preencher
            } catch (error) {
                console.warn('Erro ao buscar CEP:', error);
                // Não limpa os campos caso o usuário queira digitar manualmente
            }
        }
    }

    function mostrarMensagem(mensagem, tipo = 'success') { // tipo pode ser 'success' ou 'error'
        formMessagesDiv.textContent = mensagem;
        formMessagesDiv.className = `form-messages ${tipo}`;
        formMessagesDiv.style.display = 'block';
        setTimeout(() => {
            formMessagesDiv.style.display = 'none';
        }, 5000); // Mensagem some após 5 segundos
    }

    cadastroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        formMessagesDiv.style.display = 'none'; // Esconde mensagens antigas

        if (senhaInput.value !== confirmarSenhaInput.value) {
            mostrarMensagem('As senhas não coincidem.', 'error');
            senhaInput.focus();
            return;
        }
        if (senhaInput.value.length < 8) {
            mostrarMensagem('A senha deve ter no mínimo 8 caracteres.', 'error');
            senhaInput.focus();
            return;
        }
        if (!termosUsoCheckbox.checked) {
            mostrarMensagem('Você deve aceitar os Termos de Uso e Política de Privacidade.', 'error');
            return;
        }

        const submitButtonOriginalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';

        const usuarioData = {
            nome_completo: nomeCompletoInput.value,
            nome_social: nomeSocialInput.value || null,
            email: emailInput.value,
            cpf: cpfInput.value.replace(/\D/g, ''),
            data_nascimento: dataNascimentoInput.value || null,
            senha: senhaInput.value,
            tipo_usuario: tipoUsuarioSelecionado,
            identidade_genero: identidadeGeneroSelect.value || null,
            orientacao_sexual: orientacaoSexualSelect.value || null,
            pronomes: pronomesInput.value || null,
            telefones: [{ numero_telefone: telefoneNumeroInput.value.replace(/\D/g, ''), tipo_telefone: 'CELULAR', is_principal: true }],
            enderecos: [{
                logradouro: logradouroInput.value,
                numero: numeroEnderecoInput.value,
                complemento: complementoInput.value || null,
                bairro: bairroInput.value,
                cidade: cidadeInput.value,
                estado: estadoSelect.value,
                cep: cepInput.value.replace(/\D/g, ''),
                tipo_endereco: 'RESIDENCIAL',
                is_principal: true
            }]
        };

        let payload = { ...usuarioData };

        if (tipoUsuarioSelecionado === 'ATENDENTE') {
            const atendenteDetalhesData = {
                area_atuacao: areaAtuacaoSelect.value,
                qualificacao_descricao: qualificacaoDescricaoTextarea.value,
                especialidades: especialidadesInput.value || null,
                registro_profissional: registroProfissionalInput.value || null,
                anos_experiencia: anosExperienciaInput.value ? parseInt(anosExperienciaInput.value) : null,
                curriculo_link: curriculoLinkInput.value || null,
                aceita_atendimento_online: aceitaOnlineCheckbox.checked,
                aceita_atendimento_presencial: aceitaPresencialCheckbox.checked,
                duracao_padrao_atendimento_min: parseInt(duracaoPadraoInput.value)
                // id_endereco_atendimento_presencial será definido no backend se necessário, ou em um painel do atendente.
            };
            payload.atendente_detalhes = atendenteDetalhesData;
        }
        
        // Endpoint para cadastro
        fetch('/api/auth/registrar', { // Ajuste o endpoint conforme sua API
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    // Se a mensagem de erro for um objeto (como validação de campos), tente formatar
                    if (typeof err.message === 'object') {
                        let errorMessages = Object.values(err.message).flat().join('\n');
                        throw new Error(errorMessages || 'Erro no cadastro. Verifique os dados.');
                    }
                    throw new Error(err.message || 'Erro no cadastro. Tente novamente.');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarMensagem(data.message || 'Cadastro realizado com sucesso! Você será redirecionado para o login.', 'success');
            setTimeout(() => {
                window.location.href = '/static/login/login.html'; // Redireciona para o login
            }, 3000);
        })
        .catch(error => {
            console.error('Erro no cadastro:', error);
            mostrarMensagem(error.message, 'error');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = submitButtonOriginalText;
        });
    });
});