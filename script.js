document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const closeMenu = document.querySelector('.close-menu');
    const mobileNav = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-overlay a');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.add('open');
            document.body.style.overflow = 'hidden'; // block scrolling
        });

        closeMenu.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = 'auto';
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // --- 2. Language Switcher & Translations ---
    const langBtn = document.getElementById('current-lang');
    const langSwitcher = document.querySelector('.lang-switcher');
    const langLinks = document.querySelectorAll('.lang-dropdown a');
    const metaKeywords = document.getElementById('meta-keywords');

    let translations = {};
    const supportedLangs = ['en', 'de', 'es', 'pl', 'uk', 'ru'];

    // Get Browser Language
    const getBrowserLang = () => {
        const langCode = navigator.language || navigator.userLanguage;
        const shortLang = langCode.substring(0, 2).toLowerCase();
        return supportedLangs.includes(shortLang) ? shortLang : 'en'; // Fallback to EN
    };

    // Toggle dropdown
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            langSwitcher.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!langSwitcher.contains(e.target)) {
                langSwitcher.classList.remove('active');
            }
        });
    }

    // Load translations
    const loadTranslations = async () => {
        try {
            const isLocalFile = window.location.protocol === 'file:';
            const isSubdir = window.location.pathname.includes('/de/') ||
                             window.location.pathname.includes('/es/') ||
                             window.location.pathname.includes('/pl/') ||
                             window.location.pathname.includes('/uk/') ||
                             window.location.pathname.includes('/ru/');
            const fetchPath = isLocalFile && isSubdir ? '../data/translations.json' : '/data/translations.json';
            const response = await fetch(fetchPath);
            translations = await response.json();

            // Detect current page language from html lang attribute (e.g. /de/, /pl/)
            const htmlLang = document.documentElement.lang;
            let currentLang = htmlLang && supportedLangs.includes(htmlLang) ? htmlLang : 'en';

            // Only on root page check URL param or saved preference
            if (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '') {
                const urlParams = new URLSearchParams(window.location.search);
                const urlLang = urlParams.get('lang');
                if (urlLang && supportedLangs.includes(urlLang.toLowerCase())) {
                    currentLang = urlLang.toLowerCase();
                } else {
                    const savedLang = localStorage.getItem('glilang');
                    if (savedLang && supportedLangs.includes(savedLang)) {
                        currentLang = savedLang;
                    }
                }
            }

            setLanguage(currentLang);

        } catch (error) {
            console.error('Error loading translations:', error);
        }
    };

    const updateLangButton = (langCode) => {
        const flagSrc = {
            'en': 'gb',
            'de': 'de',
            'es': 'es',
            'pl': 'pl',
            'uk': 'ua',
            'ru': 'ru'
        }[langCode];

        if (langBtn) {
            langBtn.innerHTML = `<img src="https://flagcdn.com/w20/${flagSrc}.png" alt="${langCode.toUpperCase()}"> ${langCode.toUpperCase()}`;
        }
    };

    const updateHCaptchaLang = (langCode) => {
        const hcaptchaContainer = document.getElementById('hcaptcha-container');
        if (!hcaptchaContainer) return;

        // Clear existing widget content and cleanup script
        hcaptchaContainer.innerHTML = '';
        window.hcaptcha = undefined;

        document.querySelectorAll('script[src*="hcaptcha.com"]').forEach(el => el.remove());

        // Create new hCaptcha script forcing the current language
        const script = document.createElement('script');
        script.src = `https://js.hcaptcha.com/1/api.js?hl=${langCode}&recaptchacompat=off&render=explicit`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            // Initialize widget once loaded
            setTimeout(() => {
                if (typeof hcaptcha !== 'undefined' && window.hcaptcha) {
                    window.hcaptcha.render(hcaptchaContainer, {
                        sitekey: '50b2fe65-b00b-4b9e-ad62-3ba471098be2'
                    });
                }
            }, 100);
        };
    };

    const setLanguage = (langCode) => {
        if (!translations[langCode]) return;

        // Change texts in DOM
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[langCode][key]) {
                el.innerHTML = translations[langCode][key];
            }
        });

        // Update SEO Title & Description
        if (translations[langCode]['page_title']) {
            document.title = translations[langCode]['page_title'];
        }
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && translations[langCode]['page_description']) {
            metaDesc.setAttribute('content', translations[langCode]['page_description']);
        }

        // Update SEO Keywords
        if (metaKeywords && translations[langCode]['keywords']) {
            metaKeywords.setAttribute('content', translations[langCode]['keywords']);
        }

        // Update document layout lang
        document.documentElement.lang = langCode;

        // Update Button
        updateLangButton(langCode);

        // Save preferences
        localStorage.setItem('glilang', langCode);

        // Update URL query param without reload only on root page
        try {
            const isRoot = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '';
            if (isRoot) {
                const currentUrl = new URL(window.location.href);
                if (currentUrl.searchParams.get('lang') !== langCode) {
                    currentUrl.searchParams.set('lang', langCode);
                    window.history.replaceState({}, '', currentUrl.toString());
                }
            }
        } catch (e) {
            // Silently fallback if URL manipulation is restricted
        }

        // Hide dropdown
        if (langSwitcher) langSwitcher.classList.remove('active');

        // Refresh hCaptcha in new language
        updateHCaptchaLang(langCode);
    };

    // Events for language change
    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const langCode = link.getAttribute('data-lang');
            if (langCode) {
                localStorage.setItem('glilang', langCode);
            }
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                // Natural navigation to target language page (/es/, /pl/, /de/, /uk/, /ru/, /)
                return;
            }
            e.preventDefault();
            setLanguage(langCode);
        });
    });

    // Start loading translations
    loadTranslations();

    // --- 3. Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- 4. Contact Form Handling ---
    const contactForm = document.getElementById('main-contact-form');
    const resultMsg = document.getElementById('form-result-msg');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            const lang = document.documentElement.lang || 'en';

            submitBtn.innerHTML = translations[lang] && translations[lang]['form_sending'] ? translations[lang]['form_sending'] : 'Sending...';
            submitBtn.disabled = true;

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
                .then(async (response) => {
                    let json = await response.json();
                    resultMsg.style.display = 'block';
                    if (response.status == 200) {
                        resultMsg.style.backgroundColor = '#d4edda';
                        resultMsg.style.color = '#155724';
                        resultMsg.innerHTML = translations[lang] && translations[lang]['form_success'] ? translations[lang]['form_success'] : 'Message sent successfully!';
                        contactForm.reset();
                        if (typeof hcaptcha !== 'undefined') {
                            hcaptcha.reset();
                        }
                    } else {
                        console.log(response);
                        resultMsg.style.backgroundColor = '#f8d7da';
                        resultMsg.style.color = '#721c24';
                        resultMsg.innerHTML = translations[lang] && translations[lang]['form_error'] ? translations[lang]['form_error'] : 'An error occurred. Try again.';
                    }
                })
                .catch(error => {
                    console.log(error);
                    resultMsg.style.display = 'block';
                    resultMsg.style.backgroundColor = '#f8d7da';
                    resultMsg.style.color = '#721c24';
                    resultMsg.innerHTML = translations[lang] && translations[lang]['form_error'] ? translations[lang]['form_error'] : 'An error occurred. Check connection.';
                })
                .finally(() => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    setTimeout(() => { resultMsg.style.display = 'none'; }, 5000);
                });
        });
    }

    // --- 5. Image Carousel for Units Section ---
    const track = document.querySelector('.carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.querySelector('.carousel-btn.next-btn');
        const prevButton = document.querySelector('.carousel-btn.prev-btn');
        const dots = document.querySelectorAll('.carousel-dots .dot');

        let slideIndex = 0;
        let slideInterval;

        const moveToSlide = (index) => {
            // Apply transform to slide entire track
            track.style.transform = 'translateX(-' + index * 100 + '%)';

            // Highlight right dot
            dots.forEach(d => d.classList.remove('active'));
            if (dots[index]) dots[index].classList.add('active');

            slideIndex = index;
        }

        const nextSlide = () => {
            let nextIndex = slideIndex + 1;
            if (nextIndex >= slides.length) nextIndex = 0;
            moveToSlide(nextIndex);
        }

        const prevSlide = () => {
            let prevIndex = slideIndex - 1;
            if (prevIndex < 0) prevIndex = slides.length - 1;
            moveToSlide(prevIndex);
        }

        // Event listeners
        nextButton.addEventListener('click', () => {
            nextSlide();
            resetInterval();
        });

        prevButton.addEventListener('click', () => {
            prevSlide();
            resetInterval();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                moveToSlide(index);
                resetInterval();
            });
        });

        // Auto rotate every 5 seconds
        const startInterval = () => {
            slideInterval = setInterval(nextSlide, 5000);
        };

        const resetInterval = () => {
            clearInterval(slideInterval);
            startInterval();
        };

        startInterval();
    }

    // --- 5. FAQ Accordion Toggle ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');

            // Close all items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // If it was not active, open it
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
});

