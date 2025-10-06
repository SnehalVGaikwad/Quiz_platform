// ===========================================
// FIREBASE CONFIGURATION - REPLACE WITH YOUR CONFIG
// ===========================================
const firebaseConfig = {
    // REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
    apiKey: "AIzaSyBnE7n0pCj4Wluw3UhxK6hLqBz3YGPrNrE",
    authDomain: "quizmasterapp-643dd.firebaseapp.com",
    projectId: "quizmasterapp-643dd",
    storageBucket: "quizmasterapp-643dd.firebasestorage.app",
    messagingSenderId: "256493990365",
    appId: "1:256493990365:web:e8536a3a0d588cfd624634"
    
    // To get your config:
    // 1. Go to Firebase Console (https://console.firebase.google.com)
    // 2. Create a new project or select existing
    // 3. Go to Project Settings > General > Your apps
    // 4. Add a web app and copy the config object
    // 5. Replace the values above with your actual config
};

// ===========================================
// APPLICATION STATE
// ===========================================
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let isFirebaseEnabled = false;
let isDemo = false;

// Demo quiz data
const demoQuiz = {
    id: 'demo',
    title: 'Sample Quiz - Test Your Knowledge',
    questions: [
        {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correct: 1
        },
        {
            question: "What is the capital of France?",
            options: ["Berlin", "Madrid", "Paris", "Rome"],
            correct: 2
        },
        {
            question: "Which planet is closest to the Sun?",
            options: ["Venus", "Mercury", "Earth", "Mars"],
            correct: 1
        },
        {
            question: "What is the largest ocean?",
            options: ["Atlantic", "Indian", "Arctic", "Pacific"],
            correct: 3
        },
        {
            question: "Who painted the Mona Lisa?",
            options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
            correct: 2
        }
    ],
    shareLink: window.location.origin + window.location.pathname + '?quiz=demo',
    createdBy: 'Demo',
    createdDate: new Date()
};

// ===========================================
// FIREBASE INITIALIZATION
// ===========================================
function initializeFirebase() {
    try {
        // Check if config is properly set
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key-here") {
            console.warn('Firebase not configured - using demo mode');
            showMessage('Running in demo mode. Configure Firebase for full functionality.', 'info');
            initializeApp();
            return;
        }

        // Initialize Firebase
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        isFirebaseEnabled = true;

        console.log('Firebase initialized successfully');

        // Auth state observer
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            updateUI();
        });

        initializeApp();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Firebase connection failed. Running in demo mode.');
        initializeApp();
    }
}

// ===========================================
// APP INITIALIZATION
// ===========================================
function initializeApp() {
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
    }, 1000);

    // Initialize event listeners
    initializeEventListeners();

    // Check for quiz parameter in URL
    checkURLParameters();

    // Update UI based on current state
    updateUI();

    console.log('App initialized successfully');
}

function initializeEventListeners() {
    // Navigation buttons
    document.getElementById('loginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('registerBtn').addEventListener('click', () => showModal('registerModal'));
    document.getElementById('createQuizBtn').addEventListener('click', handleCreateQuizClick);
    document.getElementById('takeDemoBtn').addEventListener('click', startDemoQuiz);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('newQuizBtn').addEventListener('click', () => showModal('createQuizModal'));
    document.getElementById('backToHomeBtn').addEventListener('click', showLandingPage);

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('createQuizForm').addEventListener('submit', handleCreateQuiz);
    document.getElementById('participantForm').addEventListener('submit', handleStartQuiz);

    // Modal controls
    document.addEventListener('click', handleModalClose);

    // Quiz controls
    document.getElementById('nextQuestionBtn').addEventListener('click', handleNextQuestion);
    document.getElementById('retakeQuizBtn').addEventListener('click', retakeQuiz);

    // Quiz creation
    document.getElementById('addQuestionBtn').addEventListener('click', addQuestionField);

    // Copy link functionality
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareableLink);
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    
    if (quizId) {
        if (quizId === 'demo') {
            showModal('participantModal');
        } else if (isFirebaseEnabled) {
            loadQuizForParticipant(quizId);
        } else {
            showError('Quiz not found. Firebase is required for shared quizzes.');
        }
    }
}

// ===========================================
// UI STATE MANAGEMENT
// ===========================================
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const createQuizBtn = document.getElementById('createQuizBtn');

    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        createQuizBtn.textContent = 'Dashboard';
    } else {
        loginBtn.style.display = 'inline-flex';
        registerBtn.style.display = 'inline-flex';
        createQuizBtn.textContent = 'Create Quiz';
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show requested section
    document.getElementById(sectionId).classList.remove('hidden');
}

