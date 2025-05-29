// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Toggle entre planos mensais e anuais
    const billingToggle = document.getElementById('billing-toggle');
    const mensalElements = document.querySelectorAll('.mensal');
    const anualElements = document.querySelectorAll('.anual');
    
    if (billingToggle) {
        billingToggle.addEventListener('change', function() {
            if (this.checked) {
                // Mostrar preços anuais
                mensalElements.forEach(el => el.style.display = 'none');
                anualElements.forEach(el => el.style.display = 'inline-block');
            } else {
                // Mostrar preços mensais
                anualElements.forEach(el => el.style.display = 'none');
                mensalElements.forEach(el => el.style.display = 'inline-block');
            }
        });
    }
    
    // Accordion para as perguntas frequentes
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Verifica se o item clicado já está ativo
            const isActive = item.classList.contains('active');
            
            // Fecha todos os itens
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Se o item clicado não estava ativo, abre-o
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // Botões de assinatura
    const planoButtons = document.querySelectorAll('.plano-button');
    
    planoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planoCard = this.closest('.plano-card');
            const planoNome = planoCard.querySelector('h3').textContent;
            
            if (planoNome === 'Plano Empresarial') {
                // Redireciona para formulário de contato
                alert(`Você será redirecionado para o formulário de contato para o ${planoNome}.`);
            } else {
                // Redireciona para página de checkout
                alert(`Você selecionou o ${planoNome}. Redirecionando para o checkout...`);
            }
        });
    });
    
    // Botão CTA
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('Você será conectado a um de nossos consultores em breve.');
        });
    }
    
    // Animação para os cards de planos
    const planoCards = document.querySelectorAll('.plano-card');
    
    function checkIfInView() {
        planoCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const isInView = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (isInView) {
                card.style.opacity = 1;
                card.style.transform = card.classList.contains('featured') ? 
                    'scale(1.05)' : 'translateY(0)';
            }
        });
    }
    
    // Inicialmente esconde os cards
    planoCards.forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Verifica se os cards estão visíveis na tela
    window.addEventListener('scroll', checkIfInView);
    window.addEventListener('resize', checkIfInView);
    
    // Verifica imediatamente após o carregamento
    checkIfInView();
});