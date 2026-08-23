// Disegni di esempio precaricati: permettono di provare la coloritura
// senza API key. Stesso formato degli SVG generati dal provider claude-svg
// (linee nere, aree chiuse con fill bianco), quindi la pipeline di
// coloritura è identica.

export interface SampleDrawing {
  slug: string;
  prompt: string;
  content: string;
  /** Livello di complessità che questo disegno rappresenta. */
  ageBand: "small" | "medium" | "big";
}

const STROKE = 'stroke="#000000" stroke-linecap="round" stroke-linejoin="round"';

const DINO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- sole -->
  <circle cx="150" cy="150" r="75" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <g fill="none" ${STROKE} stroke-width="7">
    <line x1="150" y1="35" x2="150" y2="15"/>
    <line x1="150" y1="265" x2="150" y2="285"/>
    <line x1="35" y1="150" x2="15" y2="150"/>
    <line x1="265" y1="150" x2="285" y2="150"/>
    <line x1="70" y1="70" x2="55" y2="55"/>
    <line x1="230" y1="70" x2="245" y2="55"/>
    <line x1="70" y1="230" x2="55" y2="245"/>
  </g>
  <!-- nuvola -->
  <path d="M 700 130 a 45 45 0 0 1 55 -35 a 55 55 0 0 1 105 -10 a 45 45 0 0 1 60 45 a 35 35 0 0 1 -10 68 l -180 0 a 38 38 0 0 1 -30 -68 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- prato -->
  <path d="M 0 850 Q 250 800 500 840 Q 750 880 1000 830 L 1000 1000 L 0 1000 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- coda -->
  <path d="M 300 640 Q 160 600 110 700 Q 200 690 290 740 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- zampe -->
  <rect x="360" y="740" width="80" height="120" rx="35" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <rect x="520" y="740" width="80" height="120" rx="35" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- corpo -->
  <ellipse cx="480" cy="620" rx="210" ry="150" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- pancia -->
  <ellipse cx="470" cy="670" rx="120" ry="85" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- spuntoni (le basi vengono coperte dal collo, disegnato dopo) -->
  <path d="M 500 420 L 630 405 L 610 500 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <path d="M 540 335 L 660 350 L 630 430 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <path d="M 595 250 L 690 300 L 655 365 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- collo e testa -->
  <path d="M 570 540 Q 610 380 660 330 Q 720 270 780 300 Q 840 330 830 390 Q 820 440 750 450 Q 700 460 670 520 Q 650 560 640 600 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- occhio e sorriso -->
  <circle cx="762" cy="345" r="9" fill="none" ${STROKE} stroke-width="20"/>
  <path d="M 775 385 Q 795 402 818 390" fill="none" ${STROKE} stroke-width="7"/>
  <!-- ciuffi d'erba -->
  <path d="M 180 900 q 10 -40 20 0 q 10 -40 20 0" fill="none" ${STROKE} stroke-width="6"/>
  <path d="M 800 910 q 10 -40 20 0 q 10 -40 20 0" fill="none" ${STROKE} stroke-width="6"/>
</svg>`;

const GATTO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- palloncino -->
  <circle cx="760" cy="260" r="115" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <path d="M 745 372 L 775 372 L 760 400 Z" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <path d="M 760 400 Q 700 520 560 640" fill="none" ${STROKE} stroke-width="6"/>
  <!-- coda (la base viene coperta dal corpo, disegnato dopo) -->
  <path d="M 250 780 Q 120 790 110 680 Q 105 590 180 585 Q 145 640 175 700 Q 205 755 265 745 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- corpo -->
  <ellipse cx="400" cy="740" rx="180" ry="140" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- zampine -->
  <ellipse cx="330" cy="860" rx="55" ry="35" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <ellipse cx="480" cy="860" rx="55" ry="35" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- braccio che tiene il filo -->
  <ellipse cx="540" cy="660" rx="45" ry="30" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- orecchie -->
  <path d="M 290 330 L 260 190 L 380 265 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <path d="M 510 330 L 540 190 L 420 265 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <path d="M 299 299 L 282 222 L 348 264 Z" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <path d="M 501 299 L 518 222 L 452 264 Z" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <!-- testa -->
  <circle cx="400" cy="430" r="155" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- musetto -->
  <path d="M 385 445 L 415 445 L 400 468 Z" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <path d="M 400 468 Q 400 495 375 500 M 400 468 Q 400 495 425 500" fill="none" ${STROKE} stroke-width="6"/>
  <!-- occhi -->
  <circle cx="340" cy="400" r="8" fill="none" ${STROKE} stroke-width="18"/>
  <circle cx="460" cy="400" r="8" fill="none" ${STROKE} stroke-width="18"/>
  <!-- baffi -->
  <g fill="none" ${STROKE} stroke-width="5">
    <line x1="250" y1="445" x2="180" y2="430"/>
    <line x1="252" y1="468" x2="182" y2="475"/>
    <line x1="550" y1="445" x2="620" y2="430"/>
    <line x1="548" y1="468" x2="618" y2="475"/>
  </g>
</svg>`;

