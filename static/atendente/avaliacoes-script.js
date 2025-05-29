// static/atendente/avaliacoes-script.js
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('amadoAuthToken');
    const atendenteId = localStorage.getItem('amadoUserId');
    // ... (verificações de login e status do atendente) ...
    if (!token || !atendenteId || localStorage.getItem('amadoUserType') !== 'ATENDENTE') {
        window.location.href = '/static/login/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    // ... (redirecionamento se PENDENTE ou BLOQUEADO)

    const currentYearSpan = document.getElementById('currentYearFooterAtAval');
    if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    const fetchConfig = { headers: { 'Authorization': `Bearer ${token}` } };
    const listaAvaliacoesDiv = document.getElementById('lista-avaliacoes-recebidas');
    const mediaGeralDisplay = document.getElementById('media-geral-display');
    const totalAvaliacoesDisplay = document.getElementById('total-avaliacoes-display');

    function generateStarsDisplay(rating) { /* ... (copiar de agendamento-script.js) ... */
        const totalStars = 5; let starsHtml = ''; const numRating = parseFloat(rating);
        for (let i = 1; i <= totalStars; i++) {
            if (i <= numRating) starsHtml += '<i class="fas fa-star"></i>';
            else if (i - 0.5 <= numRating) starsHtml += '<i class="fas fa-star-half-alt"></i>';
            else starsHtml += '<i class="far fa-star"></i>';
        }
        return starsHtml;
    }

    async function carregarAvaliacoes() {
        listaAvaliacoesDiv.innerHTML = '<p class="loading-message">Carregando...</p>';
        try {
            // GET /api/atendentes/{id}/avaliacoes
            const response = await fetch(`/api/atendentes/${atendenteId}/avaliacoes`, fetchConfig);
            if (!response.ok) throw new Error('Falha ao carregar avaliações.');
            const data = await response.json(); // Espera-se { media_geral: X, total_avaliacoes: Y, avaliacoes: [] }
            
            mediaGeralDisplay.innerHTML = data.media_geral ? generateStarsDisplay(data.media_geral) + ` (${data.media_geral.toFixed(1)})` : 'N/A';
            totalAvaliacoesDisplay.textContent = data.total_avaliacoes || 0;

            renderAvaliacoes(data.avaliacoes || []);
        } catch (error) {
            console.error("Erro:", error);
            listaAvaliacoesDiv.innerHTML = '<p class="error-message">Não foi possível carregar as avaliações.</p>';
            mediaGeralDisplay.textContent = 'Erro';
            totalAvaliacoesDisplay.textContent = 'Erro';
        }
    }

    function renderAvaliacoes(avaliacoes) {
        listaAvaliacoesDiv.innerHTML = '';
        if (avaliacoes.length === 0) {
            listaAvaliacoesDiv.innerHTML = '<p class="no-items-message">Você ainda não recebeu nenhuma avaliação.</p>';
            return;
        }
        avaliacoes.forEach(av => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'avaliacao-recebida-item';
            itemDiv.innerHTML = `
                <div class="rating-display">Nota: ${generateStarsDisplay(av.nota)} (${av.nota}/5)</div>
                ${av.comentario ? `<p class="comentario-texto">"${av.comentario}"</p>` : '<p class="comentario-texto"><em>Nenhum comentário fornecido.</em></p>'}
                <p class="avaliador-info">
                    ${av.anonima ? 'Por: Anônimo' : `Por: ${av.nome_avaliador || 'Cliente'}`} 
                    em ${new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}
                     (Referente ao agendamento de ${new Date(av.data_agendamento_avaliado).toLocaleDateString('pt-BR')})
                </p>
            `;
            listaAvaliacoesDiv.appendChild(itemDiv);
        });
    }
    carregarAvaliacoes();
});