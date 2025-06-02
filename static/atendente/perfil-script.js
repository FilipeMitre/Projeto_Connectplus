// static/atendente/perfil-script.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const atendenteId = localStorage.getItem('amadoUserId');
    const userStatus = localStorage.getItem('amadoUserStatus');

    if (!token || !atendenteId || localStorage.getItem('amadoUserType') !== 'ATENDENTE') {
        window.location.href = '/static/login/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    if (userStatus === 'PENDENTE_APROVACAO') { // Não deveria poder editar se pendente, mas deixamos carregar
        // document.getElementById('atendente-perfil-form').querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
        // document.getElementById('atendente-perfil-messages').textContent = 'Seu cadastro está aguardando aprovação. Algumas edições podem não estar disponíveis.';
        // document.getElementById('atendente-perfil-messages').style.display = 'block';
    }
     if (userStatus === 'BLOQUEADO') {
        window.location.href = '/static/atendente/conta-bloqueada.html';
        return;
    }


    const currentYearSpan = document.getElementById('currentYearFooterAtPerfil');
    if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const fetchConfig = (method = 'GET', body = null) => { /* ... (copiar de perfil-script.js cliente) ... */
        const config = {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        };
        if (body) config.body = JSON.stringify(body);
        return config;
    };
    
    const perfilMessagesDiv = document.getElementById('atendente-perfil-messages');
    const perfilForm = document.getElementById('atendente-perfil-form');
    const salvarPerfilButton = document.getElementById('salvar-atendente-perfil-button');

    // Campos Pessoais
    const nomeCompletoInput = document.getElementById('at-nome-completo');
    const nomeSocialInput = document.getElementById('at-nome-social');
    const emailInput = document.getElementById('at-email'); // Readonly
    const telefoneInput = document.getElementById('at-telefone');
    // Adicionar refs para outros campos pessoais se existirem no HTML (dataNasc, identidade, etc.)


    // Campos Profissionais
    const areaAtuacaoSelect = document.getElementById('at-area-atuacao');
    const qualificacaoDescricaoTextarea = document.getElementById('at-qualificacao-descricao');
    const especialidadesInput = document.getElementById('at-especialidades');
    const registroProfissionalInput = document.getElementById('at-registro-profissional');
    const anosExperienciaInput = document.getElementById('at-anos-experiencia');
    const curriculoLinkInput = document.getElementById('at-curriculo-link');
    const aceitaOnlineCheckbox = document.getElementById('at-aceita-online');
    const aceitaPresencialCheckbox = document.getElementById('at-aceita-presencial');
    const duracaoPadraoInput = document.getElementById('at-duracao-padrao');

    // Campos de Senha
    const senhaAtualInput = document.getElementById('at-senha-atual');
    const novaSenhaInput = document.getElementById('at-nova-senha');
    const confirmarNovaSenhaInput = document.getElementById('at-confirmar-nova-senha');
    
    telefoneInput.addEventListener('input', maskTelefone); // Reutilizar a máscara

    function maskTelefone(e) { /* ... (copiar de cadastro-script.js) ... */
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        if (value.length > 10) { value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) { value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else if (value.length > 2) { value = value.replace(/^(\d{2})(\d*)/, '($1) $2');
        } else if (value.length > 0) { value = value.replace(/^(\d*)/, '($1'); }
        e.target.value = value;
    }

    function mostrarMensagemPerfil(mensagem, tipo = 'success') { /* ... (copiar de perfil-script.js cliente) ... */
        perfilMessagesDiv.textContent = mensagem;
        perfilMessagesDiv.className = `form-messages ${tipo}`;
        perfilMessagesDiv.style.display = 'block';
        setTimeout(() => { perfilMessagesDiv.style.display = 'none'; }, 5000);
    }

    // Lógica das Abas
    const tabLinks = document.querySelectorAll('.panel-tabs .tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.querySelector(this.dataset.tabTarget).classList.add('active');
        });
    });


    async function carregarDadosAtendente() {
        try {
            // GET /api/atendentes/{id}/perfil (endpoint que retorna dados de `usuario` e `atendente_detalhes`)
            const response = await fetch(`/api/atendentes/${atendenteId}/perfil`, fetchConfig());
            if (!response.ok) throw new Error('Falha ao carregar dados do perfil.');
            const data = await response.json(); // Espera-se que `data.usuario` e `data.detalhes` existam

            // Preencher Dados Pessoais (da tabela usuario)
            nomeCompletoInput.value = data.usuario.nome_completo || '';
            nomeSocialInput.value = data.usuario.nome_social || '';
            emailInput.value = data.usuario.email || '';
            // Preencher outros campos pessoais (CPF, dataNasc, identidade, etc. se forem editáveis ou mostrados)
            if (data.usuario.telefones && data.usuario.telefones.length > 0) {
                 const telPrincipal = data.usuario.telefones.find(t => t.is_principal) || data.usuario.telefones[0];
                 telefoneInput.value = telPrincipal.numero_telefone;
                 maskTelefone({target: telefoneInput}); // Aplica máscara
            }


            // Preencher Dados Profissionais (da tabela atendente_detalhes)
            if (data.detalhes) {
                areaAtuacaoSelect.value = data.detalhes.area_atuacao || '';
                qualificacaoDescricaoTextarea.value = data.detalhes.qualificacao_descricao || '';
                especialidadesInput.value = data.detalhes.especialidades || '';
                registroProfissionalInput.value = data.detalhes.registro_profissional || '';
                anosExperienciaInput.value = data.detalhes.anos_experiencia === null ? '' : data.detalhes.anos_experiencia;
                curriculoLinkInput.value = data.detalhes.curriculo_link || '';
                aceitaOnlineCheckbox.checked = data.detalhes.aceita_atendimento_online || false;
                aceitaPresencialCheckbox.checked = data.detalhes.aceita_atendimento_presencial || false;
                duracaoPadraoInput.value = data.detalhes.duracao_padrao_atendimento_min || 50;
            }
             if (userStatus === 'PENDENTE_APROVACAO') {
                document.getElementById('atendente-perfil-form').querySelectorAll('input:not([type=password]), select, textarea, button#salvar-atendente-perfil-button').forEach(el => el.disabled = true);
                 mostrarMensagemPerfil('Seu cadastro está aguardando aprovação. Você pode alterar sua senha, mas outras edições não estão disponíveis até a aprovação.', 'warning');
            }


        } catch (error) {
            console.error("Erro:", error);
            mostrarMensagemPerfil('Não foi possível carregar seu perfil profissional.', 'error');
        }
    }

    perfilForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const activeTab = document.querySelector('.tab-content.active').id;
        
        if (activeTab === 'alterar-senha-section') {
            // Lógica de alterar senha
            const senhaAtual = senhaAtualInput.value;
            const novaSenha = novaSenhaInput.value;
            const confirmarNovaSenha = confirmarNovaSenhaInput.value;

            if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
                 mostrarMensagemPerfil('Preencha todos os campos de senha.', 'error'); return;
            }
            if (novaSenha !== confirmarNovaSenha) {
                mostrarMensagemPerfil('As novas senhas não coincidem.', 'error'); return;
            }
            if (novaSenha.length < 8) {
                mostrarMensagemPerfil('A nova senha deve ter no mínimo 8 caracteres.', 'error'); return;
            }
            
            const originalButtonText = salvarPerfilButton.textContent; // Botão principal ainda controla
            salvarPerfilButton.disabled = true;
            salvarPerfilButton.textContent = 'Alterando Senha...';

            try {
                const response = await fetch(`/api/usuarios/${atendenteId}/alterar-senha`, fetchConfig('POST', { senha_atual: senhaAtual, nova_senha: novaSenha }));
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Falha ao alterar senha.');
                mostrarMensagemPerfil(data.message || 'Senha alterada com sucesso!', 'success');
                senhaAtualInput.value = ''; novaSenhaInput.value = ''; confirmarNovaSenhaInput.value = '';
            } catch (error) {
                mostrarMensagemPerfil(`Erro: ${error.message}`, 'error');
            } finally {
                salvarPerfilButton.disabled = false;
                salvarPerfilButton.textContent = originalButtonText;
            }

        } else { // Atualizar dados pessoais ou profissionais
            if (userStatus === 'PENDENTE_APROVACAO') {
                 mostrarMensagemPerfil('Seu cadastro está pendente. Edições não permitidas.', 'warning');
                 return;
            }
            const originalButtonText = salvarPerfilButton.textContent;
            salvarPerfilButton.disabled = true;
            salvarPerfilButton.textContent = 'Salvando Perfil...';

            const payload = {
                usuario: { // Dados da tabela `usuario`
                    nome_completo: nomeCompletoInput.value,
                    nome_social: nomeSocialInput.value || null,
                    // Adicionar outros campos pessoais que podem ser editados
                    telefone_principal: telefoneInput.value.replace(/\D/g, '') // Exemplo
                },
                detalhes: { // Dados da tabela `atendente_detalhes`
                    area_atuacao: areaAtuacaoSelect.value,
                    qualificacao_descricao: qualificacaoDescricaoTextarea.value,
                    especialidades: especialidadesInput.value || null,
                    registro_profissional: registroProfissionalInput.value || null,
                    anos_experiencia: anosExperienciaInput.value ? parseInt(anosExperienciaInput.value) : null,
                    curriculo_link: curriculoLinkInput.value || null,
                    aceita_atendimento_online: aceitaOnlineCheckbox.checked,
                    aceita_atendimento_presencial: aceitaPresencialCheckbox.checked,
                    duracao_padrao_atendimento_min: parseInt(duracaoPadraoInput.value)
                }
            };

            try {
                // PUT /api/atendentes/{id}/perfil
                const response = await fetch(`/api/atendentes/${atendenteId}/perfil`, fetchConfig('PUT', payload));
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Falha ao atualizar perfil profissional.');
                
                mostrarMensagemPerfil(data.message || 'Perfil profissional atualizado com sucesso!', 'success');
                if(data.usuario_atualizado && data.usuario_atualizado.nome_completo){
                    localStorage.setItem('amadoUserName', data.usuario_atualizado.nome_completo);
                }
            } catch (error) {
                mostrarMensagemPerfil(`Erro: ${error.message}`, 'error');
            } finally {
                salvarPerfilButton.disabled = false;
                salvarPerfilButton.textContent = originalButtonText;
            }
        }
    });
    
    carregarDadosAtendente();
});