const RAZZO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- luna -->
  <path d="M 830 160 a 85 85 0 1 0 60 150 a 70 70 0 0 1 -60 -150 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- stelle -->
  <polygon points="160,240 178,292 230,292 188,324 204,376 160,344 116,376 132,324 90,292 142,292" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <polygon points="220,600 232,634 268,634 240,656 250,690 220,668 190,690 200,656 172,634 208,634" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <polygon points="800,560 812,594 848,594 820,616 830,650 800,628 770,650 780,616 752,594 788,594" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <!-- punta -->
  <path d="M 500 90 Q 590 180 600 300 L 400 300 Q 410 180 500 90 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- corpo -->
  <path d="M 400 300 L 600 300 Q 615 480 585 640 L 415 640 Q 385 480 400 300 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- oblò -->
  <circle cx="500" cy="420" r="72" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <circle cx="500" cy="420" r="45" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <!-- alette -->
  <path d="M 415 500 Q 310 560 300 680 Q 370 650 420 640 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <path d="M 585 500 Q 690 560 700 680 Q 630 650 580 640 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- fiamma -->
  <path d="M 445 640 Q 430 760 500 830 Q 570 760 555 640 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <path d="M 475 640 Q 470 720 500 760 Q 530 720 525 640 Z" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <!-- sbuffi -->
  <circle cx="400" cy="880" r="35" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <circle cx="500" cy="910" r="42" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <circle cx="600" cy="880" r="35" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
</svg>`;

const PESCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- onde in superficie -->
  <path d="M 0 120 Q 125 70 250 120 Q 375 170 500 120 Q 625 70 750 120 Q 875 170 1000 120" fill="none" ${STROKE} stroke-width="7"/>
  <!-- alghe -->
  <path d="M 130 980 Q 90 900 130 830 Q 170 760 130 690 Q 180 750 165 830 Q 150 910 175 980 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <path d="M 850 980 Q 890 900 850 830 Q 810 760 850 690 Q 800 750 815 830 Q 830 910 805 980 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- fondale -->
  <path d="M 0 930 Q 250 890 500 925 Q 750 960 1000 920 L 1000 1000 L 0 1000 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- coda -->
  <path d="M 260 450 Q 160 360 130 330 Q 155 450 130 570 Q 160 540 260 450 Z" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- corpo -->
  <ellipse cx="480" cy="450" rx="230" ry="150" fill="#FFFFFF" ${STROKE} stroke-width="8"/>
  <!-- pinna dorsale -->
  <path d="M 420 310 Q 450 220 540 210 Q 510 270 520 315 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- pinna inferiore -->
  <path d="M 440 590 Q 430 660 490 690 Q 500 640 520 595 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- pinna laterale -->
  <path d="M 450 460 Q 520 480 530 540 Q 470 540 435 505 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- striscia della coda -->
  <path d="M 300 340 Q 340 450 300 560 Q 260 450 300 340 Z" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <!-- occhio e bocca -->
  <circle cx="620" cy="410" r="30" fill="#FFFFFF" ${STROKE} stroke-width="7"/>
  <circle cx="620" cy="410" r="7" fill="none" ${STROKE} stroke-width="16"/>
  <path d="M 672 480 Q 698 500 686 530" fill="none" ${STROKE} stroke-width="8"/>
  <!-- bollicine -->
  <circle cx="750" cy="300" r="28" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <circle cx="800" cy="230" r="20" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <circle cx="770" cy="170" r="14" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
  <!-- stella marina -->
  <polygon points="330,880 348,915 386,918 358,943 366,980 330,960 294,980 302,943 274,918 312,915" fill="#FFFFFF" ${STROKE} stroke-width="6"/>
</svg>`;


