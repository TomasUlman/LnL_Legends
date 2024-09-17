**L&L Legends**

<u>Popis projektu:</u> <br>
L&L Legends je interaktivní hra s mapou, kde hráči zkoušejí lokalizovat různá místa na světě. Hra nabízí kvízy s různými úrovněmi obtížnosti a specifickými pravidly pro každý kvíz. Hráč uvidí obrázek daného místa a jeho úkolem je umístit marker na mapu na místo, kde si myslí, že se daná lokace nachází. Hra vyhodnocuje přesnost tipu na základě vzdálenosti od správné pozice a rychlosti, s jakou hráč odpoví.

Herní mechanismus:
Hráč si v menu vybere kvíz a klikne na tlačítko „Play“.
Po načtení se zobrazí obrázek určitého místa a hráč má za úkol označit jeho polohu na mapě.
Po potvrzení tipu se zobrazí správná pozice, čára spojující hráčův tip a správnou pozici, a informace o vzdálenosti a skóre.
Hráč pokračuje na další otázku kliknutím na tlačítko „Next“.
Hra se vyhodnocuje na základě vzdálenosti tipu od správné pozice a času, který uplynul při tipování.
Po dokončení kvízu se zobrazí souhrn, včetně animace a celkového skóre.

Instalace:
Naklonujte tento repozitář: **git clone https://github.com/TomasUlman/LnL_Legends.git**
Přejděte do složky projektu: **cd LnL_Legends**
Otevřete soubor **index.html** v prohlížeči.

