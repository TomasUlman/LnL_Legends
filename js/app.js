'use strict';

// Sdílené selektory
const originalBackgroundImage = document.body.style.backgroundImage; // Uložení původního obrázku na pozadí
const quizContainer = document.querySelector('.quiz_container');
const quizList = document.querySelector('.quiz_list_container');
const menuLogo = document.querySelector('.menu_logo');
const user = document.querySelector('.user_info');
const copyright = document.getElementById('menu_copyright');

// App selektory
const loader = document.querySelector('.loader_container');
const userIcon = document.querySelector('.user_icon');
const userModal = document.querySelector('.user_modal');
const userModalOverlay = document.querySelector('.user_overlay');
const closeUserModalBtn = document.querySelector('.close_user_modal');
const resetAppBtn = document.querySelector('.reset_app_btn');

class App {
    constructor() {
        this._renderQuizList(quizzes);
        quizList.addEventListener('click', this._selectQuiz.bind(this));
        userIcon.addEventListener('click', this._openUserModal.bind(this));
        closeUserModalBtn.addEventListener('click', this._closeUserModal.bind(this));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !userModalOverlay.classList.contains('hidden'))
                this._closeUserModal();
        });
        resetAppBtn.addEventListener('click', this._resetLocalStorageData.bind(this));
    }

    _selectQuiz(e) {
        // Vybere název kvízu z datasetu tlačítka na které bylo kliknuto
        const quizClicked = e.target.closest('.play_quiz_btn').dataset.quiz_name;

        if (!quizClicked) return;

        this._startQuiz(quizClicked);
    }

    _startQuiz(quizName) {
        // Skryje quizList a zobrazí loader
        quizList.style.display = 'none';
        loader.style.display = 'flex';
        menuLogo.classList.add('hidden');
        user.classList.add('hidden');
        document.body.style.backgroundImage = "none";
        copyright.classList.add('hidden');

        // Podle názvu kvízu vybere kvíz z pole
        const quizData = quizzes.find(quiz => quiz.quizCardData.name === quizName);

        // Nastaví časovač na 2 sekundy
        setTimeout(() => {
            // Skryje loader
            loader.style.display = 'none';

            // Zobrazí quizContainer
            quizContainer.style.display = 'flex';

            // Vytvoření kvízu
            new Quiz(
                quizData.id,
                quizData.questions,
                quizData.map,
                quizData.mapPosition,
                quizData.minZoomLevel,
                quizData.maxZoomLevel,
                quizData.dragging,
                quizData.timer,
                quizData.referenceDistance
            );
        }, 2000);
    }

    _renderQuizList(quizList) {
        quizList.forEach(quiz => this._renderQuiz(quiz));
    }

    _renderQuiz(quiz) {
        // Podle id kvízu získá historické score z local storage
        const quizScore = localStorage.getItem(quiz.id) ?
            JSON.parse(localStorage.getItem(quiz.id)).score : 'N/A';

        const html = `        
        <div class="quiz_card">
            <div class="card_img_side">
                <img src="${quiz.quizCardData.imgUrl}" alt="quiz-image">
            </div>
            <div class="card_data_side">
                <div class="card_header">
                    <h3>${quiz.quizCardData.name}</h3>
                </div>
                <div class="card_row">
                    <div class="card_column">
                        <div>Map: &ensp;<span>${quiz.quizCardData.mapStyle}</span></div>
                        <div class="mt5px">Level: &ensp;
                            <span style="color: ${quiz.quizCardData.lvlColor};">${quiz.quizCardData.level}</span>
                        </div>
                    </div>
                    <div class="card_column">
                        <div>Dragging: &ensp;<span>${quiz.dragging ? 'On' : 'Off'}</span></div>
                        <div class="mt5px">Zooming: &ensp;
                            <span>${quiz.minZoomLevel === quiz.maxZoomLevel ? 'Off' : 'On'}</span>
                        </div>
                    </div>
                    <div class="card_column">
                        <div>Best score: &ensp;<span data-quiz_id="${quiz.id}">${quizScore}</span></div>
                        <div class="mt5px">
                            <button class="play_quiz_btn" data-quiz_name="${quiz.quizCardData.name}">
                                Play
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
        quizList.insertAdjacentHTML('beforeend', html);
    }

    _resetLocalStorageData() {
        // Smaže všechny quiz score z local storage a nastaví na kartě kvízu score na N/A
        quizzes.forEach(quiz => {
            localStorage.removeItem(quiz.id);
            document.querySelector(`[data-quiz_id="${quiz.id}"]`).textContent = 'N/A';
        });
        this._closeUserModal();
    }

    _openUserModal() {
        userModal.style.display = 'flex';
        userModalOverlay.classList.remove('hidden');
    }

    _closeUserModal() {
        userModal.style.display = 'none';
        userModalOverlay.classList.add('hidden');
    }
}

const app = new App();