// ── 2-3 anni: pochissime aree enormi, linee molto spesse ────────────────
const S = 'stroke="#000000" stroke-linecap="round" stroke-linejoin="round"';
const SW = 'stroke-width="14"';

const ORSO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- sole -->
  <circle cx="130" cy="130" r="78" fill="#FFFFFF" ${S} ${SW}/>
  <!-- orecchie (dietro la testa, ben sporgenti) -->
  <circle cx="320" cy="270" r="100" fill="#FFFFFF" ${S} ${SW}/>
  <circle cx="680" cy="270" r="100" fill="#FFFFFF" ${S} ${SW}/>
  <!-- corpo -->
  <ellipse cx="500" cy="790" rx="260" ry="185" fill="#FFFFFF" ${S} ${SW}/>
  <!-- pancia -->
  <ellipse cx="500" cy="820" rx="145" ry="125" fill="#FFFFFF" ${S} ${SW}/>
  <!-- testa -->
  <circle cx="500" cy="410" r="215" fill="#FFFFFF" ${S} ${SW}/>
  <!-- muso -->
  <ellipse cx="500" cy="500" rx="110" ry="90" fill="#FFFFFF" ${S} ${SW}/>
  <!-- naso -->
  <ellipse cx="500" cy="455" rx="42" ry="32" fill="#FFFFFF" ${S} ${SW}/>
  <!-- occhi e bocca -->
  <circle cx="415" cy="365" r="16" fill="none" ${S} stroke-width="32"/>
  <circle cx="585" cy="365" r="16" fill="none" ${S} stroke-width="32"/>
  <path d="M 500 500 Q 500 545 455 550 M 500 500 Q 500 545 545 550" fill="none" ${S} ${SW}/>
</svg>`;

const MACCHINA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- nuvola -->
  <path d="M 640 200 a 60 60 0 0 1 75 -45 a 70 70 0 0 1 135 -10 a 58 58 0 0 1 10 100 l -210 0 a 48 48 0 0 1 -10 -45 Z" fill="#FFFFFF" ${S} ${SW}/>
  <!-- strada -->
  <rect x="0" y="800" width="1000" height="200" fill="#FFFFFF" ${S} ${SW}/>
  <!-- carrozzeria -->
  <path d="M 130 760 L 130 560 Q 130 520 180 520 L 330 520 L 430 380 Q 445 355 490 355 L 660 355 Q 700 355 715 385 L 780 520 L 850 540 Q 880 550 880 590 L 880 760 Z" fill="#FFFFFF" ${S} ${SW}/>
  <!-- finestrino -->
  <path d="M 380 505 L 460 400 Q 470 385 500 385 L 640 385 Q 665 385 675 405 L 730 505 Z" fill="#FFFFFF" ${S} ${SW}/>
  <!-- ruote -->
  <circle cx="300" cy="770" r="105" fill="#FFFFFF" ${S} ${SW}/>
  <circle cx="740" cy="770" r="105" fill="#FFFFFF" ${S} ${SW}/>
</svg>`;

const FIORE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- petali -->
  <ellipse cx="500" cy="180" rx="120" ry="140" fill="#FFFFFF" ${S} ${SW}/>
  <ellipse cx="770" cy="380" rx="120" ry="140" fill="#FFFFFF" ${S} ${SW} transform="rotate(72 770 380)"/>
  <ellipse cx="665" cy="690" rx="120" ry="140" fill="#FFFFFF" ${S} ${SW} transform="rotate(144 665 690)"/>
  <ellipse cx="335" cy="690" rx="120" ry="140" fill="#FFFFFF" ${S} ${SW} transform="rotate(216 335 690)"/>
  <ellipse cx="230" cy="380" rx="120" ry="140" fill="#FFFFFF" ${S} ${SW} transform="rotate(288 230 380)"/>
  <!-- cuore del fiore -->
  <circle cx="500" cy="440" r="150" fill="#FFFFFF" ${S} ${SW}/>
  <!-- occhi e sorriso -->
  <circle cx="450" cy="410" r="14" fill="none" ${S} stroke-width="28"/>
  <circle cx="550" cy="410" r="14" fill="none" ${S} stroke-width="28"/>
  <path d="M 445 490 Q 500 535 555 490" fill="none" ${S} ${SW}/>
  <!-- stelo -->
  <path d="M 460 900 L 460 590 L 540 590 L 540 900 Z" fill="#FFFFFF" ${S} ${SW}/>