function showLandingPage() {
    showSection('landingPage');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
}

// ===========================================
// MODAL MANAGEMENT
// ===========================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function handleModalClose(event) {
    if (event.target.classList.contains('modal-close') || 
        event.target.dataset.modal ||
        event.target.classList.contains('modal')) {
        
        const modalId = event.target.dataset.modal || 
                       event.target.closest('.modal')?.id;
        
        if (modalId) {
            hideModal(modalId);
        }
    }
}

// ===========================================
// AUTHENTICATION
// ===========================================
async function handleLogin(event) {
    event.preventDefault();
    
    if (!isFirebaseEnabled) {
        showError('Authentication requires Firebase configuration.');
        return;
    }

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideModal('loginModal');
        showMessage('Login successful!', 'success');
        showAdminDashboard();
    } catch (error) {
        console.error('Login error:', error);
        showError(getErrorMessage(error));
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    if (!isFirebaseEnabled) {
        showError('Registration requires Firebase configuration.');
        return;
    }

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
    }

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        hideModal('registerModal');
        showMessage('Registration successful!', 'success');
        showAdminDashboard();
    } catch (error) {
        console.error('Registration error:', error);
        showError(getErrorMessage(error));
    }
}

async function handleLogout() {
    try {
        if (isFirebaseEnabled) {
            await auth.signOut();
        }
        currentUser = null;
        showMessage('Logged out successfully!', 'success');
        showLandingPage();
        updateUI();
    } catch (error) {
        console.error('Logout error:', error);
        showError('Error logging out.');
    }
}

// ===========================================
// QUIZ CREATION
// ===========================================
function handleCreateQuizClick() {
    if (currentUser) {
        showAdminDashboard();
    } else {
        showModal('loginModal');
    }
}

async function handleCreateQuiz(event) {
    event.preventDefault();

    const title = document.getElementById('quizTitleInput').value.trim();
    const questionItems = document.querySelectorAll('.question-item');

    if (!title) {
        showError('Please enter a quiz title.');
        return;
    }

    if (questionItems.length === 0) {
        showError('Please add at least one question.');
        return;
    }

    const questions = [];
    let isValid = true;

    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-input').value.trim();
        const options = Array.from(item.querySelectorAll('.option-input')).map(input => input.value.trim());
        const correctAnswer = item.querySelector('input[name="correct_' + index + '"]:checked');

        if (!questionText) {
            showError(`Question ${index + 1}: Please enter the question text.`);
            isValid = false;
            return;
        }

        if (options.some(option => !option)) {
            showError(`Question ${index + 1}: Please fill all option fields.`);
            isValid = false;
            return;
        }

        if (!correctAnswer) {
            showError(`Question ${index + 1}: Please select the correct answer.`);
            isValid = false;
            return;
        }

        questions.push({
            question: questionText,
            options: options,
            correct: parseInt(correctAnswer.value)
        });
    });

    if (!isValid) return;

    try {
        const quizId = await saveQuiz(title, questions);
        const shareLink = `${window.location.origin}${window.location.pathname}?quiz=${quizId}`;
        
        document.getElementById('shareableLink').value = shareLink;
        hideModal('createQuizModal');
        showModal('quizLinkModal');
        
        // Reset form
        document.getElementById('createQuizForm').reset();
        document.getElementById('questionsContainer').innerHTML = '';
        
        // Refresh dashboard if on dashboard
        if (!document.getElementById('adminDashboard').classList.contains('hidden')) {
            loadAdminDashboard();
        }
        
    } catch (error) {
        console.error('Quiz creation error:', error);
        showError('Error creating quiz. Please try again.');
    }
}

async function saveQuiz(title, questions) {
    const quiz = {
        title: title,
        questions: questions,
        createdBy: currentUser ? currentUser.uid : 'anonymous',
        createdDate: new Date(),
        shareLink: ''
    };

    if (isFirebaseEnabled && currentUser) {
        const docRef = await db.collection('quizzes').add(quiz);
        quiz.shareLink = `${window.location.origin}${window.location.pathname}?quiz=${docRef.id}`;
        await docRef.update({ shareLink: quiz.shareLink });
        return docRef.id;
    } else {
        // Fallback to local storage
        const quizId = 'local_' + Date.now();
        const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
        localQuizzes[quizId] = quiz;
        localStorage.setItem('quizzes', JSON.stringify(localQuizzes));
        return quizId;
    }
}

