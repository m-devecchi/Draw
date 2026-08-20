// Disegni di esempio precaricati: permettono di provare la coloritura
// senza API key. Stesso formato degli SVG generati dal provider claude-svg
// (linee nere, aree chiuse con fill bianco), quindi la pipeline di
// coloritura è identica.

export interface SampleDrawing {
  slug: string;
  prompt: string;
  content: string;
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

export const SAMPLE_DRAWINGS: SampleDrawing[] = [
  { slug: "dino", prompt: "Un dinosauro felice", content: DINO },
  { slug: "gatto", prompt: "Un gattino con un palloncino", content: GATTO },
  { slug: "razzo", prompt: "Un razzo tra le stelle", content: RAZZO },
  { slug: "pesce", prompt: "Un pesciolino nel mare", content: PESCE },
];