</svg>`;


// ── 7 anni e più: scena ricca, molte aree, linee sottili ────────────────
const B = 'stroke="#000000" stroke-linecap="round" stroke-linejoin="round"';
const BW = 'stroke-width="5"';

// Mattoni e finestre generati in serie: scriverli a mano sarebbe illeggibile.
const mattoni = (x: number, y: number, cols: number, rows: number, w = 60, h = 34) =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const offset = r % 2 === 0 ? 0 : w / 2;
      return `<rect x="${x + c * w + offset}" y="${y + r * h}" width="${w}" height="${h}" fill="#FFFFFF" ${B} ${BW}/>`;
    }).join("")
  ).join("");

const CASTELLO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- cielo con sole e nuvole -->
  <circle cx="110" cy="110" r="55" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 700 130 a 34 34 0 0 1 42 -26 a 40 40 0 0 1 78 -7 a 33 33 0 0 1 6 58 l -120 0 a 27 27 0 0 1 -6 -25 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 200 210 a 26 26 0 0 1 32 -20 a 31 31 0 0 1 60 -5 a 25 25 0 0 1 4 44 l -92 0 a 21 21 0 0 1 -4 -19 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- collina -->
  <path d="M 0 820 Q 250 760 500 800 Q 750 840 1000 780 L 1000 1000 L 0 1000 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- torri laterali -->
  <rect x="150" y="380" width="150" height="440" fill="#FFFFFF" ${B} ${BW}/>
  <rect x="700" y="380" width="150" height="440" fill="#FFFFFF" ${B} ${BW}/>
  <!-- merli -->
  <path d="M 140 380 L 140 330 L 175 330 L 175 360 L 205 360 L 205 330 L 245 330 L 245 360 L 275 360 L 275 330 L 310 330 L 310 380 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 690 380 L 690 330 L 725 330 L 725 360 L 755 360 L 755 330 L 795 330 L 795 360 L 825 360 L 825 330 L 860 330 L 860 380 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- tetti a cono -->
  <path d="M 130 330 L 225 190 L 320 330 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 680 330 L 775 190 L 870 330 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- bandiere -->
  <path d="M 225 190 L 225 110 L 300 140 L 225 165" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 775 190 L 775 110 L 850 140 L 775 165" fill="#FFFFFF" ${B} ${BW}/>
  <!-- corpo centrale -->
  <rect x="300" y="500" width="400" height="320" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 290 500 L 290 455 L 330 455 L 330 480 L 365 480 L 365 455 L 405 455 L 405 480 L 440 480 L 440 455 L 480 455 L 480 480 L 520 480 L 520 455 L 560 455 L 560 480 L 595 480 L 595 455 L 635 455 L 635 480 L 670 480 L 670 455 L 710 455 L 710 500 Z" fill="#FFFFFF" ${B} ${BW}/>
  ${mattoni(310, 690, 6, 3, 63, 40)}
  <!-- portone -->
  <path d="M 430 820 L 430 620 Q 500 555 570 620 L 570 820 Z" fill="#FFFFFF" ${B} ${BW}/>
  <line x1="500" y1="565" x2="500" y2="820" ${B} ${BW}/>
  <circle cx="470" cy="710" r="10" fill="#FFFFFF" ${B} stroke-width="4"/>
  <circle cx="530" cy="710" r="10" fill="#FFFFFF" ${B} stroke-width="4"/>
  <!-- finestre delle torri -->
  <path d="M 190 470 L 190 420 Q 225 390 260 420 L 260 470 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 740 470 L 740 420 Q 775 390 810 420 L 810 470 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 190 640 L 190 590 Q 225 560 260 590 L 260 640 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 740 640 L 740 590 Q 775 560 810 590 L 810 640 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- drago gentile che sbircia -->
  <path d="M 880 760 Q 960 720 950 640 Q 945 590 900 595 Q 915 640 890 680 Q 870 715 850 730 Z" fill="#FFFFFF" ${B} ${BW}/>
  <ellipse cx="905" cy="565" rx="62" ry="48" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 875 525 L 862 490 L 898 512 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 930 522 L 925 486 L 955 515 Z" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="925" cy="558" r="7" fill="none" ${B} stroke-width="14"/>
  <path d="M 940 585 Q 950 596 938 604" fill="none" ${B} ${BW}/>
  <!-- cespugli -->
  <path d="M 90 820 a 45 45 0 0 1 60 -30 a 50 50 0 0 1 70 30 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 820 800 a 40 40 0 0 1 55 -26 a 45 45 0 0 1 62 26 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- sassi -->
  <ellipse cx="300" cy="900" rx="42" ry="26" fill="#FFFFFF" ${B} ${BW}/>
  <ellipse cx="640" cy="930" rx="52" ry="30" fill="#FFFFFF" ${B} ${BW}/>
</svg>`;