function addQuestionField() {
    const container = document.getElementById('questionsContainer');
    const questionIndex = container.children.length;
    
    const questionHTML = `
        <div class="question-item">
            <div class="question-header">
                <span class="question-number">Question ${questionIndex + 1}</span>
                <button type="button" class="remove-question" onclick="removeQuestion(this)">×</button>
            </div>
            <div class="form-group">
                <label class="form-label">Question Text</label>
                <input type="text" class="form-control question-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Options</label>
                <div class="options-grid">
                    ${[0, 1, 2, 3].map(optionIndex => `
                        <div class="option-group">
                            <input type="radio" name="correct_${questionIndex}" value="${optionIndex}" required>
                            <input type="text" class="form-control option-input" placeholder="Option ${optionIndex + 1}" required>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.remove();
    
    // Update question numbers
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        item.querySelector('.question-number').textContent = `Question ${index + 1}`;
        
        // Update radio button names
        const radios = item.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.name = `correct_${index}`;
        });
    });
}

// ===========================================
// ADMIN DASHBOARD
// ===========================================
async function showAdminDashboard() {
    showSection('adminDashboard');
    await loadAdminDashboard();
}

async function loadAdminDashboard() {
    try {
        const quizzes = await loadUserQuizzes();
        displayQuizzes(quizzes);
        
        const results = await loadQuizResults();
        displayResults(results);
        
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showError('Error loading dashboard data.');
    }
}

async function loadUserQuizzes() {
    if (isFirebaseEnabled && currentUser) {
        const snapshot = await db.collection('quizzes')
            .where('createdBy', '==', currentUser.uid)
            .orderBy('createdDate', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } else {
        // Fallback to local storage
        const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
        return Object.entries(localQuizzes).map(([id, quiz]) => ({
            id,
            ...quiz
        }));
    }
}

async function loadQuizResults() {
    if (isFirebaseEnabled && currentUser) {
        const userQuizzes = await loadUserQuizzes();
        const quizIds = userQuizzes.map(quiz => quiz.id);
        
        if (quizIds.length === 0) return [];
        
        const snapshot = await db.collection('results')
            .where('quizId', 'in', quizIds.slice(0, 10)) // Firestore limit
            .orderBy('completedAt', 'desc')
            .limit(10)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            quizTitle: userQuizzes.find(q => q.id === doc.data().quizId)?.title || 'Unknown Quiz'
        }));
    } else {
        // Fallback to local storage
        const localResults = JSON.parse(localStorage.getItem('results') || '[]');
        return localResults.slice(0, 10);
    }
}