Použité technologie:
JavaScript (OOP)
HTML & CSS
Leaflet knihovna – interaktivní mapy (https://leafletjs.com/)
OpenStreetMap - zdroj mapových dat (https://www.openstreetmap.org/copyright)
CartoDB – zdroj mapových dat (https://carto.com/attributions)
Pixabay – zdroj obrázků (https://pixabay.com/)

**JavaScript (app.js)**
Tento soubor obsahuje hlavní aplikační logiku napsanou v objektově orientovaném přístupu (OOP) pomocí třídy App. Hlavní funkcionalita aplikace je řízena touto třídou.

Klíčové části třídy App
Konstruktor třídy:
Po inicializaci třídy se spustí metoda _renderQuizList, která dynamicky vykreslí seznam kvízů na základě dat z pole quizzes.
Události pro interakci uživatele jsou navázány na různé prvky:
Kliknutí na tlačítko pro výběr kvízu.
Kliknutí na ikonu uživatele pro otevření/uzavření uživatelského modálu.
Resetování skóre pro všechny kvízy.

Metody:
_selectQuiz(e): Tato metoda detekuje, který kvíz uživatel vybral na základě datasetu tlačítka "Play" a spustí vybraný kvíz.
_startQuiz(quizName): Spustí kvíz vybraný uživatelem. Skryje seznam kvízů a zobrazí načítací animaci. Po 2 sekundách načítání zobrazí kontejner s kvízem.
Předá relevantní data do instance třídy Quiz, která je zodpovědná za jednotlivé kvízy.
_renderQuizList(quizList): Pro každý kvíz zavolá metodu _renderQuiz, která vytváří HTML strukturu pro zobrazení každého kvízu v seznamu.
_renderQuiz(quiz): Vygeneruje HTML pro každý kvíz na základě jeho dat a historického skóre uloženého v localStorage.
_resetLocalStorageData(): Tato metoda smaže uložená skóre všech kvízů a nastaví skóre na 'N/A' pro všechny karty kvízů.
_openUserModal() a _closeUserModal(): Tyto metody se starají o zobrazení a zavření uživatelského modálu.

Interakce s Local Storage:
Skóre pro jednotlivé kvízy je uloženo do localStorage. Uživatel může resetovat všechna skóre přes tlačítko v uživatelském modálu.

**quiz.js**
Třída Quiz řídí celou herní logiku. Při vytvoření instance třídy se provádí řada akcí, jako je inicializace mapy, načtení otázek a spuštění časovače.

Konstruktor třídy:
id: ID kvízu.
questionSet: Pole s otázkami, každá otázka obsahuje obrázek, správné souřadnice a název.
mapStyle: Styl mapy (URL pro dlaždice).
mapPosition: Výchozí souřadnice středu mapy.
minZoomLevel, maxZoomLevel: Rozsah zoomu mapy.
dragging: Umožňuje nebo zakazuje pohyb mapou.
timer: Čas v sekundách pro odpověď na otázku.
referenceDistance: Maximální tolerance vzdálenosti mezi správnou a tipnutou pozicí.

Metody: 
_loadMap: Načte a zobrazí mapu v elemntu s id="map".
_runQuiz: Spouští kvíz. Prochází otázky postupně a volá metodu _runQuestion pro každou otázku.
_runQuestion(question, runNextQuestion): Nastaví obrázek otázky a spustí časovač. Po kliknutí na mapu se umístí hráčský marker. Po uplynutí času nebo potvrzení odpovědi se otázka vyhodnotí, zobrazí se skóre a pokračuje další otázkou.
_displayGuessPosition(e): Vykreslí hráčský tip jako marker na mapě. Otevře popup s tlačítkem pro potvrzení odpovědi.
_displayCorrectPosition(coords): Vykreslí správný marker. Vypočítá střed mezi hráčským a správným markerem a zobrazí linku spojující oba markery. Používá animaci k přiblížení na obě pozice.
_renderPolyline(startLatLng, endLatLng): Animačně vykresluje polyline (čáru) mezi hráčským tipem a správnou polohou.
_displayGuessScore(placeName, correctCoords, guessCoords, remainingSeconds): Vypočítá skóre podle vzdálenosti mezi guess a správnou polohou. Zobrazí modální okno se skóre otázky.
_displaySummary(): Zobrazí shrnutí s celkovým skóre po dokončení všech otázek.
_storeQuizScore(): Uloží skóre kvízu do local storage. 
_quitQuiz(): Ukončí kvíz a obnoví výchozí stav stránky.
_clearMap(): Vyčistí mapu a odstraní všechny vrstvy z mapy.

Výpočetní metody: 
_calcDistance(): Haversinova metoda výpočtu vzdálenosti mezi markery (výsledek je v metrech)
_calcGuessScore(): Výpočet skóre dle vzdálenosti mezi markery a času. 

Formátovací metody:
_formatTime(seconds): Převádí čas ze sekund na formát minut a sekund (mm:ss).
_formatDistance(distance): Převádí vzdálenost na formát km/m.

**question.js**
Tato třída je pro ukládání a organizaci informací o otázkách v kvízu. Instance této třídy jsou vytvářeny pro každý jednotlivý obrázek a umístění v kvízu a jsou předávány do třídy Quiz, která pracuje s otázkami.

Konstruktor třídy:
image: Cesta k obrázku otázky (např. URL nebo cesta k souboru).
coords: Pole obsahující souřadnice ve formátu [latitude, longitude], které představují správnou odpověď na otázku (místo na mapě).
name: Název místa, které je na obrázku zobrazeno. 

**quizData.js**
Tento soubor slouží jako databáze pro kvízy v aplikaci. Obsahuje definice mapových stylů, specifikace jednotlivých kvízů včetně jejich parametrů a otázek a pole všech kvízů (quizzes), které v aplikaci zobrazí třída app.js.

Styly map
blindMap: URL pro základní mapu bez popisů.
normalMap: URL pro základní mapu se všemi popisy.

Kvízy
exampleQuiz {
  quizCardData: {
    name: Název kvízu (Europe Cities 1)
    level: Úroveň obtížnosti (Easy)
    lvlColor: Barva úrovně obtížnosti (green)
    imgUrl: URL obrázku pro kvíz
    mapStyle: Styl mapy (Blind)
},
  questions: Pole otázek s obrázky měst v Evropě a jejich geografickými souřadnicemi.
  id: Identifikátor kvízu
  map: URL mapy
  mapPosition: Poziční střed mapy ([latitude, longitude])
  minZoomLevel: Minimální úroveň přiblížení mapy
  maxZoomLevel: Maximální úroveň přiblížení mapy
  dragging: Povolení/zakázání posouvání mapy
  timer: Časovač v sekundách
  referenceDistance: Referenční vzdálenost pro výpočet přesnosti odpovědí
}
