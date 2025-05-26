// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
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
            if (isElementInViewport(section) && !section.classList.contains('fade-in')) {
                section.classList.add('fade-in');
                
                // Adiciona delay para elementos filhos
                const children = section.querySelectorAll('.mvv-card, .equipe-card, .numero-card');
                children.forEach((child, index) => {
                    const delayClass = `delay-${(index % 4) + 1}`;
                    child.classList.add('fade-in', delayClass);
                });
            }
        });
    }
    
    // Contador para os números
    function startCounter() {
        const numeroValores = document.querySelectorAll('.numero-valor');
        
        numeroValores.forEach(valor => {
            const target = parseInt(valor.getAttribute('data-count'));
            const duration = 2000; // 2 segundos
            const step = target / (duration / 16); // 60fps
            let current = 0;
            
            const counter = setInterval(() => {
                current += step;
                
                if (current >= target) {
                    valor.textContent = target.toLocaleString();
                    clearInterval(counter);
                } else {
                    valor.textContent = Math.floor(current).toLocaleString();
                }
            }, 16);
        });
    }
    
    // Slider de depoimentos
    const depoimentosContainer = document.querySelector('.depoimentos-container');
    const dots = document.querySelectorAll('.dot');
    const prevButton = document.getElementById('prev-depoimento');
    const nextButton = document.getElementById('next-depoimento');
    let currentSlide = 0;
    
    function showSlide(index) {
    // Atualiza o índice do slide atual
        currentSlide = index;
    
    // Move o container para mostrar o slide atual
        depoimentosContainer.style.transform = `translateX(-${currentSlide * 33.333}%)`; // 33.333% para cada slide
    
    // Atualiza os dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }
    
    // Event listeners para os botões de navegação
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            const newIndex = (currentSlide - 1 + dots.length) % dots.length;
            showSlide(newIndex);
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const newIndex = (currentSlide + 1) % dots.length;
            showSlide(newIndex);
        });
    }
    
    // Event listeners para os dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Auto-play do slider
    let slideInterval = setInterval(() => {
        const newIndex = (currentSlide + 1) % dots.length;
        showSlide(newIndex);
    }, 5000);
    
    // Pausa o auto-play quando o mouse está sobre o slider
    const depoimentosSlider = document.querySelector('.depoimentos-slider');
    if (depoimentosSlider) {
        depoimentosSlider.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        depoimentosSlider.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                const newIndex = (currentSlide + 1) % dots.length;
                showSlide(newIndex);
            }, 5000);
        });
    }
    
    // Inicia as animações ao carregar a página
    handleScrollAnimation();
    
    // Adiciona o event listener para o scroll
    window.addEventListener('scroll', handleScrollAnimation);
    
    // Inicia o contador quando a seção de números estiver visível
    const numerosSection = document.querySelector('.numeros-section');
    if (numerosSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(numerosSection);
    }
});