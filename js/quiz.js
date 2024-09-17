'use strict';

const questionImage = document.querySelector('.hint_img');
const timer = document.querySelector('.timer');
const scoreModal = document.querySelector(".score_modal");
const scoreOverlay = document.querySelector(".score_overlay");
const btnNext = document.querySelector(".btn_next");
const placeNameSpan = document.getElementById('place_name');
const distanceSpan = document.getElementById('distance_span');
const guessTimeSpan = document.getElementById('guess_time');
const guessScoreSpan = document.getElementById('guess_score');
const totalScoreSpan = document.getElementById('total_score');
const summaryModal = document.querySelector('.summary_modal');
const summaryOverlay = document.querySelector('.summary_overlay');
const summaryModalCloseBtn = document.querySelector('.close_summary_modal');
const summaryScoreSpan = document.querySelector('.summary_score');
const exitQuizBtn = document.querySelector('.exit_quiz_btn')

class Quiz {
    #map;
    #mapOptions = {
        zoomControl: false,
        attributionControl: false,
        minZoom: null,
        maxZoom: null,
        dragging: null,
    };
    #popupOptions = {
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        closeOnEscapeKey: false,
        closeButton: false,
        className: `marker_popup`
    }
    #customMarkerCorrect = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path fill="#00d103" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
    #customGuessMarker = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path fill="#e70404" d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`),
        iconSize: [32, 32], // Velikost ikony
        iconAnchor: [16, 32], // Ukotvení ikony
        popupAnchor: [0, -32], // Posunutí popupu nad ikonou
    });
    #currentQuestionIndex = 0;
    #timerInterval; // Timer
    #guessMarker;
    #correctMarker;
    #polyline;
    #confirmPosition; // Funkce
    #totalScore = 0;

    constructor(id, questionSet, mapStyle, mapPositon, minZoomLevel, maxZoomLevel, dragging, timer, referenceDistance) {
        this.id = id; // ID kvízu
        this.questionSet = questionSet; // Pole otázek
        this.mapStyle = mapStyle; // Styl / vzhled mapy (např. slepá mapa)
        this.mapPosition = mapPositon; // Souřadnice středu pohledu mapy při vytvoření
        this.minZoomLevel = minZoomLevel; // Minimální zoom na mapě
        this.timer = timer; // Časovač pro každou otázku
        this.referenceDistance = referenceDistance; // Tolerance přesnosti k vyhodnocení skóre dle vzdálenosti, čím nižší, tím přísnější
        this.#mapOptions.minZoom = minZoomLevel; // Int
        this.#mapOptions.maxZoom = maxZoomLevel; // Int
        this.#mapOptions.dragging = dragging; // true nebo false
        this._runQuiz(); // Spustí kvíz
        exitQuizBtn.addEventListener('click', this._quitQuiz.bind(this), { once: true })
    }

    // Založení mapy
    _loadMap() {
        this.#map = L.map('map', this.#mapOptions).setView(this.mapPosition, this.minZoomLevel);

        L.tileLayer(this.mapStyle).addTo(this.#map);
    }

    _runQuiz() {
        this._loadMap();
        const runNextQuestion = () => {
            // Spustí otázku dokud neproběhla poslední ze setu, pak zobrazí shrnutí
            if (this.#currentQuestionIndex < this.questionSet.length) {
                this._runQuestion(this.questionSet[this.#currentQuestionIndex], () => {
                    this.#currentQuestionIndex++;
                    runNextQuestion();
                });
            } else {
                this._displaySummary(); // Zobrazí shrnutí po skončení kvízu
            }
        };

        runNextQuestion(); // Spustí první otázku
    }

    _runQuestion(question, runNextQuestion) {
        // Nastavení obrázku z otázky
        questionImage.src = question.image;
        questionImage.alt = question.name;

        // Odstranění všech markerů a polyline z předchozí otázky
        if (this.#guessMarker) {
            this.#map.removeLayer(this.#guessMarker);
            this.#guessMarker = null;
        }
        if (this.#correctMarker) {
            this.#map.removeLayer(this.#correctMarker);
        }
        if (this.#polyline) {
            this.#map.removeLayer(this.#polyline);
        }

        // Nastaví map view
        this.#map.setView(this.mapPosition, this.minZoomLevel);

        // Ovládá kliknutí na mapu
        this.#map.on('click', (e) => this._displayGuessPosition(e));

        // Nastaví timer
        timer.textContent = this._formatTime(this.timer);

        // Vyhodnocení otázky
        const evaluateQuestion = () => {
            clearInterval(this.#timerInterval); // Zastaví časovač

            // Vytvoří marker správné pozice na mapě
            this._displayCorrectPosition(question.coords);

            // Kontrola zda byl zadán guess marker na mapu
            const guessCoords = this.#guessMarker
                ? [this.#guessMarker._latlng.lat, this.#guessMarker._latlng.lng]
                : [NaN, NaN];

            this._displayGuessScore(question.name, question.coords, guessCoords, timeLeft);
            btnNext.addEventListener('click', () => {
                scoreModal.classList.add('hidden');
                scoreOverlay.classList.add('hidden');
                runNextQuestion(); // Spustí další otázku po potvrzení
            }, { once: true });
        }

        let timeLeft = this.timer; // Časovač otázky

        // Timer tick
        const tick = () => {
            // Když vyprší čas vyhodnotí se otázka a vyresetuje timer
            if (timeLeft <= 0) {
                evaluateQuestion();
                clearInterval(this.#timerInterval); // Zastaví časovač
            } else {
                timeLeft--; // Odečtení vteřiny 
            }
            // Po každém ticku aktualizuje timer
            timer.textContent = this._formatTime(timeLeft);
        };

        // Timer se spustí až po načtení obrázku
        questionImage.onload = () => {
            // Spustí timer
            this.#timerInterval = setInterval(tick, 1000);
        }

        // Funkce kliknutí na tlačítko potvrzení guess markeru
        this.#confirmPosition = (e) => {
            if (e.target && e.target.classList.contains('btn_popup')) {
                evaluateQuestion();
            }
        };

        // Event listener kliknutí na tlačítko potvrzení guess markeru
        this.#map.getContainer().addEventListener('click', this.#confirmPosition);
    }

    _displayGuessPosition(e) {
        // Odstranění guess markeru z mapy, pokud byl vložen (aby byl na mapě vždy jeden)
        if (this.#guessMarker)
            this.#map.removeLayer(this.#guessMarker);

        // Vytvoření guess markeru 
        const { lat, lng } = e.latlng;
        this.#guessMarker = L.marker([lat, lng], { icon: this.#customGuessMarker });

        // Vložení markeru a popupu na mapu
        this.#guessMarker.addTo(this.#map)
            .bindPopup(L.popup(this.#popupOptions))
            .setPopupContent(`<div class="popup">
                        <p>CONFIRM</p>
                        <button class="btn_popup">&check;</button>
                   </div>`)
            .openPopup();
    }

    _displayCorrectPosition(coords) {
        let stopAnimation = false;

        // Přidání listeneru na tlačítko btnNext
        btnNext.addEventListener('click', () => {
            stopAnimation = true; // Zastaví vykreslování polyline při kliknutí na btnNext
        }, { once: true });

        // Vytvoření correct markeru
        this.#correctMarker = L.marker(coords, { icon: this.#customMarkerCorrect });

        // Vložení correct markeru do mapy
        this.#correctMarker.addTo(this.#map);

        // Zavřeni popupu guess markeru
        if (this.#guessMarker) {
            this.#guessMarker.closePopup();
            this.#guessMarker.unbindPopup();

            // Vytvoření hranic pohledu, který obsahuje oba markery
            const bounds = L.latLngBounds([this.#guessMarker._latlng, this.#correctMarker._latlng]);

            // Spočítání středního bodu mezi oběma markery markery
            const center = bounds.getCenter();

            // Spočítání zoomu, tak aby se do pohledu vešli oba markery
            const zoom = this.#map.getBoundsZoom(bounds) > this.minZoomLevel
                ? (this.#map.getBoundsZoom(bounds) - 1) : this.minZoomLevel;

            // Animovaně nastaví pohled na střed mezi markery a nastaví zoom
            this.#map.flyTo(center, zoom, {
                animate: true,
                duration: 1, // Animation duration in seconds
                easeLinearity: 0.25 // Animation speed
            });

            btnNext.addEventListener('click', () => {

            }, { once: true });

            // Přidání posluchače události na ukončení animace pohybu a vykreslení polyline
            this.#map.once('moveend', () => {
                if (!stopAnimation) { // Kontrola, zda bylo kliknuto na btnNext
                    this._renderPolyline(this.#guessMarker._latlng, this.#correctMarker._latlng);
                }
            });
        };
    }

    // Funkce pro animaci vykreslení polyline mezi markery
    _renderPolyline(startLatLng, endLatLng) {
        const duration = 1000;  // Doba trvání animace v milisekundách
        const startTime = Date.now();
        const options = { color: '#393E46', weight: 1, dashArray: '10, 10' };
        const line = L.polyline([startLatLng], options).addTo(this.#map);
        this.#polyline = line; // Uložení polyline pro další práci resp. mazání z mapy

        function update() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Interpolace mezi startLatLng a endLatLng
            const interpolatedLat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
            const interpolatedLng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;

            const currentPosition = L.latLng(interpolatedLat, interpolatedLng);

            // Nastavení nových bodů polyline
            line.setLatLngs([startLatLng, currentPosition]);

            // Pokud ještě není animace dokončena, pokračujeme
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Ujistíme se, že na konci animace nastavíme přesný konečný bod
                line.setLatLngs([startLatLng, endLatLng]);
            }
        }

        update();
    }

    _displayGuessScore(placeName, correctCoords, guessCoords, remainingSeconds) {
        // Zobrazí modální okno ve kterém se zobrazuje skóre otázky
        scoreModal.classList.remove('hidden');
        scoreOverlay.classList.remove('hidden');

        // Vypne možnost klikat na mapu
        this.#map.off('click');

        // Odstraní eventlistener z mapy pro klikání na potvrzovací tlačítko guess markeru
        this.#map.getContainer().removeEventListener('click', this.#confirmPosition);

        // Vzdálenost mezi markery
        const distance = this._calcDistance(guessCoords, correctCoords);

        // Skóre za otázku
        const score = this._calcGuessScore(guessCoords, distance, this.referenceDistance, remainingSeconds);

        // Přičtení skóre za otázku k celkovému skóre
        this.#totalScore += score;

        // Doplnění dat do span elementů v modálním okně skóre otázky
        placeNameSpan.textContent = `${placeName}`;
        distanceSpan.textContent = `${this._formatDistance(distance)}`;
        guessTimeSpan.textContent = `${this._formatTime(remainingSeconds)}`;
        guessScoreSpan.textContent = `${score}`;
        totalScoreSpan.textContent = `${this.#totalScore}`;
    }

    _displaySummary() {
        // Zobrazí total score
        summaryScoreSpan.textContent = this.#totalScore;

        // Nastaví scóre na kartu kvízu
        const currentQuizScoreSpan = document.querySelector(`[data-quiz_id="${this.id}"]`);
        const previousScore = currentQuizScoreSpan.textContent === 'N/A' ? 0 : +currentQuizScoreSpan.textContent;
        if (this.#totalScore > previousScore)
            currentQuizScoreSpan.textContent = this.#totalScore;

        // Uloží dosažené skóre kvízu do local storage
        this._storeQuizScore();

        // Zobrazí summary modal
        summaryModal.style.display = 'flex';
        summaryOverlay.classList.remove('hidden');

        this._quitQuiz();

        // Přidání event listnerů na zavření summary modalu
        summaryModalCloseBtn.addEventListener('click', this._closeSummaryModal, { once: true });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !summaryOverlay.classList.contains('hidden'))
                this._closeSummaryModal();
        }, { once: true });

    }

    _quitQuiz() {
        // Zobrazí seznam kvízů s skryje kvíz container
        quizContainer.style.display = 'none';
        quizList.style.display = 'flex';

        // Zobrazí menu logo
        menuLogo.classList.remove('hidden');

        // Obnovení původního obrázku pozadí
        document.body.style.backgroundImage = originalBackgroundImage;

        // Zobrazí copyright
        copyright.classList.remove('hidden');

        // Zobrazí user ikonu
        user.classList.remove('hidden');

        // Nastavení textu total score zpět na 0
        totalScoreSpan.textContent = 0;

        // Vynuluje timer
        if (this.#timerInterval)
            clearInterval(this.#timerInterval);

        // Vyčistí mapu
        this._clearMap();
    }

    _storeQuizScore() {
        // Načtení score kvízu z local storage pokud tam je
        const storedScore = JSON.parse(localStorage.getItem(this.id)) ?
            JSON.parse(localStorage.getItem(this.id)).score : null;

        // Uložení score kvízu do local storage pokud tam ještě není
        if (!storedScore)
            localStorage.setItem(this.id, JSON.stringify({ score: this.#totalScore }));

        // Uložení score kvízu do local storage pokud je menší než total score
        if (storedScore && (storedScore < this.#totalScore))
            localStorage.setItem(this.id, JSON.stringify({ score: this.#totalScore }));
    }

    _clearMap() {
        if (this.#map) {
            // Odstraní všechny vrstvy z mapy
            this.#map.eachLayer(layer => {
                this.#map.removeLayer(layer);
            });

            // Odstraní mapu
            this.#map.remove();
            this.#map = null; // Ujistit se, že proměnná map je nulová
        }
    }

    // formátování času na formát mm:ss
    _formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // Formátování vzdálenosti na formát km,m
    _formatDistance(distance) {
        // Kontrola, zda distance je skutečně číslo a není NaN
        if (!isFinite(distance)) {
            return 'N/A'; // Vrátí 'N/A', pokud vstup není číslo
        }

        if (distance < 1000) {
            return `${distance} m`; // Pokud je vzdálenost menší než 1000 metrů, vrátí hodnotu v metrech
        } else {
            const kilometers = distance / 1000;
            return `${kilometers.toFixed(2)} km`; // Pokud je vzdálenost větší než 1000 metrů, vrátí hodnotu v kilometrech s přesností na dvě desetinná místa
        }
    }

    // Haversinova metoda výpočtu vzdálenosti (výsledek je v metrech)
    _calcDistance(coords1, coords2) {
        const R = 6371e3; // Poloměr Země v metrech

        const lat1 = coords1[0] * Math.PI / 180; // Převod na radiány
        const lat2 = coords2[0] * Math.PI / 180; // Převod na radiány
        const deltaLat = (coords2[0] - coords1[0]) * Math.PI / 180;
        const deltaLon = (coords2[1] - coords1[1]) * Math.PI / 180;

        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Vzdálenost v metrech

        return distance.toFixed(0);
    }

    _calcGuessScore(coords, distanceInMeters, referenceDistanceInMeters, time) {
        // Pokud nebyl zadán guess marker, souřadnice jsou NaN a vrátí skóre 0
        if (isNaN(coords[0]) && isNaN(coords[1])) {
            return 0;
        }

        // Převod vzdálenosti na normalizovanou vzdálenost
        const normalizedDistance = (distanceInMeters / referenceDistanceInMeters);

        // Maximální skóre za vzdálenost a čas
        const maxDistanceScore = 1000;
        const maxTimeScore = 100;

        // Pokud je normalizovaná vzdálenost kladná vynásobí maxScore, jinak bude 0
        const distanceScore = Math.max(maxDistanceScore * (1 - normalizedDistance), 0);

        // Lineární výpočet time score
        const timeScore = (maxTimeScore * (time / this.timer));

        return Math.round(distanceScore + timeScore); // Zaokrouhlené skóre
    }

    _closeSummaryModal() {
        summaryModal.style.display = 'none';
        summaryOverlay.classList.add('hidden');
    }
}