function displayQuizzes(quizzes) {
    const container = document.getElementById('quizzesList');
    
    if (quizzes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No quizzes created yet.</p></div>';
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-item">
            <div>
                <h4>${escapeHtml(quiz.title)}</h4>
                <p>${quiz.questions.length} questions • Created ${formatDate(quiz.createdDate)}</p>
            </div>
            <div class="quiz-actions">
                <button class="btn btn--sm btn--outline" onclick="copyQuizLink('${quiz.shareLink || quiz.id}')">Share</button>
                <button class="btn btn--sm btn--outline" onclick="viewQuizResults('${quiz.id}')">Results</button>
            </div>
        </div>
    `).join('');
}

function displayResults(results) {
    const container = document.getElementById('resultsList');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No results yet.</p></div>';
        return;
    }
    
    container.innerHTML = results.map(result => `
        <div class="result-item">
            <div>
                <h4>${escapeHtml(result.userName)}</h4>
                <p>${result.score}/${result.totalQuestions} • ${escapeHtml(result.quizTitle)}</p>
                <p style="font-size: var(--font-size-xs);">${formatDate(result.completedAt)}</p>
            </div>
        </div>
    `).join('');
}

// ===========================================
// QUIZ TAKING
// ===========================================
function startDemoQuiz() {
    isDemo = true;
    currentQuiz = demoQuiz;
    showModal('participantModal');
}

async function loadQuizForParticipant(quizId) {
    try {
        let quiz = null;
        
        if (isFirebaseEnabled) {
            const doc = await db.collection('quizzes').doc(quizId).get();
            if (doc.exists) {
                quiz = { id: doc.id, ...doc.data() };
            }
        }
        
        if (!quiz) {
            // Try local storage
            const localQuizzes = JSON.parse(localStorage.getItem('quizzes') || '{}');
            if (localQuizzes[quizId]) {
                quiz = { id: quizId, ...localQuizzes[quizId] };
            }
        }
        
        if (quiz) {
            currentQuiz = quiz;
            showModal('participantModal');
        } else {
            showError('Quiz not found.');
            showLandingPage();
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
        showError('Error loading quiz.');
        showLandingPage();
    }
}

function handleStartQuiz(event) {
    event.preventDefault();
    
    const participantName = document.getElementById('participantName').value.trim();
    if (!participantName) {
        showError('Please enter your name.');
        return;
    }
    
    hideModal('participantModal');
    startQuiz(participantName);
}

function startQuiz(participantName) {
    if (!currentQuiz) {
        showError('No quiz loaded.');
        return;
    }
    
    // Initialize quiz state
    currentQuestionIndex = 0;
    userAnswers = [];
    
    // Set quiz title
    document.getElementById('quizTitle').textContent = currentQuiz.title;
    
    // Show quiz interface
    showSection('quizInterface');
    
    // Display first question
    displayQuestion();
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;
    
    // Update progress
    document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    
    // Display question
    document.getElementById('questionText').textContent = question.question;
    
    // Display options
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = question.options.map((option, index) => `
        <button class="option-button" data-option="${index}">
            ${escapeHtml(option)}
        </button>
    `).join('');
    
    // Add option click handlers
    optionsList.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', selectOption);
    });
    
    // Reset next button
    document.getElementById('nextQuestionBtn').disabled = true;
    document.getElementById('nextQuestionBtn').textContent = 
        currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question';
}

function selectOption(event) {
    // Remove previous selection
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Select current option
    event.target.classList.add('selected');
    
    // Store answer
    const selectedIndex = parseInt(event.target.dataset.option);
    userAnswers[currentQuestionIndex] = selectedIndex;
    
    // Enable next button
    document.getElementById('nextQuestionBtn').disabled = false;
}

function handleNextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        finishQuiz();
    }
}

async function finishQuiz() {
    try {
        // Calculate score
        let score = 0;
        currentQuiz.questions.forEach((question, index) => {
            if (userAnswers[index] === question.correct) {
                score++;
            }
        });
        
        const participantName = document.getElementById('participantName').value;
        
        // Save result
        await saveQuizResult({
            quizId: currentQuiz.id,
            userName: participantName,
            score: score,
            totalQuestions: currentQuiz.questions.length,
            answers: userAnswers,
            completedAt: new Date()
        });
        
        // Show results
        showQuizResults(score, currentQuiz.questions.length);
        
    } catch (error) {
        console.error('Error finishing quiz:', error);
        showError('Error saving results.');
    }
}

async function saveQuizResult(result) {
    if (isFirebaseEnabled) {
        await db.collection('results').add(result);
    } else {
        // Fallback to local storage
        const localResults = JSON.parse(localStorage.getItem('results') || '[]');
        localResults.unshift({ ...result, id: Date.now().toString() });
        // Keep only last 100 results
        if (localResults.length > 100) {
            localResults.length = 100;
        }
        localStorage.setItem('results', JSON.stringify(localResults));
    }
}

function showQuizResults(score, totalQuestions) {
    showSection('resultsPage');
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('totalQuestions').textContent = totalQuestions;
    
    const percentage = (score / totalQuestions) * 100;
    let message = '';
    
    if (percentage >= 90) {
        message = 'Excellent work!';
    } else if (percentage >= 70) {
        message = 'Great job!';
    } else if (percentage >= 50) {
        message = 'Good effort!';
    } else {
        message = 'Keep practicing!';
    }
    
    document.getElementById('scoreMessage').textContent = message;
}

function retakeQuiz() {
    if (currentQuiz) {
        const participantName = document.getElementById('participantName').value;
        startQuiz(participantName);
    }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
function copyQuizLink(link) {
    const fullLink = link.startsWith('http') ? link : `${window.location.origin}${window.location.pathname}?quiz=${link}`;
    
    navigator.clipboard.writeText(fullLink).then(() => {
        showMessage('Quiz link copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = fullLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMessage('Quiz link copied to clipboard!', 'success');
    });
}

function copyShareableLink() {
    const link = document.getElementById('shareableLink').value;
    copyQuizLink(link);
}

function viewQuizResults(quizId) {
    // This would typically show detailed results for a specific quiz
    showMessage('Detailed results view coming soon!', 'info');
}

function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: var(--color-${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'});
        color: white;
        border-radius: var(--radius-base);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    showModal('errorModal');
}

function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

function formatDate(date) {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================================
// INITIALIZE APP ON PAGE LOAD
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Quiz Platform starting...');
    initializeFirebase();
});

// Add some basic toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(toastStyles);