const FONDALE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- superficie -->
  <path d="M 0 90 Q 125 40 250 90 Q 375 140 500 90 Q 625 40 750 90 Q 875 140 1000 90 L 1000 0 L 0 0 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- sottomarino -->
  <ellipse cx="470" cy="420" rx="240" ry="120" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 230 420 Q 150 420 120 350 Q 175 400 215 380 Q 205 420 215 460 Q 175 440 120 490 Q 150 420 230 420 Z" fill="#FFFFFF" ${B} ${BW}/>
  <rect x="400" y="255" width="140" height="60" rx="16" fill="#FFFFFF" ${B} ${BW}/>
  <rect x="455" y="180" width="30" height="80" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="380" cy="420" r="52" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="380" cy="420" r="32" fill="#FFFFFF" ${B} stroke-width="4"/>
  <circle cx="520" cy="420" r="52" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="520" cy="420" r="32" fill="#FFFFFF" ${B} stroke-width="4"/>
  <circle cx="640" cy="420" r="44" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="640" cy="420" r="26" fill="#FFFFFF" ${B} stroke-width="4"/>
  <!-- bollicine -->
  <circle cx="760" cy="300" r="26" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="820" cy="230" r="18" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="790" cy="170" r="12" fill="#FFFFFF" ${B} ${BW}/>
  <!-- pesci -->
  <ellipse cx="200" cy="680" rx="80" ry="52" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 122 680 L 55 630 Q 72 680 55 730 Z" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="240" cy="662" r="9" fill="none" ${B} stroke-width="16"/>
  <ellipse cx="800" cy="620" rx="70" ry="46" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 870 620 L 930 578 Q 915 620 930 662 Z" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="768" cy="606" r="8" fill="none" ${B} stroke-width="14"/>
  <!-- alghe -->
  <path d="M 110 980 Q 70 900 110 830 Q 150 760 110 690 Q 165 755 148 835 Q 132 915 158 980 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 890 980 Q 930 900 890 830 Q 850 760 890 690 Q 835 755 852 835 Q 868 915 842 980 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- fondale e sassi -->
  <path d="M 0 900 Q 250 855 500 895 Q 750 935 1000 890 L 1000 1000 L 0 1000 Z" fill="#FFFFFF" ${B} ${BW}/>
  <ellipse cx="330" cy="930" rx="52" ry="32" fill="#FFFFFF" ${B} ${BW}/>
  <ellipse cx="620" cy="950" rx="44" ry="26" fill="#FFFFFF" ${B} ${BW}/>
  <!-- stella marina e conchiglia -->
  <polygon points="480,880 496,916 534,920 505,945 514,982 480,962 446,982 455,945 426,920 464,916" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 720 960 a 55 55 0 0 1 110 0 Z" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 775 960 L 775 905 M 745 958 L 758 908 M 805 958 L 792 908" fill="none" ${B} stroke-width="4"/>
