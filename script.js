// Aguarda o carregamento completo do DOM
d// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Animação suave para os links de navegação
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Apenas previne o comportamento padrão para links de âncora (#)
            if (this.getAttribute('href') === '#' || this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                // Remove a classe active de todos os links
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Adiciona a classe active ao link clicado
                this.classList.add('active');
                
                // Aqui você pode adicionar lógica para navegação SPA se desejar
                const targetId = this.getAttribute('href').substring(1);
                console.log(`Navegando para: ${targetId}`);
            } else {
                // Para links externos, apenas atualiza a classe active
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
    
    // Animação para os cards de profissionais
    const professionalCards = document.querySelectorAll('.professional-card');
    
    professionalCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Funcionalidade para os botões "Ver Perfil"
    const viewProfileButtons = document.querySelectorAll('.view-profile');
    
    viewProfileButtons.forEach(button => {
        button.addEventListener('click', function() {
            const professionalName = this.parentElement.querySelector('h3').textContent;
            alert(`Visualizando perfil de ${professionalName}`);
        });
    });
    
    // Funcionalidade para o botão "Ver todos os Profissionais"
    const viewAllButton = document.querySelector('.view-all');
    
    if (viewAllButton) {
        viewAllButton.addEventListener('click', function() {
            alert('Redirecionando para a página com todos os profissionais disponíveis.');
        });
    }
    
    // Efeito de scroll suave para as seções
    function smoothScroll() {
        const sections = document.querySelectorAll('section');
        
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    section.classList.add('active-section');
                } else {
                    section.classList.remove('active-section');
                }
            });
        });
    }
    
    smoothScroll();
});