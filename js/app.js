(() => {
  "use strict";

  /* ==========================================================
     CORE DATA / HELPERS
  ========================================================== */

  const data = window.ANNIVERSARY;

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const on = (selector, event, handler, options) => {
    const element = $(selector);
    if (!element) return false;
    element.addEventListener(event, handler, options);
    return true;
  };

  const onElement = (element, event, handler, options) => {
    if (!element) return false;
    element.addEventListener(event, handler, options);
    return true;
  };

  /* ==========================================================
     STATE
  ========================================================== */

  const state = {
    unlocked: readJSON("anniversary-unlocked", []),
    helperUses: readNumber("anniversary-helper-uses", 0),
    helperUsedCards: readJSON("anniversary-helper-cards", []),

    activeCard: null,

    tapTimer: null,

    unlockAnimating: false,

    parallaxFrame: null,

    towerOpened: false,
    towerRevealTimer: null,

    nightTheme: false
  };

  const screens = [
    "intro",
    "lobby",
    "challenge",
    "reward",
    "finale",
    "timeline",
    "secret",
    "secretEnd",
    "secretMemory"
  ];

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function readNumber(key, fallback) {
    const raw = localStorage.getItem(key);
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  /* ==========================================================
     SCREEN CONTROL
  ========================================================== */

  function showScreen(name) {
    clearTapTimer();

    screens.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      element.classList.toggle(
        "screen--active",
        id === name
      );
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  /* ==========================================================
     LOCAL STORAGE
  ========================================================== */

  function save() {
    localStorage.setItem(
      "anniversary-unlocked",
      JSON.stringify(state.unlocked)
    );

    localStorage.setItem(
      "anniversary-helper-uses",
      String(state.helperUses)
    );

    localStorage.setItem(
      "anniversary-helper-cards",
      JSON.stringify(state.helperUsedCards)
    );
  }

  function isUnlocked(id) {
    return state.unlocked.includes(id);
  }

  function helperUsesLeft() {
    return Math.max(
      0,
      data.helper.maxUses - state.helperUses
    );
  }

  function hasUsedHelper(id) {
    return state.helperUsedCards.includes(id);
  }

  function unlock(id) {
    if (!isUnlocked(id)) {
      state.unlocked.push(id);

      state.unlocked.sort(
        (a, b) => a - b
      );

      save();
    }

    updateProgress();
  }

  /* ==========================================================
     LIVE RELATIONSHIP TIMER
  ========================================================== */

  const ANNIVERSARY_START =
    new Date(
      data.couple.anniversaryDate
    );

  function getCalendarElapsed(start, end) {
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0
      };
    }

    let cursor = new Date(start);

    let years =
      end.getFullYear() -
      cursor.getFullYear();

    cursor.setFullYear(
      cursor.getFullYear() + years
    );

    if (cursor > end) {
      years -= 1;

      cursor.setFullYear(
        cursor.getFullYear() - 1
      );
    }

    let months =
      end.getMonth() -
      cursor.getMonth();

    if (months < 0) {
      months += 12;
    }

    const test =
      new Date(cursor);

    test.setMonth(
      test.getMonth() + months
    );

    if (test > end) {
      months -= 1;

      if (months < 0) {
        months = 11;
        years -= 1;
      }
    }

    cursor =
      new Date(cursor);

    cursor.setMonth(
      cursor.getMonth() + months
    );

    let remaining =
      end.getTime() -
      cursor.getTime();

    const dayMs = 86400000;
    const hourMs = 3600000;
    const minuteMs = 60000;

    const days =
      Math.floor(
        remaining / dayMs
      );

    remaining -=
      days * dayMs;

    const hours =
      Math.floor(
        remaining / hourMs
      );

    remaining -=
      hours * hourMs;

    const minutes =
      Math.floor(
        remaining / minuteMs
      );

    remaining -=
      minutes * minuteMs;

    const seconds =
      Math.floor(
        remaining / 1000
      );

    return {
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalMs:
        end.getTime() -
        start.getTime()
    };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat(
      "en-US"
    ).format(value);
  }

  function updateElapsedTimer() {
    const elapsed =
      getCalendarElapsed(
        ANNIVERSARY_START,
        new Date()
      );

    const ids = [
      "yearsValue",
      "monthsValue",
      "daysValue",
      "hoursValue",
      "minutesValue",
      "secondsValue"
    ];

    const values = [
      elapsed.years,
      elapsed.months,
      elapsed.days,
      String(elapsed.hours).padStart(2, "0"),
      String(elapsed.minutes).padStart(2, "0"),
      String(elapsed.seconds).padStart(2, "0")
    ];

    ids.forEach((id, index) => {
      const element =
        document.getElementById(id);

      if (element) {
        element.textContent =
          values[index];
      }
    });

    const totalSec = Math.max(
      0,
      Math.floor(
        elapsed.totalMs / 1000
      )
    );

    const totalMin =
      Math.floor(
        totalSec / 60
      );

    const totalHour =
      Math.floor(
        totalMin / 60
      );

    const totalDay =
      Math.floor(
        totalHour / 24
      );

    const totals =
      $("#elapsedTotals");

    if (totals) {
      totals.innerHTML = `
        <span>รวม ${formatNumber(totalDay)} วัน</span>
        <span>·</span>
        <span>${formatNumber(totalHour)} ชั่วโมง</span>
        <span>·</span>
        <span>${formatNumber(totalMin)} นาที</span>
        <span>·</span>
        <span>${formatNumber(totalSec)} วินาที</span>
      `;
    }
  }

  /* ==========================================================
     UI HELPERS
  ========================================================== */

  function toast(message) {
    const element =
      $("#toast");

    if (!element) return;

    element.textContent =
      message;

    element.classList.add(
      "toast--show"
    );

    clearTimeout(
      toast._timer
    );

    toast._timer =
      setTimeout(
        () =>
          element.classList.remove(
            "toast--show"
          ),
        2400
      );
  }

  function play(selector) {
    const audio =
      $(selector);

    if (!audio) return;

    if (!audio.src) return;

    audio.currentTime = 0;

    audio.play().catch(() => {
      /* Autoplay/browser permission can reject safely. */
    });
  }

  function setupAudio() {
    const bgm = $("#bgm");
    const sfxFlip = $("#sfxFlip");
    const sfxSuccess = $("#sfxSuccess");

    if (bgm) {
      bgm.src =
        "assets/music/anniversary.mp3";
    }

    if (sfxFlip) {
      sfxFlip.src =
        "assets/music/flip.mp3";
    }

    if (sfxSuccess) {
      sfxSuccess.src =
        "assets/music/success.mp3";
    }
  }

  /* ==========================================================
     CONTENT INITIALIZATION
  ========================================================== */

  function initContent() {
    const introTitle =
      $("#introTitle");

    if (introTitle) {
      introTitle.textContent =
        data.intro.title;
    }

    const introSubtitle =
      $("#introSubtitle");

    if (introSubtitle) {
      introSubtitle.textContent =
        data.intro.subtitle;
    }

    const lobbyMessage =
      $("#lobbyMessage");

    if (lobbyMessage) {
      lobbyMessage.textContent =
        data.intro.lobbyMessage;
    }

    const towerHeading = $("#towerHeading");
    if (towerHeading && data.finale) {
      towerHeading.textContent = data.finale.heading;
    }

    const towerSubtitle = $("#towerSubtitle");
    if (towerSubtitle && data.finale) {
      towerSubtitle.textContent = data.finale.subtitle;
    }

    const secretCopy = $("#secretCopy");
    if (secretCopy && data.secret.copy) {
      secretCopy.textContent = data.secret.copy;
    }

    const secretYesBtn = $("#secretYesBtn");
    if (secretYesBtn && data.secret.yesButton) {
      secretYesBtn.textContent = data.secret.yesButton;
    }

    const secretMemoryHeading = $("#secretMemoryHeading");
    if (secretMemoryHeading && data.secretMemory.heading) {
      secretMemoryHeading.textContent = data.secretMemory.heading;
    }

    const scrapbookBottomText = $("#scrapbookBottomText");
    if (scrapbookBottomText && data.scrapbook?.bottomText) {
      scrapbookBottomText.textContent = data.scrapbook.bottomText;
    }

    const secretQuestion =
      $("#secretQuestion");

    if (secretQuestion) {
      secretQuestion.textContent =
        data.secret.question;
    }

    const secretEndTitle =
      $("#secretEndTitle");

    if (secretEndTitle) {
      secretEndTitle.textContent =
        data.secret.endTitle;
    }

    const secretEndText =
      $("#secretEndText");

    if (secretEndText) {
      secretEndText.textContent =
        data.secret.endText;
    }

    renderTowerLoveMessage();

    const secretMemoryText =
      $("#secretMemoryText");

    if (secretMemoryText) {
      secretMemoryText.textContent =
        data.secretMemory.text;
    }

    const secretMemorySign =
      $("#secretMemorySign");

    if (secretMemorySign) {
      secretMemorySign.textContent =
        data.secretMemory.sign;
    }
  }

  /* ==========================================================
     PARTICLES
  ========================================================== */

  function createParticles(
    containerId,
    count,
    className
  ) {
    const container =
      $(`#${containerId}`);

    if (!container) return;

    const fragment =
      document.createDocumentFragment();

    for (
      let i = 0;
      i < count;
      i += 1
    ) {
      const particle =
        document.createElement(
          "span"
        );

      particle.className =
        className;

      particle.style.left =
        `${Math.random() * 100}%`;

      particle.style.top =
        `${Math.random() * 100}%`;

      particle.style.animationDelay =
        `${Math.random() * -8}s`;

      particle.style.animationDuration =
        `${5 + Math.random() * 7}s`;

      fragment.appendChild(
        particle
      );
    }

    container.appendChild(
      fragment
    );
  }

  /* ==========================================================
     OPENING HEART CURTAIN
  ========================================================== */

  function createOpeningHearts() {
    const curtain =
      $("#openingCurtain");

    const container =
      $("#openingHearts");

    if (!curtain || !container) {
      return;
    }

    const mobile =
      window.matchMedia(
        "(max-width: 600px)"
      ).matches;

    const count =
      mobile ? 58 : 96;

    const fragment =
      document.createDocumentFragment();

    for (
      let i = 0;
      i < count;
      i += 1
    ) {
      const heart =
        document.createElement(
          "span"
        );

      heart.className =
        "opening-heart";

      heart.textContent =
        Math.random() > 0.5
          ? "♥"
          : "♡";

      const size =
        24 +
        Math.random() * 50;

      heart.style.left =
        `${Math.random() * 100}%`;

      heart.style.fontSize =
        `${size}px`;

      heart.style.setProperty(
        "--drift",
        `${(Math.random() - 0.5) * 220}px`
      );

      heart.style.setProperty(
        "--rotate",
        `${(Math.random() - 0.5) * 80}deg`
      );

      heart.style.animationDuration =
        `${3.1 + Math.random() * 3.8}s`;

      heart.style.animationDelay =
        `${Math.random() * 1.35}s`;

      heart.style.opacity =
        `${0.28 + Math.random() * 0.58}`;

      fragment.appendChild(
        heart
      );
    }

    container.appendChild(
      fragment
    );

    const closeCurtain =
      () => {
        curtain.classList.add(
          "opening-curtain--hide"
        );

        document.body.classList.remove(
          "opening-active"
        );
      };

    setTimeout(
      closeCurtain,
      4200
    );

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      closeCurtain();
    }
  }

  /* ==========================================================
     LOBBY ATMOSPHERE
  ========================================================== */

  function createLobbyAtmosphere() {
    const petalLayer =
      $("#petalLayer");

    const lanternLayer =
      $("#lanternLayer");

    const sparkleLayer =
      $("#sparkleLayer");

    const mobile =
      window.matchMedia(
        "(max-width: 600px)"
      ).matches;

    if (petalLayer) {
      const count =
        mobile ? 24 : 42;

      const fragment =
        document.createDocumentFragment();

      for (
        let i = 0;
        i < count;
        i += 1
      ) {
        const petal =
          document.createElement(
            "span"
          );

        petal.className =
          "petal";

        petal.style.left =
          `${Math.random() * 100}%`;

        petal.style.animationDuration =
          `${11 + Math.random() * 14}s`;

        petal.style.animationDelay =
          `${Math.random() * -24}s`;

        petal.style.setProperty(
          "--sway",
          `${(Math.random() - 0.5) * 230}px`
        );

        petal.style.setProperty(
          "--size",
          `${8 + Math.random() * 12}px`
        );

        petal.style.setProperty(
          "--depth",
          `${0.55 + Math.random() * 0.8}`
        );

        fragment.appendChild(
          petal
        );
      }

      petalLayer.appendChild(
        fragment
      );
    }

    if (lanternLayer) {
      const count =
        mobile ? 12 : 24;

      const fragment =
        document.createDocumentFragment();

      for (
        let i = 0;
        i < count;
        i += 1
      ) {
        const lantern =
          document.createElement(
            "span"
          );

        lantern.className =
          "lantern";

        lantern.innerHTML = `
          <span class="lantern-glow"></span>
          <span class="lantern-body">
            <span></span>
          </span>
        `;

        lantern.style.left =
          `${Math.random() * 96}%`;

        lantern.style.animationDuration =
          `${22 + Math.random() * 18}s`;

        lantern.style.animationDelay =
          `${Math.random() * -30}s`;

        lantern.style.setProperty(
          "--lantern-scale",
          `${0.7 + Math.random() * 0.85}`
        );

        lantern.style.setProperty(
          "--lantern-depth",
          `${0.5 + Math.random() * 0.5}`
        );

        fragment.appendChild(
          lantern
        );
      }

      lanternLayer.appendChild(
        fragment
      );
    }

    if (sparkleLayer) {
      const count =
        mobile ? 22 : 40;

      const fragment =
        document.createDocumentFragment();

      for (
        let i = 0;
        i < count;
        i += 1
      ) {
        const sparkle =
          document.createElement(
            "span"
          );

        sparkle.className =
          "lobby-sparkle";

        sparkle.textContent =
          "✦";

        sparkle.style.left =
          `${Math.random() * 100}%`;

        sparkle.style.top =
          `${Math.random() * 100}%`;

        sparkle.style.animationDelay =
          `${Math.random() * -8}s`;

        sparkle.style.animationDuration =
          `${5 + Math.random() * 6}s`;

        sparkle.style.setProperty(
          "--spark-scale",
          `${0.45 + Math.random() * 0.9}`
        );

        fragment.appendChild(
          sparkle
        );
      }

      sparkleLayer.appendChild(
        fragment
      );
    }
  }

  function setupLobbyParallax() {
    const lobby =
      $("#lobby");

    if (!lobby) return;

    const apply =
      (x, y) => {
        lobby.style.setProperty(
          "--px",
          `${x}px`
        );

        lobby.style.setProperty(
          "--py",
          `${y}px`
        );
      };

    onElement(
      lobby,
      "pointermove",
      (event) => {
        const rect =
          lobby.getBoundingClientRect();

        const nx =
          (event.clientX - rect.left) /
            rect.width -
          0.5;

        const ny =
          (event.clientY - rect.top) /
            rect.height -
          0.5;

        cancelAnimationFrame(
          state.parallaxFrame
        );

        state.parallaxFrame =
          requestAnimationFrame(
            () =>
              apply(
                nx * 16,
                ny * 11
              )
          );
      },
      { passive: true }
    );

    onElement(
      lobby,
      "pointerleave",
      () => {
        cancelAnimationFrame(
          state.parallaxFrame
        );

        state.parallaxFrame =
          requestAnimationFrame(
            () => apply(0, 0)
          );
      },
      { passive: true }
    );
  }

  /* ==========================================================
     PROGRESS / CARDS
  ========================================================== */

  function updateProgress() {
    const total =
      data.cards.length;

    const count =
      state.unlocked.length;

    const percent =
      Math.round(
        (count / total) * 100
      );

    const progressText =
      $("#progressText");

    if (progressText) {
      progressText.textContent =
        `${count} / ${total} unlocked`;
    }

    const progressPct =
      $("#progressPct");

    if (progressPct) {
      progressPct.textContent =
        `${percent}%`;
    }

    const progressBar =
      $("#progressBar");

    if (progressBar) {
      progressBar.style.width =
        `${percent}%`;
    }

    renderCards();

    const goldenArea =
      $("#goldenUnlockArea");

    if (goldenArea) {
      goldenArea.classList.toggle(
        "hidden",
        count !== total
      );
    }
  }

  function renderCards() {
    const grid =
      $("#cardGrid");

    if (!grid) return;

    grid.innerHTML = "";

    data.cards.forEach(
      (card, index) => {
        const unlocked =
          isUnlocked(card.id);

        const element =
          document.createElement(
            "button"
          );

        element.type = "button";

        element.className =
          `story-card ${
            unlocked
              ? "story-card--unlocked"
              : ""
          }`;

        element.setAttribute(
          "aria-label",
          `${
            unlocked
              ? "เปิดความทรงจำ"
              : "เปิดคำถาม"
          } ใบที่ ${card.id}`
        );

        const lockIcon = `
          <svg
            class="card-icon card-icon--lock"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <rect
              x="17"
              y="28"
              width="30"
              height="24"
              rx="6"
            ></rect>

            <path
              d="M23 28v-7c0-6 4-11 9-11s9 5 9 11v7"
            ></path>

            <circle
              cx="32"
              cy="40"
              r="2.5"
            ></circle>

            <path
              d="M32 42.5v5"
            ></path>
          </svg>
        `;

        const heartIcon = `
          <svg
            class="card-icon card-icon--hearts"
            viewBox="0 0 80 64"
            aria-hidden="true"
          >
            <path
              class="heart heart--big"
              d="M29 54C10 42 4 31 8 20c2-7 10-11 17-7 3 1.5 5 4 6 6 1-2 3-4.5 6-6 7-4 15 0 17 7 4 11-2 22-21 34Z"
            ></path>

            <path
              class="heart heart--small"
              d="M56 43C45 36 42 29 44 23c1.5-5 6-7 10-5 2 .8 3 2.4 3.5 3.5.7-1.1 1.7-2.7 3.5-3.5 4-2 8.5 0 10 5 2 6-1 13-12 20Z"
            ></path>
          </svg>
        `;

        element.innerHTML = `
          <span class="card-number">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <span class="card-inner">
            <span class="card-icon-wrap">
              ${
                unlocked
                  ? heartIcon
                  : lockIcon
              }
            </span>

            <span class="card-label">
              ${
                unlocked
                  ? "UNLOCKED"
                  : "SEALED"
              }
            </span>
          </span>
        `;

        element.addEventListener(
          "click",
          () => openCard(card.id)
        );

        grid.appendChild(
          element
        );
      }
    );
  }

  function openCard(id) {
    const card =
      data.cards.find(
        (item) => item.id === id
      );

    if (!card) return;

    state.activeCard =
      card;

    if (isUnlocked(id)) {
      showReward(card);
      return;
    }

    const number =
      $("#challengeNumber");

    if (number) {
      number.textContent =
        String(id).padStart(
          2,
          "0"
        );
    }

    const type =
      $("#challengeType");

    if (type) {
      type.textContent =
        card.label;
    }

    renderChallenge(
      card
    );

    showScreen(
      "challenge"
    );

    play(
      "#sfxFlip"
    );
  }

  /* ==========================================================
     QUESTIONS + HELPER
  ========================================================== */

  function normalizeAnswer(
    text
  ) {
    return String(text)
      .trim()
      .toLocaleLowerCase(
        "th-TH"
      )
      .replace(
        /\s+/g,
        " "
      );
  }

  function renderChallenge(
    card
  ) {
    const box =
      $("#challengeContent");

    if (!box) return;

    box.innerHTML = `
      <h1>${card.title}</h1>

      <p class="challenge-prompt">
        ${card.prompt}
      </p>
    `;

    renderTextQuestion(
      card,
      box
    );
  }

  function renderTextQuestion(
    card,
    box
  ) {
    const form =
      document.createElement(
        "form"
      );

    form.className =
      "answer-form";

    form.innerHTML = `
      <input
        id="answerInput"
        autocomplete="off"
        placeholder="${card.placeholder || ""}"
      >

      <button
        class="btn btn--pink"
        type="submit"
      >
        ส่งคำตอบ
      </button>

      <button
        id="helperBtn"
        class="helper-btn"
        type="button"
        ${
          helperUsesLeft() <= 0 ||
          hasUsedHelper(card.id)
            ? "disabled"
            : ""
        }
      >
        ${
          hasUsedHelper(card.id)
            ? "ใช้ตัวช่วยข้อนี้แล้ว"
            : `${data.helper.label} · เหลือ ${helperUsesLeft()} ครั้ง`
        }
      </button>

      <small>
        ${data.helper.description}
      </small>
    `;

    onElement(
      form,
      "submit",
      (event) => {
        event.preventDefault();

        const input =
          $("#answerInput");

        const value =
          normalizeAnswer(
            input
              ? input.value
              : ""
          );

        if (!value) {
          toast(
            "ลองพิมพ์คำตอบก่อนนะ ♡"
          );
          return;
        }

        const correct =
          card.answers.some(
            (answer) =>
              value ===
              normalizeAnswer(
                answer
              )
          );

        if (correct) {
          successCard(
            card
          );
        } else {
          toast(
            card.wrongMessage ||
              "ลองนึกถึงความทรงจำข้อนี้อีกนิดนะ ♡"
          );
        }
      }
    );

    box.appendChild(
      form
    );

    on(
      "#helperBtn",
      "click",
      () => useHelper(card)
    );
  }

  function useHelper(
    card
  ) {
    if (
      helperUsesLeft() <=
      0
    ) {
      toast(
        "ตัวช่วยถูกใช้ครบ 3 ครั้งแล้วนะ ♡"
      );
      return;
    }

    if (
      hasUsedHelper(
        card.id
      )
    ) {
      toast(
        "ข้อนี้ใช้ตัวช่วยไปแล้วนะ"
      );
      return;
    }

    state.helperUses +=
      1;

    state.helperUsedCards.push(
      card.id
    );

    save();

    renderHelperChoices(
      card
    );
  }

  function renderHelperChoices(
    card
  ) {
    const box =
      $("#challengeContent");

    if (!box) return;

    box.innerHTML = `
      <h1>${card.title}</h1>

      <p class="challenge-prompt">
        ตัวช่วยถูกใช้แล้ว · เลือก 1 จาก 4 ข้อ
      </p>

      <div class="helper-status">
        ใช้ตัวช่วยไป
        ${state.helperUses}
        /
        ${data.helper.maxUses}
        ครั้ง
        · เหลือ
        ${helperUsesLeft()}
        ครั้ง
      </div>
    `;

    const list =
      document.createElement(
        "div"
      );

    list.className =
      "option-list helper-options";

    card.helperOptions.forEach(
      (option, index) => {
        const button =
          document.createElement(
            "button"
          );

        button.type = "button";

        button.className =
          "option-btn";

        button.textContent =
          option;

        button.addEventListener(
          "click",
          () => {
            if (
              index ===
              card.helperAnswer
            ) {
              successCard(
                card
              );
            } else {
              failOption(
                button
              );
            }
          }
        );

        list.appendChild(
          button
        );
      }
    );

    box.appendChild(
      list
    );
  }

  function failOption(
    button
  ) {
    button.classList.remove(
      "option-btn--wrong"
    );

    void button.offsetWidth;

    button.classList.add(
      "option-btn--wrong"
    );

    toast(
      "ยังไม่ใช่คำตอบนี้นะ ♡"
    );
  }

  /* ==========================================================
     CARD UNLOCK CINEMATIC
  ========================================================== */

  function playUnlockCinematic(
    card
  ) {
    return new Promise(
      (resolve) => {
        const overlay =
          $("#unlockCinematic");

        if (!overlay) {
          play(
            "#sfxSuccess"
          );
          resolve();
          return;
        }

        state.unlockAnimating =
          true;

        const title =
          $("#unlockTitle");

        if (title) {
          title.textContent =
            card.rewardTitle;
        }

        const number =
          $("#unlockNumber");

        if (number) {
          number.textContent =
            String(card.id).padStart(
              2,
              "0"
            );
        }

        overlay.classList.remove(
          "unlock-cinematic--show"
        );

        void overlay.offsetWidth;

        overlay.classList.add(
          "unlock-cinematic--show"
        );

        setTimeout(
          () =>
            play(
              "#sfxSuccess"
            ),
          560
        );

        setTimeout(
          () => {
            overlay.classList.remove(
              "unlock-cinematic--show"
            );

            setTimeout(
              () => {
                state.unlockAnimating =
                  false;

                resolve();
              },
              650
            );
          },
          1950
        );
      }
    );
  }

  async function successCard(
    card
  ) {
    if (
      state.unlockAnimating
    ) {
      return;
    }

    burstConfetti();

    unlock(
      card.id
    );

    await playUnlockCinematic(
      card
    );

    showReward(
      card
    );
  }

  /* ==========================================================
     REWARD
  ========================================================== */

  function showReward(
    card
  ) {
    const image =
      $("#rewardImage");

    if (!image) {
      showScreen(
        "lobby"
      );
      return;
    }

    image.onerror =
      () => {
        image.onerror =
          null;

        image.src =
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="900"
              height="1200"
            >
              <defs>
                <linearGradient
                  id="g"
                  x1="0"
                  x2="1"
                >
                  <stop
                    stop-color="#F3EDF8"
                  />
                  <stop
                    offset="1"
                    stop-color="#E8A5C1"
                  />
                </linearGradient>
              </defs>

              <rect
                width="100%"
                height="100%"
                fill="url(#g)"
              />

              <text
                x="50%"
                y="47%"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="#8E6AA7"
                font-family="serif"
                font-size="70"
              >
                PHOTO ${card.id}
              </text>
            </svg>
          `);
      };

    image.classList.remove(
      "reward-photo--reveal"
    );

    void image.offsetWidth;

    image.src =
      card.image;

    image.classList.add(
      "reward-photo--reveal"
    );

    const title =
      $("#rewardTitle");

    if (title) {
      title.textContent =
        card.rewardTitle;
    }

    const text =
      $("#rewardText");

    if (text) {
      text.textContent =
        card.rewardText;
    }

    const next =
      $("#nextCardBtn");

    if (next) {
      next.textContent =
        "กลับไปหน้าไพ่";
    }

    showScreen(
      "reward"
    );
  }

  /* ==========================================================
     EFFECTS
  ========================================================== */

  function burstConfetti() {
    for (
      let i = 0;
      i < 36;
      i += 1
    ) {
      const particle =
        document.createElement(
          "span"
        );

      particle.className =
        "confetti";

      particle.style.left =
        `${
          50 +
          (Math.random() - 0.5) *
            20
        }%`;

      particle.style.top =
        `${
          40 +
          (Math.random() - 0.5) *
            15
        }%`;

      particle.style.setProperty(
        "--x",
        `${
          (Math.random() - 0.5) *
          420
        }px`
      );

      particle.style.setProperty(
        "--y",
        `${
          (Math.random() - 0.5) *
          420
        }px`
      );

      document.body.appendChild(
        particle
      );

      setTimeout(
        () => particle.remove(),
        1000
      );
    }
  }

  function clearTapTimer() {
    if (state.tapTimer) {
      clearInterval(
        state.tapTimer
      );

      state.tapTimer =
        null;
    }
  }

  /* ==========================================================
     TOWER FINALE
  ========================================================== */

  function renderTowerLoveMessage() {
    const box =
      $("#skyLoveMessage");

    if (!box) return;

    box.innerHTML =
      "";

    data.letter.body.forEach(
      (line) => {
        const p =
          document.createElement(
            "p"
          );

        p.textContent =
          line;

        box.appendChild(
          p
        );
      }
    );

    const sign =
      document.createElement(
        "div"
      );

    sign.className =
      "sky-love-sign";

    sign.textContent =
      data.letter.sign;

    box.appendChild(
      sign
    );
  }

  function makeTowerStars() {
    const root =
      $("#towerStarField");

    const inner =
      $("#innerStars");

    if (!root && !inner) {
      return;
    }

    if (root) {
      root.innerHTML =
        "";
    }

    if (inner) {
      inner.innerHTML =
        "";
    }

    const mobile =
      window.matchMedia(
        "(max-width: 600px)"
      ).matches;

    const outerCount =
      mobile ? 48 : 88;

    const innerCount =
      28;

    if (root) {
      for (
        let i = 0;
        i < outerCount;
        i += 1
      ) {
        const star =
          document.createElement(
            "span"
          );

        star.className =
          "tower-star";

        star.textContent =
          Math.random() > 0.83
            ? "✦"
            : "·";

        star.style.left =
          `${Math.random() * 100}%`;

        star.style.top =
          `${Math.random() * 76}%`;

        star.style.setProperty(
          "--star-size",
          `${5 + Math.random() * 11}px`
        );

        star.style.animationDelay =
          `${Math.random() * -6}s`;

        star.style.animationDuration =
          `${3 + Math.random() * 5}s`;

        root.appendChild(
          star
        );
      }
    }

    if (inner) {
      for (
        let i = 0;
        i < innerCount;
        i += 1
      ) {
        const star =
          document.createElement(
            "span"
          );

        star.className =
          "tower-star";

        star.textContent =
          "✦";

        star.style.left =
          `${Math.random() * 100}%`;

        star.style.top =
          `${5 + Math.random() * 80}%`;

        star.style.setProperty(
          "--star-size",
          `${4 + Math.random() * 8}px`
        );

        star.style.animationDelay =
          `${Math.random() * -5}s`;

        star.style.animationDuration =
          `${3 + Math.random() * 4}s`;

        inner.appendChild(
          star
        );
      }
    }
  }

  function makeTowerLanterns() {
    const outer =
      $("#towerLanternField");

    const inner =
      $("#innerLanterns");

    if (!outer && !inner) {
      return;
    }

    if (outer) {
      outer.innerHTML =
        "";
    }

    if (inner) {
      inner.innerHTML =
        "";
    }

    const mobile =
      window.matchMedia(
        "(max-width: 600px)"
      ).matches;

    const outerCount =
      mobile ? 12 : 22;

    const innerCount =
      8;

    const createLantern =
      (
        parent,
        innerMode
      ) => {
        if (!parent) {
          return;
        }

        const lantern =
          document.createElement(
            "span"
          );

        lantern.className =
          innerMode
            ? "tower-lantern tower-lantern--inner"
            : "tower-lantern";

        lantern.innerHTML = `
          <span class="tower-lantern-glow"></span>

          <span class="tower-lantern-body">
            <span></span>
          </span>
        `;

        lantern.style.left =
          `${Math.random() * 100}%`;

        if (innerMode) {
          lantern.style.animationDuration =
            `${17 + Math.random() * 13}s`;

          lantern.style.animationDelay =
            `${Math.random() * -24}s`;

          lantern.style.setProperty(
            "--lantern-size",
            `${0.45 + Math.random() * 0.42}`
          );
        } else {
          lantern.style.animationDuration =
            `${21 + Math.random() * 17}s`;

          lantern.style.animationDelay =
            `${Math.random() * -30}s`;

          lantern.style.setProperty(
            "--lantern-size",
            `${0.60 + Math.random() * 0.65}`
          );
        }

        lantern.style.setProperty(
          "--lantern-sway",
          `${(Math.random() - 0.5) * 100}px`
        );

        parent.appendChild(
          lantern
        );
      };

    for (
      let i = 0;
      i < outerCount;
      i += 1
    ) {
      createLantern(
        outer,
        false
      );
    }

    for (
      let i = 0;
      i < innerCount;
      i += 1
    ) {
      createLantern(
        inner,
        true
      );
    }
  }

  /* ==========================================================
     3D TOWER MODEL — graceful loading / fallback
  ========================================================== */

  function setupTowerModel() {
    const model = $("#towerModel");
    const wrap = document.querySelector(".tower-model-wrap");

    if (!model || !wrap) return;

    const markReady = () => {
      wrap.classList.add("model-ready");
    };

    const showFallback = () => {
      wrap.classList.remove("model-ready");
    };

    onElement(model, "load", markReady);
    onElement(model, "error", showFallback);

    /* If model-viewer is not available because of network/CSP,
       keep the CSS tower fallback instead of breaking the page. */
    setTimeout(() => {
      if (customElements && customElements.get("model-viewer")) {
        return;
      }
      showFallback();
    }, 1600);
  }

  function resetTowerScene() {
    clearTimeout(
      state.towerRevealTimer
    );

    state.towerRevealTimer =
      null;

    state.towerOpened =
      false;

    const stage =
      $("#towerStage");

    if (stage) {
      stage.classList.remove(
        "tower-stage--opened",
        "tower-stage--revealed"
      );
    }

    const towerWindow =
      $("#towerWindow");

    if (towerWindow) {
      towerWindow.classList.remove(
        "tower-window--opened"
      );
    }

    const skyMessage =
      $("#skyMessage");

    if (skyMessage) {
      skyMessage.classList.remove(
        "sky-message--visible"
      );
    }

    const actions =
      $("#towerFinalActions");

    if (actions) {
      actions.classList.remove(
        "tower-final-actions--visible"
      );
    }

    const button =
      $("#openTowerBtn");

    if (button) {
      button.disabled =
        false;

      button.textContent =
        data.finale?.openButton || "เปิดหน้าต่าง ✦";
    }

    const hint =
      $("#towerHint");

    if (hint) {
      hint.textContent =
        data.finale?.openingHint || "แตะหน้าต่างหรือปุ่มด้านบนเพื่อเปิด";
    }
  }

  function openFinale() {
    if (
      state.unlocked.length !==
      data.cards.length
    ) {
      toast(
        "ต้องปลดล็อกความทรงจำครบทั้ง 9 ใบก่อนนะ ♡"
      );
      return;
    }

    resetTowerScene();

    makeTowerStars();

    makeTowerLanterns();

    showScreen(
      "finale"
    );
  }

  function openTowerWindow() {
    if (state.towerOpened) {
      return;
    }

    state.towerOpened =
      true;

    const stage =
      $("#towerStage");

    const towerWindow =
      $("#towerWindow");

    const message =
      $("#skyMessage");

    const button =
      $("#openTowerBtn");

    const hint =
      $("#towerHint");

    const actions =
      $("#towerFinalActions");

    stage?.classList.add(
      "tower-stage--opened"
    );

    towerWindow?.classList.add(
      "tower-window--opened"
    );

    if (button) {
      button.disabled =
        true;

      button.textContent =
        data.finale?.openedButton || "หน้าต่างเปิดแล้ว ♡";
    }

    if (hint) {
      hint.textContent =
        "ท้องฟ้ากำลังเปิดเรื่องราวของเรา…";
    }

    setTimeout(
      () => {
        message?.classList.add(
          "sky-message--visible"
        );

        if (hint) {
          hint.textContent =
            data.finale?.revealHint || "อ่านข้อความบนท้องฟ้า แล้วค่อยไปต่อกันนะ ♡";
        }
      },
      1150
    );

    state.towerRevealTimer =
      setTimeout(
        () => {
          stage?.classList.add(
            "tower-stage--revealed"
          );

          actions?.classList.add(
            "tower-final-actions--visible"
          );

          if (hint) {
            hint.textContent =
              data.finale?.finalHint || "มีอีกอย่างหนึ่งซ่อนอยู่ท้ายเรื่องราว…";
          }
        },
        2450
      );
  }

  /* ==========================================================
     TIMELINE
  ========================================================== */

  /* ==========================================================
     ROMANTIC SCRAPBOOK MEMORY GALLERY
  ========================================================== */

  const memoryGallery = {
    index: 0
  };

  function renderTimeline() {
    const list =
      $("#timelineList");

    if (!list) return;

    list.innerHTML = "";

    data.cards.forEach(
      (card, index) => {
        const item =
          document.createElement("article");

        item.className =
          "scrapbook-photo";

        item.tabIndex = 0;

        item.setAttribute(
          "role",
          "button"
        );

        item.setAttribute(
          "aria-label",
          `เปิดความทรงจำ ${card.id}: ${card.timelineCaption}`
        );

        item.innerHTML = `
          <img
            src="${card.image}"
            alt="${card.timelineCaption}"
            loading="lazy"
          >

          <span class="scrapbook-photo__index">
            ${String(index + 1).padStart(2, "0")}
          </span>

          <span class="scrapbook-photo__title">
            ${card.timelineCaption}
          </span>
        `;

        const open = () => {
          openMemoryModal(index);
        };

        item.addEventListener(
          "click",
          open
        );

        item.addEventListener(
          "keydown",
          (event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              open();
            }
          }
        );

        const img =
          $("img", item);

        if (img) {
          img.addEventListener(
            "error",
            () => {
              img.style.opacity = ".28";
            }
          );
        }

        list.appendChild(
          item
        );
      }
    );
  }

  function openMemoryModal(index) {
    if (
      index < 0 ||
      index >= data.cards.length
    ) {
      return;
    }

    memoryGallery.index =
      index;

    const modal =
      $("#memoryModal");

    if (!modal) return;

    updateMemoryModal();

    modal.classList.add(
      "memory-modal--show"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "memory-modal-open"
    );

    const closeButton =
      $(".memory-modal__close", modal);

    closeButton?.focus();
  }

  function closeMemoryModal() {
    const modal =
      $("#memoryModal");

    if (!modal) return;

    modal.classList.remove(
      "memory-modal--show"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "memory-modal-open"
    );
  }

  function updateMemoryModal() {
    const card =
      data.cards[
        memoryGallery.index
      ];

    if (!card) return;

    const image =
      $("#memoryModalImage");

    if (image) {
      image.src =
        card.image;

      image.alt =
        card.timelineCaption;
    }

    const date =
      $("#memoryModalDate");

    if (date) {
      date.textContent =
        card.timelineDate;
    }

    const title =
      $("#memoryModalTitle");

    if (title) {
      title.textContent =
        card.timelineCaption;
    }

    const text =
      $("#memoryModalText");

    if (text) {
      text.textContent =
        card.timelineText;
    }

    const counter =
      $("#memoryModalCounter");

    if (counter) {
      counter.textContent =
        `${String(memoryGallery.index + 1).padStart(2, "0")} / ${String(data.cards.length).padStart(2, "0")}`;
    }
  }

  function moveMemory(delta) {
    const total =
      data.cards.length;

    if (!total) return;

    memoryGallery.index =
      (memoryGallery.index +
        delta +
        total) %
      total;

    updateMemoryModal();
  }

  /* ==========================================================
     SECRET MEMORY
  ========================================================== */

  function renderSecretMemory() {
    const collage =
      $("#secretMemoryCollage");

    if (!collage) return;

    collage.innerHTML =
      "";

    data.cards.forEach(
      (card, index) => {
        const figure =
          document.createElement(
            "figure"
          );

        figure.className =
          "secret-memory-photo";

        figure.style.setProperty(
          "--i",
          index
        );

        figure.innerHTML = `
          <img
            src="${card.image}"
            alt="ความทรงจำ ${card.id}"
            loading="lazy"
          >
        `;

        const image =
          $("img", figure);

        if (image) {
          image.addEventListener(
            "error",
            () => {
              figure.style.opacity =
                ".25";
            }
          );
        }

        collage.appendChild(
          figure
        );
      }
    );
  }

  /* ==========================================================
     RESET / TEST
  ========================================================== */

  function resetAll() {
    const confirmed =
      confirm(
        "รีเซ็ตความคืบหน้าทั้งหมดใช่ไหม?"
      );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "anniversary-unlocked"
    );

    localStorage.removeItem(
      "anniversary-helper-uses"
    );

    localStorage.removeItem(
      "anniversary-helper-cards"
    );

    state.unlocked =
      [];

    state.helperUses =
      0;

    state.helperUsedCards =
      [];

    updateProgress();

    showScreen(
      "lobby"
    );
  }

  function testUnlockAll() {
    const confirmed =
      confirm(
        "ปลดล็อกไพ่ทั้ง 9 ใบสำหรับการทดสอบใช่ไหม?"
      );

    if (!confirmed) {
      return;
    }

    state.unlocked =
      data.cards.map(
        (card) => card.id
      );

    save();

    updateProgress();

    toast(
      "ปลดล็อกไพ่ทั้ง 9 ใบแล้ว 🔓"
    );
  }

  /* ==========================================================
     SAFE EVENT BINDINGS
     ========================================================== */

  on(
    "#startBtn",
    "click",
    () => {
      showScreen(
        "lobby"
      );

      const bgm =
        $("#bgm");

      if (bgm) {
        bgm.volume =
          0.35;
      }

      play(
        "#bgm"
      );
    }
  );

  on(
    "#replayIntro",
    "click",
    () => showScreen("intro")
  );

  on(
    "#resetProgress",
    "click",
    resetAll
  );

  on(
    "#testUnlockAll",
    "click",
    testUnlockAll
  );

  on(
    "#themeToggle",
    "click",
    () => {
      const lobby =
        $("#lobby");

      if (!lobby) {
        return;
      }

      state.nightTheme =
        !state.nightTheme;

      lobby.classList.toggle(
        "night-theme",
        state.nightTheme
      );

      const button =
        $("#themeToggle");

      if (button) {
        button.setAttribute(
          "aria-pressed",
          String(
            state.nightTheme
          )
        );

        button.textContent =
          state.nightTheme
            ? "☀️"
            : "🌙";
      }
    }
  );

  on(
    "#backToLobbyFromChallenge",
    "click",
    () => showScreen("lobby")
  );

  on(
    "#backToLobbyFromReward",
    "click",
    () => showScreen("lobby")
  );

  on(
    "#nextCardBtn",
    "click",
    () => showScreen("lobby")
  );

  on(
    "#openGoldenBtn",
    "click",
    openFinale
  );

  on(
    "#openTimelineBtn",
    "click",
    () => {
      if (
        state.unlocked.length !==
        data.cards.length
      ) {
        toast(
          "Memory Scrapbook จะเปิดเมื่อครบทั้ง 9 ใบก่อนนะ ♡"
        );
        return;
      }

      renderTimeline();

      showScreen(
        "timeline"
      );
    }
  );

  on(
    "#backToLobbyFromFinale",
    "click",
    () => showScreen("lobby")
  );

  /*
    This ID existed in one older build but is not
    required by the current Tower layout.
    Safe binding prevents it from crashing the app.
  */
  on(
    "#viewMemoriesBtn",
    "click",
    () => showScreen("lobby")
  );

  on(
    "#backToLobbyFromTimeline",
    "click",
    () => showScreen("lobby")
  );

  /*
    Legacy button name from the letter build.
    Current Tower build does not need it, but if present
    it can still return to the finale safely.
  */
  on(
    "#timelineToLetter",
    "click",
    openFinale
  );

  on(
    ".memory-modal__close",
    "click",
    closeMemoryModal
  );

  on(
    "#memoryPrevBtn",
    "click",
    () => moveMemory(-1)
  );

  on(
    "#memoryNextBtn",
    "click",
    () => moveMemory(1)
  );

  onElement(
    document,
    "keydown",
    (event) => {
      const modal = $("#memoryModal");

      if (
        !modal ||
        !modal.classList.contains("memory-modal--show")
      ) {
        return;
      }

      if (event.key === "Escape") {
        closeMemoryModal();
      } else if (event.key === "ArrowLeft") {
        moveMemory(-1);
      } else if (event.key === "ArrowRight") {
        moveMemory(1);
      }
    }
  );

  on(
    "#openTimelineFromTower",
    "click",
    () => {
      if (
        state.unlocked.length !==
        data.cards.length
      ) {
        toast(
          "Memory Scrapbook จะเปิดเมื่อครบทั้ง 9 ใบนะ ♡"
        );
        return;
      }

      renderTimeline();

      showScreen(
        "timeline"
      );
    }
  );

  on(
    "#openTowerBtn",
    "click",
    openTowerWindow
  );

  on(
    "#towerWindow",
    "click",
    openTowerWindow
  );

  on(
    "#towerWindow",
    "keydown",
    (event) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openTowerWindow();
      }
    }
  );

  on(
    "#secretBtn",
    "click",
    () => showScreen("secret")
  );

  on(
    "#backToFinaleFromSecret",
    "click",
    () => showScreen("finale")
  );

  on(
    "#backToFinaleFromSecretEnd",
    "click",
    () => showScreen("finale")
  );

  on(
    "#secretYesBtn",
    "click",
    () => {
      burstConfetti();

      for (
        let i = 0;
        i < 18;
        i += 1
      ) {
        setTimeout(
          burstConfetti,
          i * 90
        );
      }

      setTimeout(
        () =>
          showScreen("secretEnd"),
        900
      );
    }
  );

  on(
    "#secretMemoryBtn",
    "click",
    () => {
      renderSecretMemory();

      showScreen(
        "secretMemory"
      );
    }
  );

  on(
    "#backToSecretEnd",
    "click",
    () => showScreen("secretEnd")
  );

  on(
    "#backToStart",
    "click",
    () => showScreen("lobby")
  );

  /* ==========================================================
     BUTTON MICRO INTERACTION
  ========================================================== */

  onElement(
    document,
    "click",
    (event) => {
      const button =
        event.target.closest(
          "button"
        );

      if (!button) {
        return;
      }

      button.classList.add(
        "button-pop"
      );

      setTimeout(
        () =>
          button.classList.remove(
            "button-pop"
          ),
        230
      );
    }
  );

  /* ==========================================================
     BOOT
  ========================================================== */

  initContent();

  createOpeningHearts();

  createLobbyAtmosphere();

  setupLobbyParallax();

  setupTowerModel();

  setupAudio();

  renderCards();

  updateProgress();

  updateElapsedTimer();

  setInterval(
    updateElapsedTimer,
    1000
  );

  createParticles(
    "introParticles",
    26,
    "particle"
  );

  createParticles(
    "ambient",
    18,
    "ambient-dot"
  );
})();