</svg>`;

const CASETTA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
  <!-- cielo -->
  <circle cx="860" cy="120" r="60" fill="#FFFFFF" ${B} ${BW}/>
  <g fill="none" ${B} stroke-width="4">
    <line x1="860" y1="30" x2="860" y2="8"/><line x1="860" y1="210" x2="860" y2="232"/>
    <line x1="770" y1="120" x2="748" y2="120"/><line x1="950" y1="120" x2="972" y2="120"/>
    <line x1="800" y1="60" x2="784" y2="44"/><line x1="920" y1="60" x2="936" y2="44"/>
  </g>
  <path d="M 120 170 a 34 34 0 0 1 42 -26 a 40 40 0 0 1 78 -7 a 33 33 0 0 1 6 58 l -120 0 a 27 27 0 0 1 -6 -25 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- prato -->
  <path d="M 0 800 Q 250 760 500 795 Q 750 830 1000 785 L 1000 1000 L 0 1000 Z" fill="#FFFFFF" ${B} ${BW}/>
  <!-- casa -->
  <rect x="270" y="480" width="420" height="320" fill="#FFFFFF" ${B} ${BW}/>
  <path d="M 230 480 L 480 290 L 730 480 Z" fill="#FFFFFF" ${B} ${BW}/>
  ${mattoni(285, 640, 6, 4, 65, 38)}
  <!-- comignolo e fumo -->
  <rect x="600" y="330" width="60" height="110" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="640" cy="280" r="26" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="675" cy="215" r="34" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="720" cy="140" r="42" fill="#FFFFFF" ${B} ${BW}/>
  <!-- porta -->
  <path d="M 420 800 L 420 620 Q 480 570 540 620 L 540 800 Z" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="515" cy="710" r="11" fill="#FFFFFF" ${B} stroke-width="4"/>
  <!-- finestre a quattro riquadri -->
  <rect x="300" y="520" width="100" height="100" fill="#FFFFFF" ${B} ${BW}/>
  <line x1="350" y1="520" x2="350" y2="620" ${B} stroke-width="4"/>
  <line x1="300" y1="570" x2="400" y2="570" ${B} stroke-width="4"/>
  <rect x="560" y="520" width="100" height="100" fill="#FFFFFF" ${B} ${BW}/>
  <line x1="610" y1="520" x2="610" y2="620" ${B} stroke-width="4"/>
  <line x1="560" y1="570" x2="660" y2="570" ${B} stroke-width="4"/>
  <!-- albero -->
  <rect x="820" y="620" width="60" height="190" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="850" cy="540" r="110" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="770" cy="600" r="62" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="930" cy="600" r="62" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="820" cy="520" r="16" fill="#FFFFFF" ${B} stroke-width="4"/>
  <circle cx="885" cy="565" r="16" fill="#FFFFFF" ${B} stroke-width="4"/>
  <!-- staccionata -->
  ${Array.from({ length: 5 }, (_, i) => `<path d="M ${60 + i * 45} 880 L ${60 + i * 45} 760 L ${90 + i * 45} 745 L ${90 + i * 45} 880 Z" fill="#FFFFFF" ${B} ${BW}/>`).join("")}
  <line x1="55" y1="790" x2="290" y2="775" ${B} ${BW}/>
  <line x1="55" y1="840" x2="290" y2="825" ${B} ${BW}/>
  <!-- fiori nel prato -->
  <circle cx="180" cy="930" r="26" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="620" cy="905" r="22" fill="#FFFFFF" ${B} ${BW}/>
  <circle cx="760" cy="950" r="24" fill="#FFFFFF" ${B} ${BW}/>
</svg>`;

export const SAMPLE_DRAWINGS: SampleDrawing[] = [
  // 2-3 anni: 5-8 aree enormi, linee spessissime
  { slug: "orso", prompt: "Un orsetto sorridente", content: ORSO, ageBand: "small" },
  { slug: "macchina", prompt: "Una macchina che corre", content: MACCHINA, ageBand: "small" },
  { slug: "fiore", prompt: "Un fiore che sorride", content: FIORE, ageBand: "small" },

  // 4-6 anni: una dozzina di aree, dettagli riconoscibili
  { slug: "dino", prompt: "Un dinosauro felice", content: DINO, ageBand: "medium" },
  { slug: "gatto", prompt: "Un gattino con un palloncino", content: GATTO, ageBand: "medium" },
  { slug: "razzo", prompt: "Un razzo tra le stelle", content: RAZZO, ageBand: "medium" },
  { slug: "pesce", prompt: "Un pesciolino nel mare", content: PESCE, ageBand: "medium" },

  // 7+ : scene ricche, tante aree, linee sottili
  { slug: "castello", prompt: "Un castello con un drago gentile", content: CASTELLO, ageBand: "big" },
  { slug: "fondale", prompt: "Un sottomarino in fondo al mare", content: FONDALE, ageBand: "big" },
  { slug: "casetta", prompt: "Una casetta con il giardino", content: CASETTA, ageBand: "big" },
];

/** Disegni adatti a una fascia d'età (per il provider di prova). */
export function samplesForAge(band: string | undefined): SampleDrawing[] {
  const matching = SAMPLE_DRAWINGS.filter((s) => s.ageBand === band);
  return matching.length ? matching : SAMPLE_DRAWINGS;
}
