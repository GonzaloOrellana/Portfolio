document.addEventListener('DOMContentLoaded', () => {
    // ========== MOBILE MENU ==========
    const menuBtn = document.getElementById('menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    function setMenuOpen(isOpen, restoreFocus = false) {
        if (!mobileMenu || !menuOverlay) return;
        mobileMenu.classList.toggle('open', isOpen);
        menuOverlay.classList.toggle('open', isOpen);
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        if (menuBtn) menuBtn.setAttribute('aria-expanded', String(isOpen));

        if (isOpen && closeMenuBtn) {
            closeMenuBtn.focus({ preventScroll: true });
        } else if (!isOpen && restoreFocus && menuBtn) {
            menuBtn.focus({ preventScroll: true });
        }
    }

    function toggleMenu() {
        if (!mobileMenu) return;
        const willOpen = !mobileMenu.classList.contains('open');
        setMenuOpen(willOpen, !willOpen);
    }

    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => setMenuOpen(false, true));
    if (menuOverlay) menuOverlay.addEventListener('click', () => setMenuOpen(false, false));

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
            threshold: 0.08, // Revela apenas entra en campo visual
            rootMargin: '0px 0px 20px 0px' // Margen positivo para anticipar la animación en móviles
        };

        currentObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');

                // Si el elemento es un stat-card, animamos sus contadores
                if (entry.target.classList.contains('stat-card')) {
                    const countElements = entry.target.querySelectorAll('.stat-num');
                    countElements.forEach(animateCounter);
                }

                observer.unobserve(entry.target);
            });
        }, revealOptions);

        revealElements.forEach(el => {
            currentObserver.observe(el);
        });
    }

    // ========== SPA ROUTER ==========
    const serviceDetailPages = ['servicio-diseno', 'servicio-web', 'servicio-video'];
    const projectDetailPages = ['detalle-axia', 'detalle-churn', 'detalle-aisha', 'detalle-pablo', 'detalle-zalostore', 'detalle-generador', 'detalle-inventario', 'detalle-focus', 'detalle-ucm-tracker'];

    const serviceMap = {
        'servicio-diseno': 'diseno-ui-ux',
        'servicio-web': 'desarrollo-web',
        'servicio-video': 'edicion-de-video'
    };

    const pageMap = {
        'diseno-ui-ux': 'servicio-diseno',
        'desarrollo-web': 'servicio-web',
        'edicion-de-video': 'servicio-video'
    };

    function loadMediaForPage(page) {
        if (!page) return;
        page.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
        page.querySelectorAll('video').forEach(video => {
            let needsLoad = false;
            if (video.hasAttribute('data-poster')) {
                video.poster = video.getAttribute('data-poster');
                video.removeAttribute('data-poster');
            }
            if (video.hasAttribute('data-src')) {
                video.src = video.getAttribute('data-src');
                video.removeAttribute('data-src');
                needsLoad = true;
            }
            video.querySelectorAll('source[data-src]').forEach(source => {
                source.src = source.getAttribute('data-src');
                source.removeAttribute('data-src');
                needsLoad = true;
            });
            if (needsLoad) {
                video.load();
                video.play().catch(() => {});
            }
        });
    }

    function resetInnerScroll(page) {
        if (!page) return;
        window.scrollTo(0, 0);
        page.scrollTop = 0;
        page.querySelectorAll('.projects-scroll-area, .about-content, .about-grid, .sdetail-wrapper, .pdetail-wrapper').forEach(el => {
            el.scrollTop = 0;
        });
    }

    function updateNavHighlights(pageId) {
        let navHighlight = pageId;
        if (serviceDetailPages.includes(pageId)) navHighlight = 'servicios';
        if (projectDetailPages.includes(pageId)) navHighlight = 'proyectos';

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === navHighlight);
        });
    }

    const appContainer = document.getElementById('app-container');
    let transitionTimer = null;
    let activePageId = document.querySelector('.page.active')?.id || null;

    function activatePage(targetPage) {
        targetPage.classList.add('active');
        resetInnerScroll(targetPage);
        loadMediaForPage(targetPage);
        initAnimations(targetPage);
    }

    function navigateTo(pageId, pushToHistory = true) {
        const targetPage = document.getElementById(pageId);
        if (!targetPage || activePageId === pageId) return;

        activePageId = pageId;

        if (pushToHistory) {
            const url = new URL(window.location.href);
            const serviceValue = serviceMap[pageId];

            if (serviceValue) {
                url.searchParams.set('servicio', serviceValue);
                url.hash = '';
            } else {
                url.searchParams.delete('servicio');
                url.hash = pageId !== 'home' ? pageId : '';
            }
            window.history.pushState({ pageId }, '', url.pathname + url.search + url.hash);
        }

        updateNavHighlights(pageId);

        if (transitionTimer) {
            clearTimeout(transitionTimer);
            transitionTimer = null;
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('active', 'exit');
            });
            activatePage(targetPage);
        } else {
            const currentPage = document.querySelector('.page.active');
            if (currentPage) {
                currentPage.classList.add('exit');
                currentPage.classList.remove('active');

                transitionTimer = setTimeout(() => {
                    transitionTimer = null;
                    currentPage.classList.remove('exit');
                    activatePage(targetPage);
                }, 350);
            } else {
                activatePage(targetPage);
            }
        }

        if (mobileMenu && mobileMenu.classList.contains('open')) {
            setMenuOpen(false, false);
        }
    }

    if (appContainer) {
        // Bind all navigable elements (links and buttons with data-page)
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('target') === '_blank') return;
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // ========== MAKE PROJECT CARDS CLICKABLE & KEYBOARD ACCESSIBLE ==========
        document.querySelectorAll('.project-card').forEach(card => {
            const detailBtn = card.querySelector('.project-detail-btn');
            const detailPage = detailBtn?.dataset.page;
            if (!detailPage) return;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.project-arrow')) return;
                e.preventDefault();
                navigateTo(detailPage);
            });

            card.addEventListener('keydown', (e) => {
                if (e.target.closest('.project-arrow')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateTo(detailPage);
                }
            });
        });

        document.querySelectorAll('.project-detail-btn').forEach(btn => {
            btn.addEventListener('keydown', (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && btn.dataset.page) {
                    e.preventDefault();
                    e.stopPropagation();
                    navigateTo(btn.dataset.page);
                }
            });
        });

        // Escuchar cambios en el historial (atrás/adelante)
        window.addEventListener('popstate', (e) => {
            const params = new URLSearchParams(window.location.search);
            const serviceValue = params.get('servicio');

            if (serviceValue && pageMap[serviceValue]) {
                navigateTo(pageMap[serviceValue], false);
            } else {
                const hash = window.location.hash;
                if (hash) {
                    const pageId = hash.substring(1);
                    const targetPage = document.getElementById(pageId);
                    if (targetPage && targetPage.classList.contains('page')) {
                        navigateTo(pageId, false);
                        return;
                    }
                }
                if (e.state && e.state.pageId) {
                    navigateTo(e.state.pageId, false);
                } else {
                    navigateTo('home', false);
                }
            }
        });
    }

    // ========== PROJECT FILTERS ==========
    const filterPills = document.querySelectorAll('.filter-pill');
    const projectCards = document.querySelectorAll('.project-card');

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.dataset.filter;

            projectCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = '';
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

    // Helper para inicializar arrastre con mouse (drag to scroll) en carruseles
    function initDragToScroll(sliderEl) {
        if (!sliderEl) return;
        let isDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        let hasDragged = false;

        sliderEl.style.cursor = 'grab';

        const stopDrag = () => {
            if (!isDown) return;
            isDown = false;
            sliderEl.style.cursor = 'grab';
            sliderEl.style.scrollSnapType = 'x mandatory';
            sliderEl.style.scrollBehavior = '';

            if (hasDragged) {
                sliderEl.dataset.justDragged = 'true';
                setTimeout(() => {
                    delete sliderEl.dataset.justDragged;
                }, 0);
            }
            hasDragged = false;
        };

        sliderEl.addEventListener('mousedown', (e) => {
            isDown = true;
            hasDragged = false;
            sliderEl.style.cursor = 'grabbing';
            startX = e.pageX - sliderEl.offsetLeft;
            startScrollLeft = sliderEl.scrollLeft;
            sliderEl.style.scrollSnapType = 'none';
            sliderEl.style.scrollBehavior = 'auto';
        });

        sliderEl.addEventListener('mouseleave', stopDrag);
        window.addEventListener('mouseup', stopDrag);

        sliderEl.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - sliderEl.offsetLeft;
            if (Math.abs(x - startX) > 5) {
                hasDragged = true;
            }
            const walk = (x - startX) * 2;
            sliderEl.scrollLeft = startScrollLeft - walk;
        });
    }

    // ========== CAROUSEL DRAG INITIALIZATIONS ==========
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    initDragToScroll(testimonialsSlider);

    const shortsSlider = document.querySelector('.shorts-slider');
    initDragToScroll(shortsSlider);

    // ========== YOUTUBE SHORTS CLICK-TO-LOAD (SIN INLINE ONCLICK) ==========
    function activateShort(wrapper) {
        if (!wrapper || wrapper.classList.contains('playing')) return;
        const src = wrapper.getAttribute('data-video-src');
        if (!src) return;

        const iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.src = src;
        iframe.title = wrapper.getAttribute('aria-label') || 'Video edit';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;

        wrapper.replaceChildren(iframe);
        wrapper.classList.add('playing');
        wrapper.removeAttribute('tabindex');
        wrapper.removeAttribute('role');
    }

    document.querySelectorAll('.short-wrapper').forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            if (shortsSlider && shortsSlider.dataset.justDragged === 'true') return;
            activateShort(wrapper);
        });
        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activateShort(wrapper);
            }
        });
    });

    // ========== YOUTUBE SHORTS CAROUSEL CONTROLS ==========
    const shortsPrevBtn = document.querySelector('.shorts-control-btn.prev');
    const shortsNextBtn = document.querySelector('.shorts-control-btn.next');

    if (shortsSlider && shortsPrevBtn && shortsNextBtn) {
        const getScrollAmount = () => {
            const firstCard = shortsSlider.querySelector('.short-wrapper');
            if (!firstCard) return 300;
            const gap = parseInt(window.getComputedStyle(shortsSlider).gap, 10) || 24;
            return firstCard.offsetWidth + gap;
        };

        shortsPrevBtn.addEventListener('click', () => {
            shortsSlider.scrollBy({
                left: -getScrollAmount(),
                behavior: 'smooth'
            });
        });

        shortsNextBtn.addEventListener('click', () => {
            shortsSlider.scrollBy({
                left: getScrollAmount(),
                behavior: 'smooth'
            });
        });
    }

    // Handle initial route on page load (SPA behavior)
    function handleInitialRoute() {
        if (!appContainer) return;

        const params = new URLSearchParams(window.location.search);
        const serviceValue = params.get('servicio');

        let initialPageId = null;

        if (serviceValue && pageMap[serviceValue]) {
            initialPageId = pageMap[serviceValue];
        } else {
            const hash = window.location.hash;
            if (hash) {
                initialPageId = hash.substring(1);
            }
        }

        if (initialPageId) {
            const targetPage = document.getElementById(initialPageId);

            if (targetPage && targetPage.classList.contains('page')) {
                document.querySelectorAll('.page').forEach(p => {
                    p.classList.remove('active', 'exit');
                });

                targetPage.classList.add('active');
                activePageId = initialPageId;
                updateNavHighlights(initialPageId);
                resetInnerScroll(targetPage);
            }
        }

        const activePage = document.querySelector('.page.active');
        if (activePage) activePageId = activePage.id;
        loadMediaForPage(activePage);
        initAnimations(activePage);
    }

    // ========== IMAGE & VIDEO LIGHTBOX MODAL ==========
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCloseBtn = document.querySelector('.lightbox-close');
    const lightboxBackdrop = document.querySelector('.lightbox-backdrop');
    const lightboxImgWrapper = document.querySelector('.lightbox-image-wrapper');
    let lastFocusedBeforeLightbox = null;

    function openLightbox(mediaEl) {
        if (!lightbox || !mediaEl) return;

        const isVideo = mediaEl.tagName === 'VIDEO';
        const src = isVideo
            ? (mediaEl.currentSrc || mediaEl.src || mediaEl.querySelector('source')?.src || mediaEl.querySelector('source')?.getAttribute('data-src'))
            : (mediaEl.currentSrc || mediaEl.src || mediaEl.getAttribute('data-src'));

        if (!src) return;

        lastFocusedBeforeLightbox = document.activeElement;

        if (isVideo && lightboxVideo && lightboxImg) {
            lightboxImg.hidden = true;
            lightboxImg.src = '';
            lightboxVideo.hidden = false;
            lightboxVideo.src = src;
            lightboxVideo.load();
            lightboxVideo.play().catch(() => {});
        } else if (lightboxImg) {
            if (lightboxVideo) {
                lightboxVideo.pause();
                lightboxVideo.hidden = true;
                lightboxVideo.removeAttribute('src');
            }
            lightboxImg.hidden = false;
            lightboxImg.src = src;
            lightboxImg.alt = mediaEl.alt || 'Vista ampliada';
        }

        const captionText = mediaEl.alt || mediaEl.getAttribute('aria-label') || '';
        if (captionText.trim() !== '') {
            lightboxCaption.textContent = captionText;
            lightboxCaption.classList.add('has-text');
        } else {
            lightboxCaption.textContent = '';
            lightboxCaption.classList.remove('has-text');
        }

        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        if (lightboxCloseBtn) lightboxCloseBtn.focus({ preventScroll: true });
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        if (lightboxVideo) lightboxVideo.pause();

        setTimeout(() => {
            if (!lightbox.classList.contains('active')) {
                if (lightboxImg) lightboxImg.src = '';
                if (lightboxVideo) {
                    lightboxVideo.removeAttribute('src');
                    lightboxVideo.load();
                }
            }
        }, 300);

        if (lastFocusedBeforeLightbox && typeof lastFocusedBeforeLightbox.focus === 'function') {
            lastFocusedBeforeLightbox.focus({ preventScroll: true });
            lastFocusedBeforeLightbox = null;
        }
    }

    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxImgWrapper) {
        lightboxImgWrapper.addEventListener('click', (e) => {
            if (e.target.tagName === 'VIDEO') return;
            closeLightbox();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('active')) {
                closeLightbox();
            } else if (mobileMenu && mobileMenu.classList.contains('open')) {
                setMenuOpen(false, true);
            }
        }
    });

    document.addEventListener('click', (e) => {
        const targetMedia = e.target.closest('.pdetail-image img, .pdetail-image-card img, .pdetail-tutorial-image img, .pdetail-tutorial-image video, .pdetail-images-2col img, img.zoomable');
        if (targetMedia) {
            e.preventDefault();
            openLightbox(targetMedia);
        }
    });

    // ========== COURSES ACCORDION ==========
    const coursesToggle = document.getElementById('courses-toggle-btn');
    const coursesList = document.getElementById('courses-list');

    if (coursesToggle && coursesList) {
        coursesToggle.addEventListener('click', () => {
            const isExpanded = coursesToggle.getAttribute('aria-expanded') === 'true';
            coursesToggle.setAttribute('aria-expanded', String(!isExpanded));
            coursesList.classList.toggle('open');
        });
    }

    // ========== CONTACT FORM (AJAX FORMSPREE) ==========
    const contactForm = document.querySelector('.contact-form');
    const formStatus = document.getElementById('contact-form-status');

    if (contactForm && formStatus) {
        const submitBtn = contactForm.querySelector('.contact-submit-btn');
        const originalBtnText = submitBtn ? submitBtn.textContent.trim() : 'Enviar mensaje';

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            formStatus.textContent = '';
            formStatus.className = 'form-status';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
            }

            try {
                const response = await fetch(contactForm.action, {
                    method: contactForm.method || 'POST',
                    body: new FormData(contactForm),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    contactForm.reset();
                    formStatus.textContent = '¡Mensaje enviado! Te responderé lo antes posible.';
                    formStatus.classList.add('form-status--success');
                } else {
                    const data = await response.json().catch(() => null);
                    const errorMsg = data?.errors?.map(err => err.message).join(', ')
                        || 'No se pudo enviar el mensaje. Intentá nuevamente o escribime por email.';
                    formStatus.textContent = errorMsg;
                    formStatus.classList.add('form-status--error');
                }
            } catch {
                formStatus.textContent = 'Ocurrió un problema de conexión. Intentá nuevamente en unos instantes.';
                formStatus.classList.add('form-status--error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    handleInitialRoute();
});
