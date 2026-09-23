/* EngMon — 페이지 공통 동작 (MonsterLab 공용 스크립트에서 분기)
   ==========================================================================

   구조
     1. i18n 사전
     2. 공용 API  → window.MonsterLab (magazine.js 같은 다른 페이지 스크립트가 씁니다)
     3. 언어 전환
     4. 기능별 초기화 — 모두 guard()로 격리

   왜 이렇게 나눴나:
     예전에는 모든 기능이 한 줄기로 실행됐습니다. 그래서 테마 초기화가 예외로
     죽으면 그 뒤에 있던 언어 버튼 리스너도 함께 죽어, "테마 아이콘이 안 보이고
     언어 전환도 안 되는" 증상이 한 번에 나타났습니다. 이제 기능 하나가 실패해도
     나머지는 그대로 동작하고, 실패한 기능만 콘솔에 남습니다.
   ========================================================================== */
(function () {
  'use strict';

  /* ── 1. i18n 사전 ───────────────────────────────────────────────────── */
  var I18N = {
    ko: {
      'nav.services': '서비스',
      'nav.faq': 'FAQ',
      'top.back': '맨 위로',
      'theme.dark': '다크',
      'theme.light': '라이트',
      'theme.system': '시스템',
      'theme.group': '테마 선택',
      'theme.setDark': '다크 모드로 보기',
      'theme.setLight': '라이트 모드로 보기',
      'theme.setSystem': '시스템 설정 따르기',

      'footer.themeLabel': '테마',
      'footer.accentLabel': '강조색',
      'accent.group': '강조색 선택',
      'accent.mint': '민트',
      'accent.violet': '바이올렛',
      'accent.ocean': '오션',
      'accent.amber': '앰버',

      'mag.navIssue': '이번 주',
      'mag.navSections': '섹션',
      'mag.navReview': '복습',
      'mag.navWords': '단어장',
      'mag.navPlan': '플랜',
      'mag.navHome': '홈',
      'mag.startReading': '읽기 시작',
      'mag.openWordbook': '단어장',
      'mag.hideKo': '번역 가리기',
      'mag.hideKoOn': '번역을 가렸습니다',
      'mag.hideKoOff': '번역을 다시 보여줍니다',
      'mag.issuePicker': '주 선택',
      'mag.issueSwitched': '주를 바꿨습니다',
      'mag.week': '주차',
      'mag.quarter': '분기',
      'mag.status': '상태',
      'mag.published': '발행됨',
      'mag.planned': '발행 예정',
      'mag.openPlan': '52주 플랜 보기',
      'mag.plannedTitle': '이 주는 아직 준비 중입니다',
      'mag.plannedToc': '구성을 마치는 대로 공개합니다.',
      'mag.plannedLead': '5주부터는 구성이 끝나는 대로 차례로 공개합니다. 아래 플랜에서 이 주의 주제를 먼저 볼 수 있습니다.',
      'mag.planKicker': '52 WEEKS',
      'mag.planTitle': '1년 52주 플랜',
      'mag.planLead': '4분기 52주입니다. 발행된 주는 바로 읽을 수 있고, 아직 준비 중인 주는 주제만 먼저 보여 줍니다. 구성을 마치는 대로 차례로 공개합니다.',
      'mag.sectionSuffix': '개 섹션',
      'mag.guideTitle': '이 주를 이렇게 쓰세요',
      'mag.guide1': '표지에서 이번 주 섹션을 훑고 오늘 할 분량을 정합니다. 한 섹션에 1~8분이면 충분합니다.',
      'mag.guide2': '듣기를 한 번 재생한 뒤, 영어만 눈으로 다시 읽습니다.',
      'mag.guide3': '모르는 표현은 단어장에 담고, 확인 문제와 받아쓰기로 점검합니다.',
      'mag.guide4': '복습 화면에서 카드를 넘기고, 완료 표시로 진행률을 채웁니다.',
      'mag.words': '단어',
      'mag.sentences': '문장',
      'mag.meaning': '영영 뜻',
      'mag.example': '예문',
      'mag.playLine': '이 줄 듣기',
      'mag.playWord': '발음 듣기',
      'mag.playAll': '대화 전체 듣기',
      'mag.quizScore': '정답',
      'mag.quizRetry': '다시 풀기',
      'mag.check': '확인',
      'mag.reveal': '정답 보기',
      'mag.correct': '정확합니다',
      'mag.incorrect': '다시 들어보세요',
      'mag.answerIs': '정답',
      'mag.youTyped': '내가 쓴 문장',
      'mag.typeFirst': '문장을 입력해 주세요',
      'mag.emptySection': '이 섹션은 준비 중입니다.',
      'mag.reviewKicker': 'REVIEW',
      'mag.reviewTitle': '단어 복습',
      'mag.reviewLead': '단어장에 담은 표현을 카드로 다시 봅니다. 맞힌 카드는 더 늦게, 틀린 카드는 더 자주 나옵니다.',
      'mag.reviewStart': '복습 시작',
      'mag.reviewEmpty': '복습할 카드가 없습니다. 먼저 단어를 담아 보세요.',
      'mag.reviewDone': '오늘 복습을 마쳤습니다.',
      'mag.reviewFlip': '뜻 보기',
      'mag.reviewKnow': '알아요',
      'mag.reviewAgain': '몰라요',
      'mag.reviewCard': '카드',
      'mag.reviewDue': '오늘 볼 카드',
      'mag.searchPlaceholder': '단어 검색',
      'mag.export': 'CSV로 내보내기',
      'mag.exported': 'CSV 파일을 저장했습니다',
      'mag.exportEmpty': '내보낼 단어가 없습니다',
      'mag.noMatch': '검색 결과가 없습니다.',
      'mag.print': '인쇄 · PDF',
      'mag.dailyTitle': '오늘의 학습',
      'mag.dailyUnit': '개 활동',
      'mag.streakLabel': '일 연속',
      'mag.bestLabel': '최고',
      'mag.dailyGoalReached': '오늘 목표를 채웠습니다',
      'mag.backup': '전체 백업(JSON)',
      'mag.restore': '백업 가져오기',
      'mag.backupDone': '백업 파일을 저장했습니다',
      'mag.restoreDone': '백업을 불러왔습니다',
      'mag.restoreFailed': '이 파일은 읽을 수 없습니다',
      'mag.tocKicker': 'CONTENTS',
      'mag.tocTitle': '이번 주의 섹션',
      'mag.tocLead': '섹션별로 듣고, 읽고, 모르는 단어는 단어장에 담아두세요. 진행 상황은 이 브라우저에 저장됩니다.',
      'mag.wbKicker': 'WORDBOOK',
      'mag.wbTitle': '저장한 단어',
      'mag.wbLead': '저장한 표현은 이 브라우저에 남습니다. 나중에 복사해 노트 앱이나 학습 앱으로 옮기세요.',
      'mag.wbEmpty': '아직 저장한 단어가 없습니다.',
      'mag.wbCopy': '전체 복사',
      'mag.wbClear': '비우기',
      'mag.wbCopied': '단어장을 복사했습니다',
      'mag.wbClearConfirm': '저장한 단어를 모두 지울까요?',
      'mag.progressLabel': '읽기 진행',
      'mag.minSuffix': '분',
      'mag.rateLabel': '듣기 속도',
      'mag.rateGroup': '듣기 속도 선택',
      'mag.rateSaved': '듣기 속도를 바꿨습니다',
      'mag.resume': '이어서 읽기',
      'mag.nextSection': '다음 섹션',
      'mag.nextNote': '보통 영업일 기준 2~3일 안에 답장드립니다.',
      'mag.nextTitle': '새 주가 나오면 알려드릴까요?',
      'mag.nextLead': '새 주 소식과 피드백은 모두 같은 메일로 받습니다. 원하는 주제가 있으면 함께 적어 보내주세요.',
      'mag.subscribe': '메일 보내기',

      'form.type': '문의 유형',
      'form.type.subscribe': '새 주 알림 신청',
      'form.type.content': '콘텐츠 오류·오타 제보',
      'form.type.topic': '새 주제·주차 제안',
      'form.type.study': '학습 방법 질문',
      'form.type.partner': '제휴·광고 문의',
      'form.type.etc': '그 외 문의',
      'form.hint.subscribe': '새 주가 나오면 알려드립니다. 내용은 비워 두어도 됩니다.',
      'form.hint.content': '어느 주의 어느 부분인지 알려 주시면 빠르게 고칩니다.',
      'form.hint.topic': '다뤄 주었으면 하는 주제나 표현을 적어 주세요.',
      'form.hint.study': '막힐는 부분과 지금까지 해 본 방법을 알려 주세요.',
      'form.hint.partner': '어떤 형태의 제휴·광고를 생각하시는지 알려 주세요.',
      'form.hint.etc': '무엇이든 편하게 적어 주세요.',
      'form.ph.subscribe': '원하는 주제나 다뤄 주었으면 하는 표현을 적어 주세요.',
      'form.ph.content': '예) W03 회화에서 오타를 찾았어요',
      'form.ph.topic': '예) 병원에서 쓰는 표현을 다뤄 주세요',
      'form.ph.study': '예) 뉴스 듣기가 너무 빠르게 느껴져요',
      'form.ph.partner': '예) 학습 앱과 함께 소개하고 싶습니다',
      'form.ph.etc': '자유롭게 적어 주세요',
      'form.name': '이름 또는 닉네임 (선택)',
      'form.namePh': '별명이어도 괜찮습니다.',
      'form.issue': '관련 주 (선택)',
      'form.issueNone': '해당 없음',
      'form.messageRequired': '하고 싶은 말 (필수)',
      'form.needDetail': '내용을 조금만 적어 주세요.',
      'form.email': '답장 받을 이메일',
      'form.emailPh': 'you@example.com',
      'form.message': '하고 싶은 말 (선택)',
      'form.send': '보내기',
      'form.sending': '보내는 중…',
      'form.sent': '보냈습니다. 다음 주가 나오면 알려드리겠습니다.',
      'form.sendFail': '전송하지 못했습니다. 잠시 후 다시 시도하거나 메일로 보내 주세요.',
      'form.rateLimited': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
      'form.privacy': '남겨 주신 주소는 다음 주 안내와 답장에만 씁니다.',
      'mag.theme': '테마',
      'mag.level': '레벨',
      'mag.sections': '섹션',
      'mag.minutes': '분',
      'mag.listen': '듣기',
      'mag.stop': '정지',
      'mag.noAudio': '이 브라우저에서는 오디오를 재생할 수 없습니다',
      'mag.save': '단어장에 저장',
      'mag.saved': '저장됨',
      'mag.markDone': '완료 표시',
      'mag.done': '완료됨',
      'mag.remove': '빼기',
      'mag.quizCorrect': '정답입니다',
      'mag.quizWrong': '다시 보세요',
      'mag.kind.vocabulary': '어휘',
      'mag.kind.phrasal': '구동사',
      'mag.kind.collocation': '연어',
      'mag.kind.grammar': '문법',
      'mag.kind.pronunciation': '발음',
      'mag.kind.idioms': '이디엄',
      'mag.kind.slang': '슬랭',
      'mag.kind.natural': '자연스러운 표현',
      'mag.kind.conversation': '회화',
      'mag.kind.listening': '듣기·받아쓰기',
      'mag.kind.reading': '독해',
      'mag.kind.writing': '쓰기',
      'mag.kind.discussion': '토론',
      'mag.kind.culture': '문화',
      'mag.kind.quiz': '확인 문제',
      'mag.kind.humor': '유머',
      'mag.kind.note': '해설 노트',

      'mag.pageTitle': 'EngMon — 1년 52주 영어 매거진',
      'mag.pageDesc': '1년 52주 플랜으로 한 주씩 읽는 영어 학습 매거진. 주마다 한 가지 주제를 어휘·구동사·문법·발음·회화·받아쓰기·독해·확인 문제로 끝까지 파고들니다. 브라우저 음성으로 바로 듣습니다.',

      'footer.rights': '모든 권리 보유.',
      'footer.analytics': '방문 통계(Clarity)는 켠 경우에만 수집하며, 입력창에 적은 내용은 기록되지 않습니다. 학습 기록(단어장·진행률)은 이 브라우저에만 남습니다.'
    },

    en: {
      'nav.services': 'Services',
      'nav.faq': 'FAQ',
      'top.back': 'Back to top',
      'theme.dark': 'Dark',
      'theme.light': 'Light',
      'theme.system': 'System',
      'theme.group': 'Choose a theme',
      'theme.setDark': 'Use dark mode',
      'theme.setLight': 'Use light mode',
      'theme.setSystem': 'Follow the system setting',

      'footer.themeLabel': 'Theme',
      'footer.accentLabel': 'Accent',
      'accent.group': 'Choose an accent color',
      'accent.mint': 'Mint',
      'accent.violet': 'Violet',
      'accent.ocean': 'Ocean',
      'accent.amber': 'Amber',

      'mag.navIssue': 'This week',
      'mag.navSections': 'Sections',
      'mag.navReview': 'Review',
      'mag.navWords': 'Wordbook',
      'mag.navPlan': 'Plan',
      'mag.navHome': 'Home',
      'mag.startReading': 'Start reading',
      'mag.openWordbook': 'Wordbook',
      'mag.hideKo': 'Hide translation',
      'mag.hideKoOn': 'Translation hidden',
      'mag.hideKoOff': 'Translation shown again',
      'mag.issuePicker': 'Choose a week',
      'mag.issueSwitched': 'Week changed',
      'mag.week': 'Week',
      'mag.quarter': 'Quarter',
      'mag.status': 'Status',
      'mag.published': 'Published',
      'mag.planned': 'Coming soon',
      'mag.openPlan': 'See the 52-week plan',
      'mag.plannedTitle': 'This week is not published yet',
      'mag.plannedToc': 'It will appear as soon as it is finished.',
      'mag.plannedLead': 'Weeks five onwards appear as soon as each one is finished. The plan below shows what this week will cover.',
      'mag.planKicker': '52 WEEKS',
      'mag.planTitle': 'A 52-week plan',
      'mag.planLead': 'Fifty-two weeks across four quarters. Published weeks are ready to read; weeks still being written show their topic first.',
      'mag.sectionSuffix': ' sections',
      'mag.guideTitle': 'How to use this week',
      'mag.guide1': 'Skim this week sections on the cover and pick the part for today. One section takes one to eight minutes.',
      'mag.guide2': 'Play the audio once, then read the English again with your eyes only.',
      'mag.guide3': 'Save unknown expressions, then check yourself with the quiz and the dictation.',
      'mag.guide4': 'Turn the cards on the review screen, and mark sections done to fill the progress bar.',
      'mag.words': 'words',
      'mag.sentences': 'sentences',
      'mag.meaning': 'Meaning',
      'mag.example': 'Example',
      'mag.playLine': 'Play this line',
      'mag.playWord': 'Play the pronunciation',
      'mag.playAll': 'Play the whole dialogue',
      'mag.quizScore': 'correct',
      'mag.quizRetry': 'Try again',
      'mag.check': 'Check',
      'mag.reveal': 'Show answer',
      'mag.correct': 'Correct',
      'mag.incorrect': 'Listen again',
      'mag.answerIs': 'Answer',
      'mag.youTyped': 'Your answer',
      'mag.typeFirst': 'Type the sentence first',
      'mag.emptySection': 'This section is being prepared.',
      'mag.reviewKicker': 'REVIEW',
      'mag.reviewTitle': 'Word review',
      'mag.reviewLead': 'Review the expressions you saved as cards. Cards you know come back later, cards you miss come back sooner.',
      'mag.reviewStart': 'Start review',
      'mag.reviewEmpty': 'No cards to review yet. Save a few words first.',
      'mag.reviewDone': 'You have finished the review for today.',
      'mag.reviewFlip': 'Show meaning',
      'mag.reviewKnow': 'I know it',
      'mag.reviewAgain': 'Not yet',
      'mag.reviewCard': 'Card',
      'mag.reviewDue': 'Cards due today',
      'mag.searchPlaceholder': 'Search words',
      'mag.export': 'Export CSV',
      'mag.exported': 'The CSV file was saved',
      'mag.exportEmpty': 'There is nothing to export',
      'mag.noMatch': 'No words match your search.',
      'mag.print': 'Print or PDF',
      'mag.dailyTitle': 'Today',
      'mag.dailyUnit': 'actions',
      'mag.streakLabel': 'day streak',
      'mag.bestLabel': 'best',
      'mag.dailyGoalReached': 'Daily goal reached',
      'mag.backup': 'Back up all data',
      'mag.restore': 'Restore backup',
      'mag.backupDone': 'Backup file saved',
      'mag.restoreDone': 'Backup restored',
      'mag.restoreFailed': 'That file could not be read',
      'mag.tocKicker': 'CONTENTS',
      'mag.tocTitle': 'Sections this week',
      'mag.tocLead': 'Listen, read, and save the words you do not know. Your progress is stored in this browser.',
      'mag.wbKicker': 'WORDBOOK',
      'mag.wbTitle': 'Saved words',
      'mag.wbLead': 'Saved expressions stay in this browser. Copy them later into your notes or study app.',
      'mag.wbEmpty': 'No saved words yet.',
      'mag.wbCopy': 'Copy all',
      'mag.wbClear': 'Clear',
      'mag.wbCopied': 'Wordbook copied',
      'mag.wbClearConfirm': 'Remove every saved word?',
      'mag.progressLabel': 'Reading progress',
      'mag.minSuffix': ' min',
      'mag.rateLabel': 'Listening speed',
      'mag.rateGroup': 'Choose the listening speed',
      'mag.rateSaved': 'Listening speed updated',
      'mag.resume': 'Continue',
      'mag.nextSection': 'Next section',
      'mag.nextNote': 'We usually reply within two to three business days.',
      'mag.nextTitle': 'Want to hear when the next week is out?',
      'mag.nextLead': 'New weeks and feedback both land in the same inbox. Tell us which topics you want.',
      'mag.subscribe': 'Send an email',

      'form.type': 'What is this about',
      'form.type.subscribe': 'New week alerts',
      'form.type.content': 'Report an error or typo',
      'form.type.topic': 'Suggest a topic or week',
      'form.type.study': 'Study method question',
      'form.type.partner': 'Partnership or advertising',
      'form.type.etc': 'Something else',
      'form.hint.subscribe': 'We will email you when a new week is out. The message can stay empty.',
      'form.hint.content': 'Tell us the week and the spot and we will fix it fast.',
      'form.hint.topic': 'Tell us the topic or expression you want covered.',
      'form.hint.study': 'Describe where you are stuck and what you have tried.',
      'form.hint.partner': 'Tell us what kind of partnership you have in mind.',
      'form.hint.etc': 'Anything at all, just write it here.',
      'form.ph.subscribe': 'A topic you want covered, or an expression you would like to see.',
      'form.ph.content': 'For example, a typo in the W03 conversation',
      'form.ph.topic': 'For example, please cover phrases for a hospital visit',
      'form.ph.study': 'For example, the news audio feels too fast',
      'form.ph.partner': 'For example, we would like to feature EngMon',
      'form.ph.etc': 'Write as much as you like',
      'form.name': 'Name or nickname (optional)',
      'form.namePh': 'A nickname is fine.',
      'form.issue': 'Related week (optional)',
      'form.issueNone': 'Not about a specific week',
      'form.messageRequired': 'Your message (required)',
      'form.needDetail': 'Please add a short message.',
      'form.email': 'Email to reply to',
      'form.emailPh': 'you@example.com',
      'form.message': 'Anything to add (optional)',
      'form.send': 'Send',
      'form.sending': 'Sending…',
      'form.sent': 'Sent — we will email you when the next week is out.',
      'form.sendFail': 'Could not send. Please try again shortly, or email us instead.',
      'form.rateLimited': 'Too many requests. Please wait a moment and try again.',
      'form.privacy': 'Your address is used only for replies and next-week news.',
      'mag.theme': 'Theme',
      'mag.level': 'Level',
      'mag.sections': 'sections',
      'mag.minutes': 'min',
      'mag.listen': 'Listen',
      'mag.stop': 'Stop',
      'mag.noAudio': 'This browser cannot play the audio',
      'mag.save': 'Save word',
      'mag.saved': 'Saved',
      'mag.markDone': 'Mark done',
      'mag.done': 'Done',
      'mag.remove': 'Remove',
      'mag.quizCorrect': 'Correct',
      'mag.quizWrong': 'Try again',
      'mag.kind.vocabulary': 'Vocabulary',
      'mag.kind.phrasal': 'Phrasal verbs',
      'mag.kind.collocation': 'Collocations',
      'mag.kind.grammar': 'Grammar',
      'mag.kind.pronunciation': 'Pronunciation',
      'mag.kind.idioms': 'Idioms',
      'mag.kind.slang': 'Slang',
      'mag.kind.natural': 'Natural English',
      'mag.kind.conversation': 'Conversation',
      'mag.kind.listening': 'Listening and dictation',
      'mag.kind.reading': 'Reading',
      'mag.kind.writing': 'Writing',
      'mag.kind.discussion': 'Discussion',
      'mag.kind.culture': 'Culture',
      'mag.kind.quiz': 'Quiz',
      'mag.kind.humor': 'Humour',
      'mag.kind.note': 'Notes',

      'mag.pageTitle': 'EngMon — a 52-week English magazine',
      'mag.pageDesc': 'A weekly English magazine built as a 52-week plan. Each week digs into one topic through vocabulary, phrasal verbs, grammar, pronunciation, conversation, dictation, reading and quizzes, read alongside browser audio.',

      'footer.rights': 'All rights reserved.',
      'footer.analytics': 'Visit statistics (Clarity) are collected only when switched on, and text typed into input fields is never recorded. Learning records (wordbook, progress) stay in this browser only.'
    }
  };

  var STORAGE_KEY = 'monsterlab.lang';
  var DEFAULT_LANG = 'ko';

  var htmlEl = document.documentElement;
  var langBtn = document.getElementById('langBtn');
  var langLabel = document.getElementById('langLabel');
  var titleKey = htmlEl.getAttribute('data-title-key');
  var descKey = htmlEl.getAttribute('data-desc-key');

  function currentLang() {
    var lang = htmlEl.getAttribute('lang');
    return I18N[lang] ? lang : DEFAULT_LANG;
  }

  function currentDict() {
    return I18N[currentLang()] || I18N[DEFAULT_LANG];
  }

  /* 키가 없으면 키 이름을 그대로 돌려줍니다 — 화면에서 누락을 바로 알아챌 수 있게.
     magazine.js가 이 함수를 쓰므로, 다른 초기화보다 먼저 준비해야 합니다. */
  function t(key, lang) {
    var dict = I18N[lang] || currentDict();
    return dict[key] != null ? dict[key] : key;
  }

  var toastEl = document.getElementById('toast');
  var toastTimer;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* ── 2. 공용 API ─────────────────────────────────────────────────────
     먼저 노출합니다. 아래 기능 초기화가 실패해도 magazine.js는 이 API를
     찾을 수 있습니다(없으면 화면에 'mag.listen' 같은 키 이름이 그대로 나옵니다). */
  window.MonsterLab = {
    t: t,
    toast: showToast,
    lang: currentLang,
    dict: currentDict
  };

  /* ── 3. 공용 유틸 ──────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function $$(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function on(el, type, handler, options) {
    if (el && el.addEventListener) el.addEventListener(type, handler, options);
  }

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; } /* 시크릿 모드 */
  }

  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 시크릿 모드 */ }
  }

  /* 기능 하나가 예외로 죽어도 나머지 기능과 언어 전환은 계속 동작하게 합니다. */
  function guard(name, init) {
    try {
      init();
    } catch (err) {
      if (window.console && console.error) {
        console.error('[EngMon] ' + name + ' 초기화 실패:', err);
      }
    }
  }

  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ── 4. 언어 전환 ──────────────────────────────────────────────────── */
  function applyLang(lang) {
    var dict = I18N[lang] || I18N[DEFAULT_LANG];

    $$('[data-i18n]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (value != null) el.textContent = value;
    });

    $$('[data-i18n-placeholder]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-placeholder')];
      if (value != null) el.setAttribute('placeholder', value);
    });

    $$('[data-i18n-aria-label]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-aria-label')];
      if (value != null) el.setAttribute('aria-label', value);
    });

    /* 탭 제목과 설명도 함께 바꿔 영어 사용자에게 맞춥니다.
       어떤 페이지인지는 <html data-title-key="..."> 가 알려줍니다. */
    if (titleKey && dict[titleKey]) document.title = dict[titleKey];

    if (descKey && dict[descKey]) {
      var descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute('content', dict[descKey]);
    }

    htmlEl.setAttribute('lang', lang);
    if (langLabel) langLabel.textContent = lang === 'ko' ? 'EN' : 'KO';
    if (langBtn) {
      langBtn.setAttribute('aria-label', lang === 'ko' ? 'Switch to English' : '한국어로 전환');
    }

    writeStore(STORAGE_KEY, lang);

    /* 다른 페이지 스크립트(magazine.js)가 그려놓은 문구도 다시 그리도록 알립니다 */
    if (typeof window.CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    }
  }

  applyLang(readStore(STORAGE_KEY) === 'en' ? 'en' : DEFAULT_LANG);

  on(langBtn, 'click', function () {
    applyLang(currentLang() === 'ko' ? 'en' : 'ko');
  });

  on(document, 'keydown', function (e) {
    /* 언어 전환 단축키: Alt + L (한/영 어느 쪽에서도 동작) */
    if (e.altKey && (e.key === 'l' || e.key === 'L')) {
      applyLang(currentLang() === 'ko' ? 'en' : 'ko');
    }
  });

  /* ── 5. 테마 (라이트 / 다크 / 시스템) ──────────────────────────────── */
  guard('테마', function () {
    var THEME_KEY = 'monsterlab.theme';
    var THEME_MODES = ['light', 'dark', 'system'];
    var THEME_COLORS = { dark: '#0a0e13', light: '#fbfcfd' };
    var THEME_LABEL_KEYS = { light: 'theme.light', dark: 'theme.dark', system: 'theme.system' };
    var THEME_ACTION_KEYS = { light: 'theme.setLight', dark: 'theme.setDark', system: 'theme.setSystem' };

    var themeOptionBtns = $$('[data-theme-option]');
    var footerTheme = $('footerTheme');
    var themeColorMeta = document.querySelector('meta[name="theme-color"]');

    function systemTheme() {
      return (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }

    /* 인라인 스크립트가 첫 페인트 전에 심어둔 모드. 없으면 시스템 */
    function currentMode() {
      var mode = htmlEl.getAttribute('data-theme-mode');
      return THEME_MODES.indexOf(mode) !== -1 ? mode : 'system';
    }

    function applyTheme(mode, persist) {
      var theme = mode === 'system' ? systemTheme() : mode;
      var dict = currentDict();

      htmlEl.setAttribute('data-theme-mode', mode);
      htmlEl.setAttribute('data-theme', theme);

      /* 헤더와 모바일 메뉴의 버튼이 항상 같은 선택 상태를 보여줍니다 */
      themeOptionBtns.forEach(function (btn) {
        var option = btn.getAttribute('data-theme-option');
        var action = dict[THEME_ACTION_KEYS[option]];

        btn.setAttribute('aria-pressed', option === mode ? 'true' : 'false');
        btn.setAttribute('aria-label', action);
        btn.setAttribute('title', action);
      });

      if (footerTheme && THEME_LABEL_KEYS[mode]) footerTheme.textContent = dict[THEME_LABEL_KEYS[mode]];
      if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLORS[theme]);

      if (persist) writeStore(THEME_KEY, mode);
    }

    /* 버튼은 HTML에 있습니다(스크립트가 채우지 않음) — 스크립트가 멈춰도
       선택지는 화면에 보입니다. 순환식이 아니라 선택식이라, 시스템 모드에서
       색이 그대로인 순간에도 어느 모드를 골랐는지 눈에 보입니다. */
    themeOptionBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        applyTheme(btn.getAttribute('data-theme-option'), true);
      });
    });

    document.addEventListener('langchange', function () { applyTheme(currentMode()); });

    /* 인라인 스크립트가 정한 값을 UI에 반영 (저장은 하지 않음) */
    applyTheme(currentMode());

    /* '시스템' 모드일 때는 OS 설정이 바뀌면 바로 따라갑니다 */
    if (window.matchMedia) {
      var schemeQuery = window.matchMedia('(prefers-color-scheme: light)');
      var onSchemeChange = function () {
        if (currentMode() === 'system') applyTheme('system');
      };

      if (schemeQuery.addEventListener) schemeQuery.addEventListener('change', onSchemeChange);
      else if (schemeQuery.addListener) schemeQuery.addListener(onSchemeChange);
    }
  });

  /* ── 6. 강조색 프리셋 ──────────────────────────────────────────────── */
  guard('강조색', function () {
    var ACCENT_KEY = 'monsterlab.accent';
    var ACCENT_NAMES = ['mint', 'violet', 'ocean', 'amber'];
    var swatchBtns = $$('.swatch');

    function currentAccent() {
      var name = htmlEl.getAttribute('data-accent');
      return ACCENT_NAMES.indexOf(name) !== -1 ? name : 'mint';
    }

    function applyAccent(name, persist) {
      var dict = currentDict();

      htmlEl.setAttribute('data-accent', name);

      swatchBtns.forEach(function (btn) {
        var label = dict['accent.' + btn.getAttribute('data-accent')];
        var active = btn.getAttribute('data-accent') === name;

        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      if (persist) writeStore(ACCENT_KEY, name);
    }

    swatchBtns.forEach(function (btn) {
      on(btn, 'click', function () {
        applyAccent(btn.getAttribute('data-accent'), true);
      });
    });

    document.addEventListener('langchange', function () { applyAccent(currentAccent()); });

    /* 인라인 스크립트가 정한 프리셋을 UI에 반영 (저장은 하지 않음) */
    applyAccent(currentAccent());
  });

  /* ── 7. 모바일 메뉴 ────────────────────────────────────────────────── */
  guard('모바일 메뉴', function () {
    var menuBtn = $('menuBtn');
    var nav = $('nav');

    if (!menuBtn || !nav) return;

    function closeNav() {
      nav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    on(menuBtn, 'click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    on(nav, 'click', function (e) {
      if (e.target && e.target.tagName === 'A') closeNav();
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  });

  /* ── 8. 문의 폼 (Formspree) ────────────────────────────────────────
     폼 ID는 index.html의 <form action="https://formspree.io/f/폼ID"> 에 있습니다.
     이 블록이 하는 일은 “있으면 더 편한” 계층입니다 — 스크립트가 없거나 fetch를 쓸 수
     없는 브라우저에서는 그대로 POST 되어 Formspree 안내 페이지가 뜹니다. */
  guard('문의 폼', function () {
    var form = $('contactForm');
    /* 본문을 UTF-8 로 직접 만들려면 URLSearchParams 가 필요합니다(없으면 그대로 POST). */
    if (!form || typeof window.fetch !== 'function' ||
        typeof window.URLSearchParams !== 'function') return;

    /* action 에서 전송 주소를 읽습니다(없으면 가로채지 않고 그대로 POST). */
    var endpoint = (form.getAttribute('action') || '').trim();
    if (!endpoint) return;

    var emailEl = $('cfEmail');
    var msgEl = $('cfMsg');
    var msgLabelEl = $('cfMsgLabel');
    var hintEl = $('cfHint');
    var typeEl = $('cfType');
    var issueEl = $('cfIssue');
    var statusEl = $('formStatus');
    var submitBtn = $('cfSubmit');
    var sending = false;
    var statusKey = '';
    var statusIsError = false;

    /* Google reCAPTCHA v3 — index.html의 <form data-recaptcha-key="..."> 에 사이트 키를
       넣으면 켜집니다(Formspree 쪽에는 비밀 키를 넣고 reCAPTCHA를 켜두어야 합니다).
       비워 두면 Google 스크립트를 아예 불러오지 않아 외부 요청이 0입니다. */
    var recaptchaKey = (form.getAttribute('data-recaptcha-key') || '').trim();
    var recaptchaReady = false;
    var recaptchaLoading = false;
    var recaptchaQueue = [];

    /* reCAPTCHA 스크립트를 한 번만 불러오고, 그 동안 들어온 요청은 모아 처리합니다. */
    function ensureRecaptcha(callback) {
      if (recaptchaReady) return callback(true);

      recaptchaQueue.push(callback);
      if (recaptchaLoading) return;
      recaptchaLoading = true;

      var head = document.head || document.body;
      var script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(recaptchaKey);
      script.async = true;
      script.onload = function () { flush(true); };
      script.onerror = function () { flush(false); };
      head.appendChild(script);

      function flush(ok) {
        recaptchaReady = ok;

        var queue = recaptchaQueue;
        recaptchaQueue = [];
        queue.forEach(function (fn) { fn(ok); });
      }
    }

    /* 토큰을 못 받아도 전송은 그대로 시도합니다(Formspree가 최종 판단 —
       실패하면 기존 실패 안내가 뜨고 메일 보내기 버튼이 대안으로 남습니다). */
    function withRecaptchaToken(callback) {
      if (!recaptchaKey) return callback('');

      ensureRecaptcha(function (ok) {
        if (!ok || !window.grecaptcha) return callback('');

        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(recaptchaKey, { action: 'submit' }).then(
            function (token) { callback(token || ''); },
            function () { callback(''); }
          );
        });
      });
    }

    /* 문구 키를 기억해 두었다가 언어를 바꿔도 다시 그립니다. */
    function renderStatus() {
      if (!statusEl) return;

      var message = statusKey ? currentDict()[statusKey] : '';
      statusEl.textContent = message;
      statusEl.hidden = !message;
      statusEl.classList.toggle('is-error', !!(message && statusIsError));
    }

    function setStatus(key, isError) {
      statusKey = key || '';
      statusIsError = !!isError;
      renderStatus();
    }

    /* ── 문의 유형 ──────────────────────────────────────────────────────
       유형을 고르면 메일 제목이 'EngMon — <유형>' 으로 바뀌고, 한 줄짜리
       신청이 아닌 문의는 내용을 적지 않으면 보내지 못하게 합니다.
       (제목이 항상 EngMon 으로 시작해야 수신합에서 바로 알아봅니다.) */
    var TYPE_VALUES = ['subscribe', 'content', 'topic', 'study', 'partner', 'etc'];
    var DEFAULT_TYPE = 'subscribe';

    function currentType() {
      var value = typeEl ? String(typeEl.value || '') : '';
      return TYPE_VALUES.indexOf(value) === -1 ? DEFAULT_TYPE : value;
    }

    function typeLabel() {
      return currentDict()['form.type.' + currentType()] || '';
    }

    /* 내용이 있어야 하는 문의인가 — 새 주 신청만 내용을 비워 둘 수 있습니다. */
    function needsMessage() { return currentType() !== DEFAULT_TYPE; }

    function subjectFor() {
      var subject = 'EngMon — ' + typeLabel();

      if (issueEl && issueEl.value) {
        var option = issueEl.options && issueEl.options[issueEl.selectedIndex];
        var label = option && option.textContent ? option.textContent : issueEl.value;
        subject += ' · ' + label;
      }

      return subject;
    }

    /* 유형에 따라 세 가지가 함께 바뀝니다.
         1. "하고 싶은 말" 라벨이 (선택)인지 (필수)인지
         2. 입력란 예시 문구 (무엇을 적으면 되는지)
         3. 어떤 문의인지 미리 알려 주는 한 줄 안내 */
    function refreshTypeUI() {
      var type = currentType();

      if (msgLabelEl) {
        var key = needsMessage() ? 'form.messageRequired' : 'form.message';
        msgLabelEl.setAttribute('data-i18n', key);
        msgLabelEl.textContent = currentDict()[key] || '';
      }

      if (hintEl) {
        var hintKey = 'form.hint.' + type;
        hintEl.setAttribute('data-i18n', hintKey);
        hintEl.textContent = currentDict()[hintKey] || '';
      }

      if (msgEl) {
        var phKey = 'form.ph.' + type;
        var placeholder = currentDict()[phKey] || '';
        msgEl.setAttribute('data-i18n-placeholder', phKey);
        msgEl.setAttribute('placeholder', placeholder);
      }
    }

    on(typeEl, 'change', refreshTypeUI);
    refreshTypeUI();

    /* 전송 중에는 버튼을 잠가 중복 전송을 막습니다(Formspree는 분당 20건 제한). */
    function setSending(busy) {
      sending = busy;
      if (!submitBtn) return;

      submitBtn.disabled = busy;
      submitBtn.setAttribute('aria-busy', String(busy));
      submitBtn.textContent = currentDict()[busy ? 'form.sending' : 'form.send'];
    }

    /* 폼 값을 UTF-8 퍼센트 인코딩 문자열로 만듭니다.
       values 는 폼 입력값에 덧붙일 값(_subject·source·토큰)입니다.

       왜 FormData(multipart) 대신 직접 만드는가:
         multipart 는 값 자체는 UTF-8 로 나가지만 "이 본문은 UTF-8" 이라는 표시가
         본문에 없습니다. 그래서 수신 쪽이 다른 문자셋으로 해석하면 한글 문의가
         깨져 도착합니다(실제로 EUC-KR/CP949 로 해석된 깨진 메일을 받은 적이 있습니다).
         x-www-form-urlencoded 는 문자셋을 Content-Type 에 적을 수 있고,
         URLSearchParams 는 값을 항상 UTF-8 퍼센트 인코딩으로 만듭니다.
         CORS 안전 헤더라서 사전 요청(preflight)도 생기지 않습니다. */
    function utf8Body(values) {
      var data = new FormData(form);

      Object.keys(values).forEach(function (name) { data.set(name, values[name]); });

      var params = new URLSearchParams();
      data.forEach(function (value, name) {
        if (typeof value === 'string') params.append(name, value); /* 파일 필드는 없습니다 */
      });

      return params.toString();
    }

    document.addEventListener('langchange', function () {
      renderStatus();
      refreshTypeUI();
    });

    on(form, 'submit', function (e) {
      /* 브라우저 기본 검사(required · type=email)를 통과한 뒤에만 submit 이벤트가 옵니다. */
      e.preventDefault();
      if (sending || !emailEl || !msgEl) return;

      /* 신청이 아닌 문의는 내용이 있어야 합니다 — 빈 메일로 보내면 답장할 수 없습니다. */
      if (needsMessage() && !String(msgEl.value || '').trim()) {
        setStatus('form.needDetail', true);
        if (msgEl.focus) msgEl.focus();
        return;
      }

      /* x-www-form-urlencoded + charset=UTF-8 로 보냅니다 — 문자셋을 본문에 적어
         두어야 수신 쪽이 한글을 UTF-8 로 해석합니다(영어 확장 문자의 깨짐 방지).
         Accept: application/json 이라 페이지 이동 없이 결과를 받습니다.
         source 에 접속 도메인이 담겨, 같은 폼을 다른 사이트에서 써도 구분됩니다. */
      var extra = {
        'type': currentType(),
        '_subject': subjectFor(),
        'source': (window.location && window.location.hostname) || 'engmon.monster'
      };

      setStatus('');
      setSending(true);

      withRecaptchaToken(function (token) {
        if (token) extra['g-recaptcha-response'] = token;

        window.fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: utf8Body(extra)
        }).then(sent, failed);
      });

      function sent(res) {
        if (res.ok) return finishSent();

        /* 429 = 분당·월간 전송 한도 초과 (Formspree 문서 기준) */
        setSending(false);
        setStatus(res.status === 429 ? 'form.rateLimited' : 'form.sendFail', true);
      }

      function failed() {
        setSending(false);
        setStatus('form.sendFail', true);
      }

      function finishSent() {
        setSending(false);
        form.reset();
        refreshTypeUI();
        setStatus('form.sent');
        showToast(currentDict()['form.sent']);
      }
    });
  });

  /* ── 9. 헤더 그림자 · 맨 위로 · 현재 섹션 ────────────────────────── */
  guard('스크롤 반응', function () {
    var header = $('siteHeader');
    var toTop = $('toTop');
    var nav = $('nav');
    var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
    var sections = navLinks
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean)
      /* '홈'(#top)은 페이지 맨 위를 가리키므로 스크롤 위치와 무관합니다.
         강조 대상에 넣으면 항상 켜져서 다른 메뉴가 강조되지 않습니다. */
      .filter(function (section) { return section.id !== 'top'; });

    function syncActiveNav() {
      if (!sections.length) return;

      var pos = (window.scrollY || window.pageYOffset || 0) + 130;
      var current = null;

      sections.forEach(function (section) {
        if (section.offsetTop <= pos) current = section.id;
      });

      navLinks.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
      });
    }

    on(toTop, 'click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    function onScroll() {
      var y = window.scrollY || window.pageYOffset || 0;

      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.hidden = y < 600;
      syncActiveNav();
    }

    onScroll();
    on(window, 'scroll', onScroll, { passive: true });
  });

  /* ── 10. 푸터 연도 ─────────────────────────────────────────────────── */
  guard('푸터 연도', function () {
    var yearEl = $('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  });
})();
