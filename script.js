document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Reveal Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Special handling for skill bars
                if (entry.target.classList.contains('stack-box')) {
                    const skillBars = entry.target.querySelectorAll('.bar-fill');
                    skillBars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // 2. Smooth Scroll for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Header Scroll Effect
    const header = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.8)';
            header.style.boxShadow = 'none';
        }
    });

    // 4. Parallax effect for hero image (subtle)
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        window.addEventListener('scroll', () => {
            const speed = 0.15;
            const yPos = -(window.scrollY * speed);
            heroVisual.style.transform = `translateY(${yPos}px)`;
        });
    }

    // 5. Free Board Logic (Firebase Firestore)
    const firebaseConfig = {
        apiKey: "AIzaSyBi9OWT3-bSyjVqvGlgNkZ4XPsghqPDrfw",
        authDomain: "kangjisaekki.firebaseapp.com",
        projectId: "kangjisaekki",
        storageBucket: "kangjisaekki.firebasestorage.app",
        messagingSenderId: "971078364697",
        appId: "1:971078364697:web:5d31f9f27334517087c488",
        measurementId: "G-ZFMS9HBEZY"
    };
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const boardCollection = db.collection("free_board_items");

    const boardForm = document.getElementById('board-form');
    const boardContainer = document.getElementById('board-items-container');
    const MASTER_PWD = "20252579";

    let currentEditId = null;

    const btnToggleWrite = document.getElementById('btn-toggle-write');
    const formWrapper = document.getElementById('board-form-wrapper');
    const btnCancelWrite = document.getElementById('btn-cancel-write');
    const formTitle = document.getElementById('board-form-title');

    if (btnToggleWrite && formWrapper) {
        btnToggleWrite.addEventListener('click', () => {
            currentEditId = null;
            if(formTitle) formTitle.innerHTML = '<span data-lang="ko">문의 및 요청사항 등록</span><span data-lang="en">Register Inquiry & Request</span>';
            if(boardForm) boardForm.reset();
            formWrapper.classList.add('active');
            btnToggleWrite.style.display = 'none';
        });

        if (btnCancelWrite) {
            btnCancelWrite.addEventListener('click', () => {
                formWrapper.classList.remove('active');
                btnToggleWrite.style.display = 'inline-block';
                currentEditId = null;
                if(boardForm) boardForm.reset();
            });
        }
    }

    let allBoardItems = [];

    function renderBoardItems(items) {
        if (!boardContainer) return;
        boardContainer.innerHTML = '';
        
        if (items.length === 0) {
            boardContainer.innerHTML = '<p class="board-empty"><span data-lang="ko">등록된 게시물이 없습니다.</span><span data-lang="en">There are no posts registered.</span></p>';
            return;
        }

        // Sort descending by createdAt
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(item => {
            const el = document.createElement('div');
            el.className = 'board-card';
            
            let repliesHtml = '';
            if (item.replies && item.replies.length > 0) {
                const replies = item.replies.map(r => {
                    const safeText = r.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    return `<div class="board-reply"><span class="reply-icon">↳</span> <span class="reply-text">${safeText}</span> <span class="reply-date">${r.date}</span></div>`;
                }).join('');
                repliesHtml = '<div class="board-replies">' + replies + '</div>';
            }

            const safeContent = item.content.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
            const safeName = item.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const safeEmail = item.email.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            const editBtnHtml = `<button type="button" class="btn btn-small secondary btn-edit" data-id="${item.id}"><span data-lang="ko">수정</span><span data-lang="en">Edit</span></button>`;
            const deleteBtnHtml = `<button type="button" class="btn btn-small danger btn-delete" data-id="${item.id}"><span data-lang="ko">삭제</span><span data-lang="en">Delete</span></button>`;
            
            const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
            const isLiked = likedPosts.includes(item.id);
            const likeCount = item.likes || 0;
            const thumbIcon = isLiked ? 'fa-solid fa-thumbs-up' : 'fa-regular fa-thumbs-up';
            const likeBtnStyle = isLiked 
                ? 'margin-right: auto; background: var(--brand-red); color: #fff; border: 1px solid var(--brand-red);' 
                : 'margin-right: auto; background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-light);';

            const likeBtnHtml = `<button type="button" class="btn btn-small btn-like ${isLiked ? 'liked' : ''}" data-id="${item.id}" style="${likeBtnStyle}"><i class="${thumbIcon}"></i> <span data-lang="ko">${isLiked ? '추천 취소' : '추천'}</span><span data-lang="en">${isLiked ? 'Unlike' : 'Like'}</span> <strong>${likeCount}</strong></button>`;

            el.innerHTML = `
                <div class="board-card-header">
                    <span class="board-author">${safeName} <small>(${safeEmail})</small></span>
                    <span class="board-date">${item.date}</span>
                </div>
                <div class="board-card-body">
                    ${safeContent}
                </div>
                ${repliesHtml}
                <div class="board-card-actions">
                    ${likeBtnHtml}
                    <div class="reply-input-group" style="display:none;">
                        <input type="text" class="reply-input" data-ko-placeholder="답변을 입력하세요..." data-en-placeholder="Enter your reply..." placeholder="${document.body.classList.contains('en-mode') ? 'Enter your reply...' : '답변을 입력하세요...'}">
                        <button type="button" class="btn btn-small primary btn-reply-submit" data-id="${item.id}"><span data-lang="ko">등록</span><span data-lang="en">Submit</span></button>
                    </div>
                    <button type="button" class="btn btn-small secondary btn-reply-toggle"><span data-lang="ko">답변 달기</span><span data-lang="en">Reply</span></button>
                    ${editBtnHtml}
                    ${deleteBtnHtml}
                </div>
            `;
            boardContainer.appendChild(el);
        });

        // Delete handlers
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const item = allBoardItems.find(i => i.id === id);
                if (!item) return;

                const isEn = document.body.classList.contains('en-mode');
                const inputPwd = prompt(isEn ? "Enter the post password or master password:" : "게시물 비밀번호 또는 마스터 비밀번호를 입력하세요:");
                if (inputPwd === null) return;
                
                if (inputPwd !== item.password && inputPwd !== MASTER_PWD) {
                    alert(isEn ? "Password does not match." : "비밀번호가 일치하지 않습니다.");
                    return;
                }

                if(confirm(isEn ? 'Are you sure you want to delete this post?' : '정말 게시물을 삭제하시겠습니까?')) {
                    try {
                        await boardCollection.doc(id).delete();
                    } catch (error) {
                        console.error("Error deleting doc: ", error);
                        alert(isEn ? "An error occurred during deletion." : "삭제 중 오류가 발생했습니다.");
                    }
                }
            });
        });

        // Edit handlers
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const item = allBoardItems.find(i => i.id === id);
                if (!item) return;

                const isEn = document.body.classList.contains('en-mode');
                const inputPwd = prompt(isEn ? "Enter the post password or master password:" : "게시물 작성 시 설정한 비밀번호 또는 마스터 비밀번호를 입력하세요:");
                if (inputPwd === null) return;
                
                if (inputPwd !== item.password && inputPwd !== MASTER_PWD) {
                    alert(isEn ? "Password does not match." : "비밀번호가 일치하지 않습니다.");
                    return;
                }

                if (formWrapper) {
                    currentEditId = id;
                    document.getElementById('b-name').value = item.name;
                    document.getElementById('b-email').value = item.email;
                    document.getElementById('b-content').value = item.content;
                    if(document.getElementById('b-pwd')) document.getElementById('b-pwd').value = item.password || ''; 
                    
                    if(formTitle) formTitle.innerHTML = '<span data-lang="ko">게시물 수정</span><span data-lang="en">Edit Post</span>';
                    formWrapper.classList.add('active');
                    if(btnToggleWrite) btnToggleWrite.style.display = 'none';
                    formWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // Reply Toggle
        document.querySelectorAll('.btn-reply-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.target.previousElementSibling;
                const isHidden = group.style.display === 'none';
                document.querySelectorAll('.reply-input-group').forEach(g => g.style.display = 'none');
                if (isHidden) {
                    group.style.display = 'flex';
                    group.querySelector('input').focus();
                }
            });
        });

        // Reply Submit
        document.querySelectorAll('.btn-reply-submit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const input = e.target.previousElementSibling;
                const replyText = input.value.trim();
                
                if (replyText) {
                    const item = allBoardItems.find(i => i.id === id);
                    if (item) {
                        const newReplies = item.replies ? [...item.replies] : [];
                        const now = new Date();
                        const dateString = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                        newReplies.push({ text: replyText, date: dateString });
                        
                        try {
                            await boardCollection.doc(id).update({
                                replies: newReplies
                            });
                            input.value = '';
                        } catch (error) {
                            console.error("Error updating doc: ", error);
                            const isEn = document.body.classList.contains('en-mode');
                            alert(isEn ? "Failed to register reply." : "답변 등록에 실패했습니다.");
                        }
                    }
                }
            });
        });
        
        // Like Handlers
        document.querySelectorAll('.btn-like').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.currentTarget;
                const id = button.dataset.id;
                const item = allBoardItems.find(i => i.id === id);
                if (!item) return;
                
                let likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
                const isLiked = likedPosts.includes(id);
                
                let newLikes = item.likes || 0;
                
                if (isLiked) {
                    newLikes = Math.max(0, newLikes - 1);
                    likedPosts = likedPosts.filter(postId => postId !== id);
                } else {
                    newLikes += 1;
                    likedPosts.push(id);
                }
                
                localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                
                try {
                    await boardCollection.doc(id).update({
                        likes: newLikes
                    });
                } catch (error) {
                    console.error("Error updating likes: ", error);
                    // Rollback local state on error
                    if (isLiked) {
                        likedPosts.push(id);
                    } else {
                        likedPosts = likedPosts.filter(postId => postId !== id);
                    }
                    localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                    const isEn = document.body.classList.contains('en-mode');
                    alert(isEn ? "Failed to process request." : "처리에 실패했습니다.");
                }
            });
        });

        document.querySelectorAll('.reply-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.nextElementSibling.click();
                }
            });
        });
    }

    if (boardForm) {
        boardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('b-name').value;
            const email = document.getElementById('b-email').value;
            const content = document.getElementById('b-content').value;
            const password = document.getElementById('b-pwd').value;
            const submitBtn = document.getElementById('btn-submit-write');
            
            const now = new Date();
            const dateString = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            
            if(submitBtn) submitBtn.disabled = true;

            try {
                if (currentEditId) {
                    await boardCollection.doc(currentEditId).update({
                        name,
                        email,
                        content,
                        password
                    });
                    const isEn = document.body.classList.contains('en-mode');
                    alert(isEn ? 'Successfully modified.' : '수정되었습니다.');
                } else {
                    await boardCollection.add({
                        name,
                        email,
                        content,
                        password,
                        date: dateString,
                        replies: [],
                        likes: 0,
                        createdAt: Date.now()
                    });
                    const isEn = document.body.classList.contains('en-mode');
                    alert(isEn ? 'Successfully registered.' : '등록되었습니다.');
                }
                
                boardForm.reset();
                currentEditId = null;
                if(formWrapper) formWrapper.classList.remove('active');
                if(btnToggleWrite) btnToggleWrite.style.display = 'inline-block';
            } catch (error) {
                console.error("Error writing doc: ", error);
                const isEn = document.body.classList.contains('en-mode');
                alert(isEn ? "An error occurred while saving. Please check permission settings." : "저장 중 오류가 발생했습니다. 권한 설정을 확인해주세요.");
            } finally {
                if(submitBtn) submitBtn.disabled = false;
            }
        });
    }

    if (boardContainer) {
        // Compat mode onSnapshot with JS side sorting
        boardCollection.onSnapshot((snapshot) => {
            const items = [];
            snapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });
            allBoardItems = items;
            renderBoardItems(items);
        }, (error) => {
            console.error("Realtime fetch error:", error);
        });
    }

    // 6. Background Particle Animation
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.5 + 0.5;
                this.color = `rgba(255, 80, 0, ${Math.random() * 0.5 + 0.2})`;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        // Adjust particle count based on screen width for performance and density
        const particleCount = window.innerWidth < 768 ? 40 : 80;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(225, 30, 0, ${0.1 - (distance / 1500)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // 7. Dynamic Typewriter Effect
    const typeTarget = document.getElementById('hero-typewriter');
    let typeWriterTimeout;
    
    function restartTypewriter() {
        if (!typeTarget) return;
        clearTimeout(typeWriterTimeout);
        typeTarget.innerHTML = '<span class="typed-text"></span><span class="cursor" style="color:var(--brand-orange); font-weight:bold; animation: blinkCursor 0.75s step-end infinite;">|</span>';
        const textSpan = typeTarget.querySelector('.typed-text');
        
        const isEn = document.body.classList.contains('en-mode');
        const rawText = isEn 
            ? "A reliability-focused engineer pushing the boundaries of\nsemiconductor yield with ultra-precision maintenance.\nI am Kang Jiwoo."
            : "초정밀 정비로 반도체 수율의 한계를 넘는\n신뢰성 중심 엔지니어, 강지우입니다.";
            
        let htmlStr = "";
        let i = 0;
        
        function typeWriter() {
            if (i < rawText.length) {
                let char = rawText.charAt(i);
                if (char === '\n') {
                    htmlStr += "<br>";
                } else if (!isEn && rawText.substring(i, i+3) === "강지우") {
                    htmlStr += "<b style='color:#fff'>강지우</b>";
                    i += 2; 
                } else if (isEn && rawText.substring(i, i+10) === "Kang Jiwoo") {
                    htmlStr += "<b style='color:#fff'>Kang Jiwoo</b>";
                    i += 9;
                } else {
                    htmlStr += char;
                }
                textSpan.innerHTML = htmlStr;
                i++;
                typeWriterTimeout = setTimeout(typeWriter, 60);
            }
        }
        typeWriterTimeout = setTimeout(typeWriter, 400);
    }
    
    if (typeTarget) {
        setTimeout(restartTypewriter, 800);
    }

    // Language Toggle Logic
    const langToggleBtn = document.getElementById('langToggleBtn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isEn = document.body.classList.contains('en-mode');
            
            if (isEn) {
                document.body.classList.remove('en-mode');
                localStorage.setItem('lang', 'ko');
                document.getElementById('langKo').className = 'active';
                document.getElementById('langEn').className = '';
            } else {
                document.body.classList.add('en-mode');
                localStorage.setItem('lang', 'en');
                document.getElementById('langKo').className = '';
                document.getElementById('langEn').className = 'active';
            }

            // Update placeholders
            document.querySelectorAll('input[data-ko-placeholder], textarea[data-ko-placeholder]').forEach(el => {
                if (document.body.classList.contains('en-mode')) {
                    el.placeholder = el.getAttribute('data-en-placeholder');
                } else {
                    el.placeholder = el.getAttribute('data-ko-placeholder');
                }
            });

            // Restart typewriter
            restartTypewriter();
        });

        // Initial check
        if (localStorage.getItem('lang') === 'en') {
            document.body.classList.add('en-mode');
            document.getElementById('langKo').className = '';
            document.getElementById('langEn').className = 'active';
            
            document.querySelectorAll('input[data-en-placeholder], textarea[data-en-placeholder]').forEach(el => {
                el.placeholder = el.getAttribute('data-en-placeholder');
            });
        }
    }

    // 8. Contact Form Logic (Firebase Firestore 연동)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-contact');
            const originalText = btn.innerText;
            btn.innerText = '전송 중...';
            btn.disabled = true;

            const name = document.getElementById('c-name').value;
            const email = document.getElementById('c-email').value;
            const message = document.getElementById('c-message').value;
            
            try {
                // 외부 이메일 API 설정 전이므로, 기존에 연결된 파이어베이스 데이터베이스에 즉시 저장
                await db.collection("contact_messages").add({
                    name: name,
                    email: email,
                    message: message,
                    createdAt: Date.now(),
                    date: new Date().toLocaleString()
                });

                const isEn = document.body.classList.contains('en-mode');
                alert(isEn ? 'Message successfully sent! I will reply as soon as possible.' : '메시지가 성공적으로 전송되었습니다! 빠른 시일 내에 답변 드리겠습니다.');
                contactForm.reset();
            } catch (error) {
                console.error('Contact form error:', error);
                const isEn = document.body.classList.contains('en-mode');
                alert(isEn ? 'An error occurred during transmission. Please try again.' : '전송 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
    // 9. Lightbox for Images
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    const lightboxImg = document.createElement('img');
    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);

    document.querySelectorAll('.project-gallery img, .humanoid-visual img, .case-study img').forEach(img => {
        img.addEventListener('click', (e) => {
            lightboxImg.src = e.target.src;
            lightbox.classList.add('active');
        });
    });

    lightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    // 10. Scroll to Top Button
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
