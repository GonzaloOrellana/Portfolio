document.addEventListener('DOMContentLoaded', () => {
    // ========== MOBILE MENU ==========
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    function toggleMenu() {
        mobileMenu.classList.toggle('open');
        menuOverlay.classList.toggle('open');
        if (mobileMenu.classList.contains('open')) {
            document.body.style.overflowY = 'hidden';
        } else {
            document.body.style.overflowY = 'auto';
        }
    }

    if(menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if(closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
    if(menuOverlay) menuOverlay.addEventListener('click', toggleMenu);

    // ========== SCROLL REVEAL (FLOW) FUNCIONES ==========
    let currentObserver = null;

    function animateCounter(el) {
        const target = +el.getAttribute('data-target');
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2000; // ms
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                el.innerText = prefix + Math.ceil(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                el.innerText = prefix + target + suffix;
            }
        };
        updateCounter();
    }

    function initAnimations(page) {
        if (!page) return;

        // Limpiar observador previo si existe
        if (currentObserver) {
            currentObserver.disconnect();
        }

        // Remover el estado de animación ('active') globalmente al cambiar de página
        // De esta forma, re-animan cada vez que el usuario vuelve a la sección
        document.querySelectorAll('.reveal-up.active, .reveal-left.active, .reveal-right.active, .reveal-scale.active').forEach(el => {
            el.classList.remove('active');
        });

        // Solo observar los elementos de reveal de la página actual
        const revealElements = page.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
        
        const revealOptions = {
            threshold: 0.15, // 15% del elemento debe ser visible
            rootMargin: "0px 0px -50px 0px" // Activa un poco antes de llegar abajo
        };

        currentObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    return;
                } else {
                    entry.target.classList.add('active');
                    
                    // Si el elemento es un stat-card, animamos sus contadores
                    if (entry.target.classList.contains('stat-card')) {
                        const countElements = entry.target.querySelectorAll('.stat-num');
                        countElements.forEach(animateCounter);
                    }
                    
                    observer.unobserve(entry.target); // Solo anima una vez por visita a la página actual
                }
            });
        }, revealOptions);

        revealElements.forEach(el => {
            currentObserver.observe(el);
        });
    }

    // ========== SPA ROUTER ==========
    // Service detail pages map to the "servicios" nav item
    const serviceDetailPages = ['servicio-diseno', 'servicio-web', 'servicio-video'];
    // Project detail pages map to the "proyectos" nav item
    const projectDetailPages = ['detalle-churn', 'detalle-aisha', 'detalle-pablo', 'detalle-zalostore', 'detalle-generador', 'detalle-inventario'];

    function navigateTo(pageId) {
        const currentPage = document.querySelector('.page.active');
        const targetPage = document.getElementById(pageId);

        if (!targetPage || currentPage === targetPage) return;

        // Update nav active states (both desktop and mobile)
        let navHighlight = pageId;
        if (serviceDetailPages.includes(pageId)) navHighlight = 'servicios';
        if (projectDetailPages.includes(pageId)) navHighlight = 'proyectos';

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === navHighlight) {
                item.classList.add('active');
            }
        });

        // Fade out current
        currentPage.classList.add('exit');
        currentPage.classList.remove('active');

        // After fade-out completes, fade in target
        setTimeout(() => {
            currentPage.classList.remove('exit');
            targetPage.classList.add('active');
            // Scroll principal arriba
            window.scrollTo(0, 0);
            targetPage.scrollTop = 0;

            // Reiniciar animaciones solo para la nueva página
            initAnimations(targetPage);
        }, 350);

        // Close mobile menu if open
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            toggleMenu();
        }
    }

    // Bind all navigable elements (links and buttons with data-page)
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            // Don't prevent default on external links (CV download)
            if (link.getAttribute('target') === '_blank') return;
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });

    // ========== PROJECT FILTERS ==========
    const filterPills = document.querySelectorAll('.filter-pill');
    const projectCards = document.querySelectorAll('.project-card');

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active pill
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.dataset.filter;

            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = '';
                    // Stagger fade-in
                    card.style.opacity = '0';
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                    });
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ========== TESTIMONIALS DRAG TO SCROLL ==========
    const slider = document.querySelector('.testimonials-slider');
    let isDown = false;
    let startX;
    let scrollLeft;

    if (slider) {
        // Activar cursor tipo mano
        slider.style.cursor = 'grab';

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            // Desactivar temporalmente el scroll-snap durante el arrastre manual
            slider.style.scrollSnapType = 'none';
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            slider.style.scrollSnapType = 'x mandatory';
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            slider.style.scrollSnapType = 'x mandatory';
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Velocidad de arrastre
            slider.scrollLeft = scrollLeft - walk;
        });
    }

    // Handle initial route on page load (SPA behavior)
    function handleInitialRoute() {
        const hash = window.location.hash;
        if (hash) {
            const pageId = hash.substring(1); // remove '#'
            const targetPage = document.getElementById(pageId);
            
            // Check if it's a valid page mapped by ID
            if (targetPage && targetPage.classList.contains('page')) {
                // Deactivate all pages
                document.querySelectorAll('.page').forEach(p => {
                    p.classList.remove('active');
                    p.classList.remove('exit');
                });
                
                // Activate target
                targetPage.classList.add('active');
                
                // Update nav highlights
                let navHighlight = pageId;
                if (serviceDetailPages.includes(pageId)) navHighlight = 'servicios';
                if (projectDetailPages.includes(pageId)) navHighlight = 'proyectos';

                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.page === navHighlight) {
                        item.classList.add('active');
                    }
                });

                // Scroll reset
                window.scrollTo(0, 0);
                targetPage.scrollTop = 0;
            }
        }
        
        // Initialize animations for the currently visible page
        initAnimations(document.querySelector('.page.active'));
    }

    handleInitialRoute();
});
