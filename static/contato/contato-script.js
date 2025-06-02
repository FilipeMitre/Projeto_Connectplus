// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Formulário de contato
    const contactForm = document.getElementById('contact-form');
    const successModal = document.getElementById('success-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeSuccessBtn = document.getElementById('close-success');
    
    // Formatação de telefone
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
    
    // Envio do formulário
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulação de envio do formulário
            // Em um ambiente real, você enviaria os dados para um servidor
            
            // Exibe o modal de sucesso após "enviar" o formulário
            successModal.style.display = 'block';
            
            // Limpa o formulário
            contactForm.reset();
        });
    }
    
    // Fecha o modal quando o usuário clica no X
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
        });
    }
    
    // Fecha o modal quando o usuário clica no botão "Fechar"
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
        });
    }
    
    // Fecha o modal quando o usuário clica fora do conteúdo
    window.addEventListener('click', function(event) {
        if (event.target === successModal) {
            successModal.style.display = 'none';
        }
    });
    
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
    
    // Animação de entrada para os elementos
    const sections = document.querySelectorAll('section');
    
    // Função para verificar se um elemento está visível na tela
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    }
    
    // Função para adicionar classes de animação aos elementos visíveis
    function handleScrollAnimation() {
        sections.forEach(section => {
            if (isElementInViewport(section) && !section.classList.contains('animate')) {
                section.classList.add('animate');
            }
        });
    }
    
    // Inicia as animações ao carregar a página
    handleScrollAnimation();
    
    // Adiciona o event listener para o scroll
    window.addEventListener('scroll', handleScrollAnimation);
});