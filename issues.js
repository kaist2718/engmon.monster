/* ==========================================================================
   EngMon — 1년 52주 플랜과 주(week)별 섹션 데이터
   ==========================================================================

   이 파일이 매거진의 "데이터베이스"입니다. magazine.js가 읽어 페이지를 그립니다.
   빌드 도구도 서버도 필요 없습니다.

   (JSON이 아니라 .js인 이유: file:// 로 index를 열어도 fetch가 막히지 않도록.
    데이터만 바꿀 때는 이 파일만 수정하면 됩니다.)

   ── 모델 ──────────────────────────────────────────────────────────────
   1년 52주 플랜입니다. 모든 주가 MAGAZINE_WEEKS 에 들어 있고,
   **sections 가 있는 주만 "발행된 주"** 입니다. 나머지는 계획(발행 전)입니다.

     MAGAZINE_WEEKS     52주 전체 (계획 + 발행된 주)
     MAGAZINE_QUARTERS  4분기 묶음 제목 (플랜 화면에서 씁니다)
     MAGAZINE_ISSUES    발행된 주만, week 순으로 (magazine.js가 씁니다)

   배열 순서는 상관없습니다 — magazine.js가 week 순으로 정렬해 씁니다.
   (내용이 긴 발행분을 파일 앞에 두었을 뿐입니다.)

   ── 주를 발행하려면 ──────────────────────────────────────────────────────
   그 주의 객체에 `published`(발행한 달)와 `sections`(아래 필드 조합)를 넣으면
   표지·목차·진행률·플랜 화면에 "발행됨"으로 바뀝니다. 넣기 전까지는
   플랜에 주제와 계획(plan)이 보이고 본문 대신 "아직 준비 중" 안내가 나갑니다.

   ── 발행 전인 주의 계획(plan) ────────────────────────────────────────────
   sections 가 없는 주는 plan 을 함께 적습니다. 로드맵과 "준비 중" 화면의
   계획 카드가 이 값으로 그려집니다(없는 항목은 그리지 않습니다).

     plan: {
       goals:  { ko: [ '목표1', '목표2', '목표3' ], en: [ ... ] },  // 3개 이상
       grammar:{ ko, en },   // 핵심 문법 — 로드맵에도 한 줄로 나옵니다
       words:  { ko, en },   // 핵심 어휘
       pron:   { ko, en },   // 발음 포인트
       output: { ko, en },   // 학습자가 직접 만들어 내는 과제
       parts:  { ko, en }    // 구성할 섹션 요약
     }

   발행되면 plan 은 그대로 두어도 되고(화면에 쓰이지 않음) 지워도 됩니다.

   ── 섹션에서 쓸 수 있는 필드 ───────────────────────────────────────────────
   id          필수. 앵커/진행률 저장에 쓰이는 고유 문자열 (영문/하이픈)
   kind        goals | vocabulary | phrasal | collocation | grammar |
               pronunciation | idioms | slang | natural | conversation |
               listening | reading | writing | discussion | culture | quiz |
               humor | note
                 goals = "이 주의 학습목표". 발행된 주는 맨 앞에 하나 둡니다.
   level       A2 | B1 | B2 | C1
   title       { ko, en }  섹션 제목
   intro       { ko, en }  한 줄 도입 (선택)
   body        { ko: [...문단], en: [...문단] }   영어가 본문, 한국어는 번역 블록
   reading     [영어 문단, ...]   독해 지문 (영어 전용)
   items       [ { en, ko, note, meaning, example } ]
               note = 한국어 팁 · meaning = 영영 뜻 · example = 예문
               각 항목에 발음 듣기 버튼과 "단어장에 저장" 버튼이 자동으로 붙습니다
   bullets     [ { ko, en } ]        저장 버튼 없는 목록
   table       { caption:{ko,en}, head:[{ko,en}], rows:[[...],[...]] }
   dialogue    [ { who, en, ko } ]   대화문 (화자별로 다른 목소리로 읽습니다)
   questions   [ { ko, en } ]        토론 질문
   dictation   [ { en, ko } ]        듣고 받아쓰기
   quiz        [ { q:{ko,en}, options:[...], answer:0, explain:{ko,en} } ]
   quote       { ko, en }            섹션 중간의 강조 인용

   오디오는 별도 파일이 필요 없습니다. body/reading/items/dialogue/questions의
   **영어 텍스트**를 문장 단위로 잘라 브라우저 음성합성(speechSynthesis)으로 읽습니다.
   화자 이름(Front desk, You)은 읽지 않고, 목소리와 음높이로만 구분합니다.

   ── 집필 규칙 ──────────────────────────────────────────────────────────────
   · 문자열은 작은따옴표로 감싸므로 값 안에 ' 를 쓰지 마세요. (축약형 대신 풀어서)
   · 값 안에  ':  처럼 따옴표+콜론 조합을 넣지 마세요. (사전 검사 스크립트가 오인합니다)
   · **굵게** 만 지원합니다 (magazine.js의 richText).
   ========================================================================== */

var MAGAZINE_WEEKS = [
  /* ══ 4주 — 시사·뉴스 영어 (발행) ═════════════════════════════════════════ */
  {
    week: 4,
    slug: 'week-04',
    quarter: 1,
    published: '2026-10',
    level: 'B2',
    theme: { ko: '시사·뉴스 영어', en: 'News and current affairs' },
    title: {
      ko: '영어 뉴스, 첫 문단부터 읽기',
      en: 'Reading English news from the first paragraph'
    },
    summary: {
      ko: '뉴스 문장은 짧고 정보가 빽빽합니다. 뉴스 어휘 16개, 구동사 10개, 연어 10개, 수치 표현 10개, 수동태와 헤드라인 문법, 발음 10개, 이디엄 10개, 인터뷰 표현, 회화 1장, 받아쓰기 10문장, 기사 독해와 모범 답안이 있는 요약 쓰기, 토론 질문 10개, 확인 문제 16개.',
      en: 'News sentences are short and dense. Sixteen news words, ten phrasal verbs, ten collocations, ten ways to read a chart, the passive and headline grammar, ten pronunciation points, ten idioms, interview language, one conversation, ten dictation lines, a full article with a model summary and a sixteen-question test.'
    },

    sections: [
      /* 0. 학습목표 */
      {
        id: 'news-goals',
        kind: 'goals',
        level: 'B2',
        title: { ko: '이 주의 학습목표', en: 'What you will be able to do this week' },
        intro: {
          ko: '이 주를 마치면 아래 네 가지를 영어로 할 수 있게 됩니다. 읽기 전에 한 번, 다 읽고 한 번 확인하세요.',
          en: 'By the end of this week you should be able to do the four things below. Check them once before you read and once after.'
        },
        bullets: [
          { en: 'Turn a clipped headline back into a full sentence and say who did what.', ko: '줄어든 헤드라인을 온전한 문장으로 되돌려 누가 무엇을 했는지 말합니다.' },
          { en: 'Use the sixteen news words and ten collocations without stopping to translate.', ko: '뉴스 어휘 16개와 연어 10개를 번역 없이 씁니다.' },
          { en: 'Find the conclusion in the first paragraph and separate fact from objection.', ko: '첫 문단에서 결론을 찾고 사실과 반대 의견을 구분합니다.' },
          { en: 'Summarise one article in three English sentences, with a figure in the middle.', ko: '숫자 하나를 넣어 기사 한 편을 영어 세 문장으로 요약합니다.' }
        ],
        quote: {
          ko: '뉴스는 모든 문장을 읽는 글이 아니라, 필요한 문장을 찾는 글입니다.',
          en: 'News is not read sentence by sentence. It is searched for the sentence you need.'
        }
      },

      /* 1. 뉴스 어휘 */
      {
        id: 'news-words',
        kind: 'vocabulary',
        level: 'B2',
        title: { ko: '뉴스 어휘 — 기사에서 매일 나오는 16단어', en: 'News words — sixteen that appear daily' },
        intro: {
          ko: '일상 회화에서는 잘 안 쓰지만, 뉴스에서는 하루에도 여러 번 나오는 단어들입니다.',
          en: 'You rarely say these in conversation, yet news stories use them several times a day.'
        },
        items: [
          { en: 'headline', ko: '헤드라인, 표제', meaning: 'the title of a news story', example: 'The headline was stronger than the story.', note: '동사로 쓰면 주요 뉴스로 다룬다는 뜻이 됩니다' },
          { en: 'breaking news', ko: '속보', meaning: 'a story that is still developing', example: 'We are following breaking news from the coast.', note: '확인되지 않은 내용이 섞일 수 있다는 신호입니다' },
          { en: 'source', ko: '출처, 취재원', meaning: 'the person or document behind a story', example: 'The reporter refused to name the source.', note: '출처를 밝히지 않으면 anonymous source라고 합니다' },
          { en: 'correspondent', ko: '특파원', meaning: 'a reporter based in another place', example: 'Our correspondent sent this report from Seoul.', note: '현지 상주 기자에게 주로 씁니다' },
          { en: 'editorial', ko: '사설', meaning: 'an article giving the paper opinion', example: 'The editorial called for a review.', note: '기사와 달리 매체의 의견입니다' },
          { en: 'exclusive', ko: '단독 보도', meaning: 'a story only one outlet has', example: 'The paper ran an exclusive on the deal.', note: '다른 곳에는 없는 내용이라는 뜻입니다' },
          { en: 'coverage', ko: '보도, 취재 범위', meaning: 'the reporting of an event', example: 'The coverage of the election was constant.', note: 'media coverage라고 하면 언론 보도를 통칭합니다' },
          { en: 'verify', ko: '사실 여부를 확인하다', meaning: 'to check that something is true', example: 'We could not verify the number.', note: '뉴스에서 가장 중요한 동사입니다' },
          { en: 'eyewitness', ko: '목격자', meaning: 'someone who saw the event', example: 'An eyewitness described the scene.', note: '법정 증인은 witness, 현장 목격자는 eyewitness입니다' },
          { en: 'retract', ko: '철회하다', meaning: 'to take a published claim back', example: 'The paper retracted the claim.', note: '짧은 정정은 correction, 완전 철회는 retraction입니다' },
          { en: 'leak', ko: '유출하다, 유출', meaning: 'to give secret material to a reporter', example: 'The draft was leaked to a blog.', note: '명사로도 쓰여 a leak입니다' },
          { en: 'brief', ko: '간단히 설명하다', meaning: 'to give someone the key points', example: 'Officials briefed reporters at noon.', note: '명사 a briefing은 설명회, in brief는 요약하면입니다' },
          { en: 'outlet', ko: '언론사', meaning: 'a news organisation', example: 'Several outlets ran the same story.', note: 'media outlet이 전체를 가리킵니다' },
          { en: 'poll', ko: '여론조사', meaning: 'a survey of opinions', example: 'The poll put support at forty percent.', note: '조사 결과는 poll results라고 합니다' },
          { en: 'statement', ko: '성명, 발표문', meaning: 'an official comment', example: 'The office released a short statement.', note: 'issue a statement와 짝을 이룹니다' },
          { en: 'update', ko: '최신 소식', meaning: 'the latest news on a developing story', example: 'Here is an update on the fire.', note: '속보 이후 이어지는 소식에 씁니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'news-phrasal',
        kind: 'phrasal',
        level: 'B2',
        title: { ko: '구동사 — 보도 문장을 짧게 만드는 10개', en: 'Phrasal verbs — ten that tighten a report' },
        items: [
          { en: 'put out', ko: '발표하다, 내놓다', meaning: 'to publish or release something', example: 'The office put out a short statement.', note: '발표문에는 put out a statement를 씁니다' },
          { en: 'break down', ko: '하나씩 풀어 설명하다', meaning: 'to explain something in parts', example: 'Let us break down the numbers.', note: '고장 나다는 뜻도 있으니 문맥을 보세요' },
          { en: 'follow up on', ko: '계속 취재하다', meaning: 'to keep reporting on something', example: 'We will follow up on that complaint.', note: 'follow up with 사람, follow up on 사건입니다' },
          { en: 'tone down', ko: '표현을 누그러뜨리다', meaning: 'to make something less strong', example: 'They toned down the headline.', note: '수정 보도에서 자주 쓰입니다' },
          { en: 'back up', ko: '근거로 뒷받침하다', meaning: 'to support with evidence', example: 'The claim was not backed up by data.', note: '수동태로도 자주 씁니다' },
          { en: 'call out', ko: '공개적으로 지적하다', meaning: 'to criticise openly', example: 'Several papers called out the decision.', note: '직접 인용보다 논평 기사에 많습니다' },
          { en: 'walk back', ko: '앞서 한 말을 물리다', meaning: 'to soften or withdraw a claim', example: 'The minister walked back the remark.', note: '사과까지는 아니고 표현의 세기를 낮추는 것입니다' },
          { en: 'push back on', ko: '~에 반발하다', meaning: 'to resist or oppose something', example: 'The union pushed back on the plan.', note: 'push back against도 같은 뜻입니다' },
          { en: 'lay out', ko: '조목조목 설명하다', meaning: 'to present the parts of a plan', example: 'The minister laid out the timetable.', note: 'lay out a plan은 계획을 차례로 보여 준다는 뜻입니다' },
          { en: 'set out', ko: '근거를 들어 설명하다', meaning: 'to explain the reasons for something', example: 'The report sets out the case for change.', note: 'set out to do는 ~하려고 결심하다는 별개 뜻입니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'news-collocation',
        kind: 'collocation',
        level: 'B2',
        title: { ko: '연어 — 기사에서 통째로 굳은 10쌍', en: 'Collocations — ten fixed pairs in news writing' },
        items: [
          { en: 'run a story', ko: '기사를 싣다', meaning: 'to publish an article', example: 'Three outlets ran the same story.', note: 'publish보다 가볍게 씁니다' },
          { en: 'break the news', ko: '소식을 처음 전하다', meaning: 'to tell someone news for the first time', example: 'The family was told before the news broke.', note: '나쁜 소식에도, 좋은 소식에도 씁니다' },
          { en: 'cite a source', ko: '출처를 밝히다', meaning: 'to name where information came from', example: 'The article cited two unnamed sources.', note: 'quote는 말을 그대로 옮기는 것입니다' },
          { en: 'take a stance', ko: '입장을 분명히 하다', meaning: 'to state a clear position', example: 'The paper took a stance on the bill.', note: '사설에서 자주 쓰입니다' },
          { en: 'stay on top of', ko: '계속 파악하고 있다', meaning: 'to keep following a situation', example: 'We are staying on top of the story.', note: '취재 상황을 설명할 때 씁니다' },
          { en: 'fact-check', ko: '사실 여부를 검증하다', meaning: 'to check the facts of a claim', example: 'The claim was fact-checked within an hour.', note: '동사와 명사로 모두 씁니다' },
          { en: 'issue a statement', ko: '성명을 발표하다', meaning: 'to release an official comment', example: 'The office issued a short statement.', note: 'put out a statement와 같은 뜻입니다' },
          { en: 'draw criticism', ko: '비판을 받다', meaning: 'to attract criticism', example: 'The plan drew criticism from drivers.', note: 'criticise보다 담백한 기사체입니다' },
          { en: 'spark a debate', ko: '논쟁을 촉발하다', meaning: 'to start a debate', example: 'The ruling sparked a debate online.', note: 'trigger a debate도 같은 뜻입니다' },
          { en: 'pick up steam', ko: '힘이 실리다', meaning: 'to gain strength or support', example: 'The campaign picked up steam this week.', note: '사건·운동이 확산될 때 씁니다' }
        ]
      },

      /* 4. 문법 */
      {
        id: 'news-grammar',
        kind: 'grammar',
        level: 'B2',
        title: { ko: '문법 — 수동태와 헤드라인의 생략', en: 'Grammar — the passive and the clipped headline' },
        intro: {
          ko: '뉴스가 어렵게 느껴지는 이유는 어려운 단어보다 이 두 가지 문법 습관 때문입니다.',
          en: 'News feels hard less because of vocabulary than because of these two habits.'
        },
        body: {
          en: [
            'The passive keeps the focus on what happened rather than who did it: **A new line was announced yesterday.** That is useful when the actor is unknown, obvious, or not the point.',
            'Headlines then drop whatever can be guessed. Auxiliary verbs, articles and the verb **be** disappear, so **City opens new library** stands for the full sentence below.',
            '**The trap for Korean readers** — a headline in the present tense is almost never about now. Read it as the past or the near future and an ordinary sentence appears. Fix the tense first, then fill in the words.'
          ],
          ko: [
            '수동태는 누가 했는지보다 **무엇이 일어났는지**에 초점을 둡니다. 행위자가 불분명하거나 뻔하거나 중요하지 않을 때 씁니다.',
            '헤드라인에서는 유추할 수 있는 것을 모두 생략합니다. 조동사, 관사, be동사가 사라져서 **City opens new library** 같은 형태가 됩니다.',
            '**한국어 화자가 자주 넘어지는 지점** — 헤드라인의 현재시제는 지금이 아니라 과거이거나 가까운 미래입니다. 그렇게 되돌려 놓으면 평범한 문장이 됩니다. 시제를 먼저 정하고, 그다음 단어를 채우세요.'
          ]
        },
        table: {
          caption: { ko: '헤드라인과 원래 문장', en: 'Headlines and the full sentence' },
          head: [{ ko: '헤드라인', en: 'Headline' }, { ko: '원래 문장', en: 'Full sentence' }],
          rows: [
            ['City opens new library', 'The city has opened a new library.'],
            ['Two hurt in tunnel fire', 'Two people were hurt in a tunnel fire.'],
            ['Talks to resume on Monday', 'The talks are going to resume on Monday.'],
            ['Minister denies report', 'The minister denies the report.']
          ]
        },
        items: [
          { en: 'A new line was announced yesterday.', ko: '어제 새 노선이 발표되었습니다.', note: '행위자가 문장에 없습니다 → 수동태', meaning: 'the actor is left out' },
          { en: 'Two people were hurt in a tunnel fire.', ko: '터널 화재로 두 명이 다쳤습니다.', note: '헤드라인이 Two hurt in tunnel fire로 줄어든 원문입니다', meaning: 'a passive sentence behind a headline' },
          { en: 'The talks are going to resume on Monday.', ko: '회담이 월요일에 재개될 예정입니다.', note: '미래는 to resume으로 압축됩니다', meaning: 'future expressed with to plus verb' },
          { en: 'Minister denies report', ko: '장관이 보도를 부인했습니다.', note: '현재시제는 헤드라인에서 과거를 대신합니다', meaning: 'present tense standing for the past' },
          { en: 'Firm to cut 200 jobs', ko: '회사가 200명을 감원할 예정입니다.', note: 'to부정사가 미래 계획을 대신합니다', meaning: 'to plus verb for a future plan' },
          { en: 'Talks collapse over pay', ko: '임금 문제로 협상이 결렬되었습니다.', note: 'over는 갈등의 원인을 붙입니다. about보다 기사체입니다', meaning: 'over introducing the cause of a conflict' }
        ],
        quote: {
          ko: '뉴스 문장은 짧은 이유가 있습니다. 조동사·관사·be동사부터 지우고 읽으세요.',
          en: 'News sentences are short on purpose. Start by reading past the missing auxiliaries and articles.'
        }
      },

      /* 5. 발음 */
      {
        id: 'news-pron',
        kind: 'pronunciation',
        level: 'B2',
        title: { ko: '발음 — 뉴스 원고가 빠르게 읽히는 이유', en: 'Pronunciation — why newsreaders sound so fast' },
        intro: {
          ko: '앵커가 빠른 것이 아니라, 정해진 자리가 뭉개질 뿐입니다. 그 자리만 알면 따라잡힙니다.',
          en: 'Anchors are not rushing. Fixed positions simply collapse. Learn those and you can keep up.'
        },
        items: [
          { en: 'The report has been released.', ko: '보고서가 공개되었습니다.', note: 'has been은 "해즈빈"처럼 한 덩어리로 붙습니다.' },
          { en: 'Officials would have known.', ko: '당국자들은 알고 있었을 것입니다.', note: 'would have는 "우러브"에 가깝게 줄어듭니다.' },
          { en: 'Housing and health', ko: '주거와 의료', note: 'and는 "언" 또는 "앤"으로 거의 들리지 않게 지나갑니다.' },
          { en: 'The rate rose by two percent.', ko: '금리가 2퍼센트 올랐습니다.', note: 'percent는 "퍼센"처럼 끝이 약해집니다. 숫자만 또렷합니다.' },
          { en: 'The minister says the plan will work.', ko: '장관은 계획이 통할 것이라고 말합니다.', note: 'says는 "세즈"가 아니라 "səz"로 약해집니다.' },
          { en: 'The talks will resume next week.', ko: '회담은 다음 주에 재개됩니다.', note: 'will은 거의 들리지 않고 "위르"처럼 앞 단어에 붙습니다.' },
          { en: 'Two thousand and twenty-six', ko: '2026년', note: '연도는 and를 빼고 "two thousand twenty-six"으로 읽는 쪽이 흔합니다.' },
          { en: 'A quarter of the total', ko: '전체의 4분의 1', note: 'of the는 "어브더"로 뭉쳐 한 단어처럼 지나갑니다.' },
          { en: 'The findings were published in a weekly report.', ko: '연구 결과는 주간 보고서에 실렸습니다.', note: 'published의 -ed는 아주 약하게 끝나서 거의 들리지 않습니다.' },
          { en: 'The figure stood at twelve percent.', ko: '수치는 12퍼센트에 머물렀습니다.', note: 'stood at는 평평하고 빠르게 지나가고 percent에만 강세가 갑니다.' }
        ],
        bullets: [
          { en: 'Numbers and names carry the stress; everything between them is reduced.', ko: '숫자와 이름에 강세가 실리고 그 사이는 모두 약해집니다.' },
          { en: 'Reported speech keeps a flat, steady rhythm on purpose.', ko: '인용 문장은 일부러 평평하고 일정한 리듬으로 읽습니다.' },
          { en: 'Function words are almost silent; keep your ear on the numbers and names.', ko: '기능어는 거의 들리지 않습니다. 귀를 숫자와 이름에 두세요.' }
        ]
      },

      /* 6. 이디엄 */
      {
        id: 'news-idioms',
        kind: 'idioms',
        level: 'B2',
        title: { ko: '이디엄 — 뉴스룸에서 쓰는 10개', en: 'Idioms — ten from the newsroom' },
        items: [
          { en: 'break a story', ko: '단독으로 처음 보도하다', meaning: 'to publish news before anyone else', example: 'The local paper broke the story.', note: 'break the news와 뜻이 다릅니다' },
          { en: 'hot off the press', ko: '갓 나온', meaning: 'very recently published', example: 'Here is the report, hot off the press.', note: '신문에서 시작한 표현입니다' },
          { en: 'get wind of', ko: '(소문을) 듣게 되다', meaning: 'to hear about something indirectly', example: 'Reporters got wind of the meeting.', note: '공식 발표가 아니라 흘러들어온 정보입니다' },
          { en: 'off the record', ko: '비공개로', meaning: 'not to be published', example: 'He spoke off the record.', note: 'on the record는 인용해도 된다는 뜻입니다' },
          { en: 'on the record', ko: '공개 발언으로', meaning: 'allowed to be published', example: 'Nothing was said on the record.', note: '인터뷰에서 반드시 확인해야 할 구분입니다' },
          { en: 'spin a story', ko: '유리하게 포장하다', meaning: 'to present events in a favourable way', example: 'Both sides spun the story their way.', note: 'spin은 명사로도 씁니다' },
          { en: 'bury the lede', ko: '핵심을 뒤로 미루다', meaning: 'to hide the main point low in a story', example: 'The report buried the lede in paragraph nine.', note: 'lede는 기사의 첫 문단을 뜻하는 기자 은어입니다' },
          { en: 'on background', ko: '배경 설명으로', meaning: 'usable but not attributed by name', example: 'The official spoke on background.', note: 'off the record와 달리 인용은 가능합니다' },
          { en: 'make headlines', ko: '헤드라인에 오르다', meaning: 'to get a lot of attention', example: 'The scandal made headlines for a week.', note: 'hit the headlines도 같은 뜻입니다' },
          { en: 'throw light on', ko: '사정을 밝히다', meaning: 'to make something clearer', example: 'The report throws light on the cause.', note: 'shed light on과 같은 뜻입니다' }
        ],
        quote: {
          ko: '뉴스 이디엄은 대부분 취재 과정에서 생겼습니다. 읽을 때 그 장면을 떠올리면 기억에 남습니다.',
          en: 'Most newsroom idioms come from the reporting process. Picture the scene and they stick.'
        }
      },
      /* 7. 자연스러운 표현 */
      {
        id: 'news-natural',
        kind: 'natural',
        level: 'B2',
        title: { ko: '자연스러운 표현 — 짧은 인터뷰', en: 'Natural English — a short interview' },
        intro: {
          ko: '기자도 인터뷰 대상도 같은 문장을 여러 번 되풀이합니다. 그 반복이 핵심입니다.',
          en: 'Reporters and officials repeat the same frames on purpose. The repetition is the lesson.'
        },
        dialogue: [
          { who: 'Reporter', en: 'Can you confirm when the works will begin?', ko: '공사가 언제 시작되는지 확인해 주시겠습니까?' },
          { who: 'Official', en: 'I can confirm that work starts in early March.', ko: '3월 초에 시작된다고 말씀드릴 수 있습니다.' },
          { who: 'Reporter', en: 'And is there a figure for the total cost?', ko: '총 비용에 대한 수치는 있습니까?' },
          { who: 'Official', en: 'We are not in a position to give a figure yet.', ko: '아직 수치를 말씀드릴 단계가 아닙니다.' },
          { who: 'Reporter', en: 'Is that because the review is still open?', ko: '검토가 진행 중이기 때문입니까?' },
          { who: 'Official', en: 'That is right. We will publish the review when it is complete.', ko: '맞습니다. 검토가 끝나면 공개하겠습니다.' }
        ],
        items: [
          { en: 'Can you confirm when the works will begin?', ko: '언제 시작되는지 확인해 주시겠습니까?', meaning: 'please state it clearly', example: 'Can you confirm the date?', note: '취재에서 가장 기본이 되는 요청입니다' },
          { en: 'I can confirm that work starts in early March.', ko: '3월 초에 시작된다고 말씀드릴 수 있습니다.', meaning: 'this part is official', example: 'I can confirm that the plan is approved.', note: '확인 가능한 범위를 밝히는 표현입니다' },
          { en: 'We are not in a position to give a figure yet.', ko: '아직 수치를 말씀드릴 단계가 아닙니다.', meaning: 'we cannot say it yet', example: 'We are not in a position to comment.', note: '공식 발언의 정형화된 거절입니다' },
          { en: 'Is that because the review is still open?', ko: '검토가 진행 중이기 때문입니까?', meaning: 'is that the reason', example: 'Is that because of the delay?', note: '이유를 되짚는 질문입니다' },
          { en: 'Can you confirm that on the record?', ko: '그것을 공개 발언으로 확인해 주시겠습니까?', meaning: 'please say clearly that it is true', example: 'Can you confirm that on the record?', note: '되묻는 가장 짧은 형태입니다' },
          { en: 'We have nothing to add at this stage.', ko: '지금은 덧붙일 말이 없습니다.', meaning: 'no further comment for now', example: 'We have nothing to add at this stage.', note: '인터뷰를 닫는 공식 표현입니다' }
        ],
        quote: {
          ko: '인터뷰는 새 정보를 얻는 자리가 아니라, 이미 아는 것을 확인받는 자리입니다.',
          en: 'An interview is less about learning something new than about getting what you know confirmed.'
        }
      },

      /* 8. 회화 */
      {
        id: 'news-talk1',
        kind: 'conversation',
        level: 'B2',
        title: { ko: '회화 — 뉴스 이야기하기', en: 'Conversation — talking about the news' },
        intro: {
          ko: '읽은 기사를 한 문장으로 옮기는 연습입니다. 어려운 단어는 다 빼도 됩니다.',
          en: 'Practise turning an article into one spoken sentence. Drop the hard words.'
        },
        dialogue: [
          { who: 'Colleague', en: 'Did you see the story about the night buses?', ko: '야간버스 기사 봤어?' },
          { who: 'You', en: 'I did. The city is running them free for six months.', ko: '봤어. 시에서 6개월간 무료로 운행한대.' },
          { who: 'Colleague', en: 'Where did you read that?', ko: '어디서 봤어?' },
          { who: 'You', en: 'It was in the local paper, quoting the transport office.', ko: '지역 신문에 났어. 교통국 발언을 인용했더라.' },
          { who: 'Colleague', en: 'I wonder whether it will make any difference.', ko: '효과가 있을지는 모르겠다.' },
          { who: 'You', en: 'That is the question. The trial is meant to answer it.', ko: '그게 핵심이지. 그걸 확인하려는 시험 운행이라더라.' }
        ],
        items: [
          { en: 'Did you see the story about the night buses?', ko: '야간버스 기사 봤어?', meaning: 'have you read that article', example: 'Did you see the story about the strike?', note: '뉴스를 꺼낼 때 가장 흔한 문장입니다' },
          { en: 'Where did you read that?', ko: '그거 어디서 봤어?', meaning: 'what was your source', example: 'Where did you read that figure?', note: '출처를 묻는 캐주얼한 표현입니다' },
          { en: 'The city is running them free for six months.', ko: '시에서 6개월간 무료로 운행합니다.', meaning: 'the service is free for now', example: 'They are running the service all night.', note: 'run a service는 운행하다는 뜻입니다' },
          { en: 'The trial is meant to answer it.', ko: '그걸 확인하려는 시험 운행입니다.', meaning: 'the purpose of the trial', example: 'The pilot is meant to test demand.', note: 'be meant to + 동사원형이 핵심입니다' },
          { en: 'I wonder whether it will make any difference.', ko: '차이가 있을지 모르겠어.', meaning: 'I am not sure it will help', example: 'I wonder whether the change will last.', note: 'wonder whether는 의문을 부드럽게 꺼냅니다' },
          { en: 'That is the question.', ko: '그게 핵심이지.', meaning: 'that is exactly the open point', example: 'That is the question everyone is asking.', note: '결론을 미룰 때 쓰는 짧은 문장입니다' }
        ]
      },

      /* 9. 듣기·받아쓰기 */
      {
        id: 'news-listening',
        kind: 'listening',
        level: 'B2',
        title: { ko: '듣기·받아쓰기 — 보도 문장 10개', en: 'Listening and dictation — ten report sentences' },
        intro: {
          ko: '숫자와 날짜가 들어간 문장입니다. 숫자를 놓치지 않는 것이 목표입니다.',
          en: 'These carry numbers and dates. The goal is not to lose the figures.'
        },
        dictation: [
          { en: 'The report was published on Tuesday morning.', ko: '보고서는 화요일 아침에 공개되었습니다.' },
          { en: 'Officials said the review would take about six weeks.', ko: '당국은 검토에 약 6주가 걸릴 것이라고 밝혔습니다.' },
          { en: 'The figure is up by four percent on last year.', ko: '수치는 작년보다 4퍼센트 올랐습니다.' },
          { en: 'A decision is expected before the end of the month.', ko: '결정은 이달 말 전에 나올 것으로 보입니다.' },
          { en: 'The company has not responded to our questions.', ko: '회사는 우리 질문에 답하지 않았습니다.' },
          { en: 'The trial will run for six months from March.', ko: '시험 운행은 3월부터 6개월간 이어집니다.' },
          { en: 'Officials declined to give a figure for the total cost.', ko: '당국은 총비용 수치를 밝히지 않았습니다.' },
          { en: 'A decision on the longer term is expected by December.', ko: '장기 계획에 대한 결정은 12월에 나올 예정입니다.' },
          { en: 'The new rules take effect at the start of April.', ko: '새 규정은 4월 초부터 효력이 생깁니다.' },
          { en: 'Support for the plan has fallen to thirty percent.', ko: '계획에 대한 지지는 30퍼센트로 떨어졌습니다.' }
        ],
        items: [
          { en: 'be up by four percent', ko: '4퍼센트 올랐다', meaning: 'to have risen by that amount', example: 'Sales are up by two percent.', note: 'up by는 증가폭, up to는 상한입니다' },
          { en: 'a decision is expected', ko: '결정이 예상된다', meaning: 'a decision will probably come', example: 'A decision is expected this week.', note: '수동태로 주체를 숨깁니다' },
          { en: 'has not responded to our questions', ko: '우리 질문에 답하지 않았다', meaning: 'the company stayed silent', example: 'The office has not responded yet.', note: '보도에서 자주 보이는 마무리 문장입니다' }
        ]
      },

      /* 10. 독해 */
      {
        id: 'news-reading',
        kind: 'reading',
        level: 'B2',
        title: { ko: '독해 — 기사 한 편', en: 'Reading — one article' },
        intro: {
          ko: '학습용으로 새로 쓴 가상 기사입니다. 첫 문단에서 결론을 찾는 연습을 해 보세요.',
          en: 'This is a practice article written for this issue. Try to find the conclusion in the first paragraph.'
        },
        reading: [
          'The city transport office announced on Tuesday that night buses on four routes will run free of charge for six months, starting in March.',
          'Officials said the trial is designed to test whether demand for late-night travel justifies the cost. A similar scheme in a neighbouring city was extended after a year, according to a review published in June.',
          'Not everyone is convinced. A local drivers group said the plan does not address the shortage of staff, which it described as the real barrier. The transport office has not responded to that criticism.',
          'A decision on the longer term is expected before the end of the year.'
        ],
        items: [
          { en: 'free of charge', ko: '무료로', meaning: 'without payment', example: 'The service will be free of charge.', note: 'free보다 격식 있는 표현입니다' },
          { en: 'is designed to test whether', ko: '~인지 확인하기 위해 만들어졌다', meaning: 'its purpose is to find out', example: 'The study is designed to test whether it works.', note: '목적을 밝히는 수동태입니다' },
          { en: 'not everyone is convinced', ko: '모두가 납득한 것은 아니다', meaning: 'some people disagree', example: 'Not everyone is convinced by the plan.', note: '반대 의견을 중립적으로 넣는 문장입니다' },
          { en: 'described as the real barrier', ko: '진짜 걸림돌이라고 표현된', meaning: 'called the main obstacle', example: 'Cost was described as the main problem.', note: 'describe A as B 구문의 수동형입니다' }
        ],
        bullets: [
          { en: 'Answer with a fact first — The article says that...', ko: '답은 사실로 시작하세요 — The article says that...' },
          { en: 'Answer with a source — According to the review,...', ko: '출처를 붙여 답하세요 — According to the review,...' },
          { en: 'Answer the objection — The drivers group argues that...', ko: '반대 의견은 동사로 옮기세요 — The drivers group argues that...' }
        ],
        questions: [
          { ko: '첫 문단에 들어 있는 사실 세 가지를 찾아보세요.', en: 'List three facts from the first paragraph.' },
          { ko: '반대하는 쪽의 주장은 무엇이고, 매체는 어떻게 다루었나요?', en: 'What is the objection, and how does the article handle it?' },
          { ko: '시험 운행 기간을 6개월로 잡은 근거는 무엇인가요?', en: 'What supports the choice of a six-month trial?' },
          { ko: '글쓴이가 직접 판단한 문장과 출처를 밝힌 문장을 구분해 보세요.', en: 'Separate the sentences that report facts from the ones that name a source.' },
          { ko: '이 기사에 영어 제목을 여섯 단어 이내로 붙인다면?', en: 'What English headline of six words or fewer would you give this article?' },
          { ko: '이 기사에서 확인되지 않은 채 남은 사실은 무엇인가요?', en: 'What does the article leave unconfirmed?' }
        ]
      },

      /* 11. 쓰기 */
      {
        id: 'news-writing',
        kind: 'writing',
        level: 'B2',
        title: { ko: '쓰기 — 기사 세 줄 요약', en: 'Writing — a three-line news summary' },
        intro: {
          ko: '먼저 스스로 세 줄을 써 보고, 그다음 아래 모범 답안과 비교하세요.',
          en: 'Write your three lines first, then compare them with the model answer below.'
        },
        body: {
          en: [
            '**Model answer** — Night buses on four routes will run free for six months from March, the city transport office said on Tuesday. The trial is designed to test whether late-night demand justifies the cost, and a similar scheme was extended last year. A drivers group has questioned the plan over staff shortages, and a decision on the longer term is expected by December.'
          ],
          ko: [
            '**모범 답안** — 시 교통국은 화요일, 3월부터 4개 노선의 야간버스가 6개월간 무료로 운행된다고 밝혔습니다. 이번 시험 운행은 심야 수요가 비용을 정당화하는지 확인하기 위한 것이며, 유사한 사업은 작년에 연장되었습니다. 운전기사 단체는 인력 부족을 이유로 계획에 의문을 제기했고, 장기 계획에 대한 결정은 12월에 나올 예정입니다.'
          ]
        },
        bullets: [
          { en: 'Line 1 — what happened, in the passive if the actor does not matter.', ko: '1줄 — 무슨 일이 있었는지. 행위자가 중요하지 않으면 수동태로.' },
          { en: 'Line 2 — the number, date or figure that anchors the story.', ko: '2줄 — 숫자·날짜·수치처럼 기사를 붙잡아 주는 정보.' },
          { en: 'Line 3 — who disagrees, and what happens next.', ko: '3줄 — 반대하는 쪽과 앞으로의 일정.' },
          { en: 'Check yourself — three sentences, one figure, one source, one objection.', ko: '스스로 점검 — 세 문장 · 숫자 하나 · 출처 하나 · 반대 의견 하나를 넣었으면 통과입니다.' }
        ],
        items: [
          { en: 'Night buses on four routes will run free for six months from March.', ko: '3월부터 4개 노선의 야간버스가 6개월간 무료로 운행됩니다.', note: '1줄 예시 — 결론을 앞에 둡니다' },
          { en: 'The trial follows a similar scheme that was extended last year.', ko: '이번 시험 운행은 작년에 연장된 유사 사업을 따릅니다.', note: '2줄 예시 — 배경과 근거를 붙입니다' },
          { en: 'Drivers have questioned the plan, and a decision is expected by December.', ko: '기사들은 계획에 의문을 제기했고, 결정은 12월까지 나올 예정입니다.', note: '3줄 예시 — 반대와 일정으로 닫습니다' }
        ],
        quote: {
          ko: '세 줄을 쓸 수 있으면 그 기사는 이해한 것입니다. 못 쓰면 한 문단을 다시 읽으세요.',
          en: 'If you can write three lines, you understood the article. If not, read the paragraph again.'
        }
      },

      /* 12. 토론 */
      {
        id: 'news-discussion',
        kind: 'discussion',
        level: 'B2',
        title: { ko: '토론 — 뉴스와 미디어에 대한 10가지 질문', en: 'Discussion — ten questions on news and media' },
        questions: [
          { ko: '영어 뉴스를 읽을 때 가장 먼저 막히는 부분은 어디인가요?', en: 'Where do you get stuck first when you read English news?' },
          { ko: '헤드라인만 보고 내용을 짐작한 적이 있나요?', en: 'Have you ever judged a story from the headline alone?' },
          { ko: '출처를 확인하는 습관이 있나요?', en: 'Do you check where a story came from?' },
          { ko: '같은 사건을 다르게 보도한 기사를 비교해 본 적이 있나요?', en: 'Have you compared two reports of the same event?' },
          { ko: '뉴스를 영어로 요약하는 습관을 들이려면 어떻게 해야 할까요?', en: 'How could you build a habit of summarising news in English?' },
          { ko: '짧은 영상 뉴스와 기사 중 어느 쪽이 학습에 더 도움이 되나요?', en: 'Which helps you learn more, short video news or written articles?' },
          { ko: '같은 기사를 두 번 읽는 것과 다른 기사를 두 편 읽는 것 중 어느 쪽이 낫나요?', en: 'Is it better to read one article twice or two different articles once?' },
          { ko: '영어 뉴스에 하루 몇 분까지 쓸 수 있나요? 현실적인 시간을 정해 보세요.', en: 'How many minutes a day can you realistically give to English news?' },
          { ko: '같은 사건을 두 매체가 다르게 다룬 사례를 알고 있나요?', en: 'Do you know a case where two outlets covered one event differently?' },
          { ko: '영어 뉴스에서 배운 표현을 실제로 써 본 적이 있나요?', en: 'Have you ever used a phrase you picked up from English news?' }
        ],
        bullets: [
          { en: 'To hedge — It seems to me that... / I would say that...', ko: '단정을 피할 때 — It seems to me that... / I would say that...' },
          { en: 'To disagree softly — I see it differently, because...', ko: '부드럽게 반대할 때 — I see it differently, because...' },
          { en: 'To add — On top of that... / What is more...', ko: '덧붙일 때 — On top of that... / What is more...' },
          { en: 'To close — So the real question is...', ko: '맺을 때 — So the real question is...' }
        ]
      },
      /* 13. 수치 표현 */
      {
        id: 'news-figures',
        kind: 'vocabulary',
        level: 'B2',
        title: { ko: '수치 표현 — 그래프를 문장으로 옮기는 10개', en: 'Figures — ten ways to put a chart into words' },
        intro: {
          ko: '뉴스의 절반은 숫자입니다. 방향과 폭을 구분해서 말할 수 있어야 합니다.',
          en: 'Half of the news is numbers. You need to separate direction from size.'
        },
        items: [
          { en: 'rise by three percent', ko: '3퍼센트 오르다', meaning: 'to increase by that amount', example: 'Prices rose by three percent.', note: 'by는 증가폭, to는 도달한 값입니다' },
          { en: 'fall to a record low', ko: '사상 최저로 떨어지다', meaning: 'to reach the lowest level ever', example: 'Demand fell to a record low.', note: 'a record high는 반대 상황입니다' },
          { en: 'remain flat', ko: '변동이 없다', meaning: 'to stay at the same level', example: 'Wages remained flat for a year.', note: 'unchanged보다 기사체입니다' },
          { en: 'more than double', ko: '두 배 이상이 되다', meaning: 'to become at least twice as much', example: 'The number more than doubled.', note: '동사로 쓰면 doubled입니다' },
          { en: 'account for', ko: '(비율을) 차지하다', meaning: 'to make up a share of a total', example: 'Housing accounts for a third of it.', note: '전체에서 차지하는 몫을 말합니다' },
          { en: 'on par with', ko: '~와 비슷한 수준인', meaning: 'at the same level as', example: 'Output is now on par with last year.', note: 'compare with는 비교한다는 뜻입니다' },
          { en: 'hit a record high', ko: '사상 최고치를 기록하다', meaning: 'to reach the highest level ever', example: 'Exports hit a record high in May.', note: 'hit은 기록에 도달했다는 뜻입니다' },
          { en: 'narrow the gap', ko: '격차를 좁히다', meaning: 'to reduce the difference', example: 'The gap narrowed to two points.', note: 'widen the gap은 반대 상황입니다' },
          { en: 'edge up', ko: '소폭 오르다', meaning: 'to rise a little', example: 'Prices edged up in March.', note: '큰 변동이 아니라 아주 작은 증가에 씁니다' },
          { en: 'level off', ko: '오르내림이 멈추다', meaning: 'to stop rising or falling', example: 'Inflation levelled off in the summer.', note: 'plateau와 비슷한 뜻입니다' }
        ]
      },

      /* 14. 확인 문제 */
      {
        id: 'news-quiz',
        kind: 'quiz',
        level: 'B2',
        title: { ko: '확인 문제 — 16문항', en: 'Quiz — sixteen questions' },
        quiz: [
          {
            q: { ko: '다음 헤드라인이 나타내는 원래 문장은? "Two hurt in tunnel fire"', en: 'Which full sentence is behind this headline? "Two hurt in tunnel fire"' },
            options: ['Two people were hurt in a tunnel fire.', 'Two people hurt a tunnel fire.', 'Two are hurting in a tunnel fire.', 'A tunnel fire was hurt by two people.'],
            answer: 0,
            explain: {
              ko: '헤드라인은 be동사를 생략하고 수동태로 줄인 형태입니다.',
              en: 'The headline drops the verb be and keeps the passive.'
            }
          },
          {
            q: { ko: '"출처를 밝히다"에 맞는 동사는?', en: 'Which verb goes with a source?' },
            options: ['say a source', 'cite a source', 'tell a source', 'talk a source'],
            answer: 1,
            explain: {
              ko: 'cite a source가 맞습니다. 이름을 밝히는 것은 name a source입니다.',
              en: 'You cite a source, and you name a source if you reveal who it is.'
            }
          },
          {
            q: { ko: '"4퍼센트 올랐다"로 알맞은 것은?', en: 'Which one means the figure increased by four percent?' },
            options: ['up to four percent', 'up by four percent', 'up for four percent', 'up of four percent'],
            answer: 1,
            explain: {
              ko: '증가폭은 up by입니다. up to는 최대치를 뜻합니다.',
              en: 'Up by gives the size of the increase. Up to gives a ceiling.'
            }
          },
          {
            q: { ko: '"아직 말할 단계가 아니다"에 가장 가까운 표현은?', en: 'Which is closest in meaning to saying nothing yet?' },
            options: ['We are not in a position to comment.', 'We have no comments at all.', 'We cannot comment never.', 'We are not commenting position.'],
            answer: 0,
            explain: {
              ko: '공식 발언에서 굳어진 표현이 We are not in a position to + 동사원형입니다.',
              en: 'The fixed official form is we are not in a position to plus a verb.'
            }
          },
          {
            q: { ko: '기사에서 반대 의견을 중립적으로 넣는 문장은?', en: 'Which sentence introduces disagreement neutrally?' },
            options: ['Everyone is convinced.', 'Not everyone is convinced.', 'Nobody is convinced nobody.', 'All are not convinced one.'],
            answer: 1,
            explain: {
              ko: 'Not everyone is convinced는 일부가 반대한다는 뜻을 담백하게 전합니다.',
              en: 'Not everyone is convinced reports the objection without taking sides.'
            }
          },
          {
            q: { ko: '"비공개로 말하다"를 뜻하는 표현은?', en: 'Which expression means the remarks cannot be published?' },
            options: ['on the record', 'off the record', 'hot off the press', 'get wind of'],
            answer: 1,
            explain: {
              ko: 'off the record가 비공개이고, on the record는 인용해도 됩니다.',
              en: 'Off the record cannot be published, and on the record can.'
            }
          },
          {
            q: { ko: '기자들이 첫 문단을 부르는 말은?', en: 'Which word do journalists use for the opening paragraph?' },
            options: ['the lede', 'the lid', 'the lead-in', 'the opener'],
            answer: 0,
            explain: {
              ko: '첫 문단은 lede입니다. bury the lede는 핵심을 뒤로 미루는 것입니다.',
              en: 'The opening paragraph is the lede. To bury the lede is to hide the main point lower down.'
            }
          },
          {
            q: { ko: '비밀 문서를 기자에게 넘기는 것을 뜻하는 동사는?', en: 'Which verb means passing a secret document to a reporter?' },
            options: ['leak', 'retract', 'verify', 'brief'],
            answer: 0,
            explain: {
              ko: 'leak은 유출하다입니다. retract은 보도를 철회하다, brief는 요점만 설명하다입니다.',
              en: 'You leak a document, retract a claim and brief a reporter on the main points.'
            }
          },
          {
            q: { ko: '장관이 앞서 한 발언의 세기를 낮추었습니다. 알맞은 표현은?', en: 'A minister softens an earlier remark. Which verb fits?' },
            options: ['pushed back on', 'walked back', 'drew criticism', 'issued'],
            answer: 1,
            explain: {
              ko: 'walk back은 앞서 한 말을 물리는 것입니다. push back on은 반발하다입니다.',
              en: 'Walk back means softening or withdrawing a claim. Push back on means resisting it.'
            }
          },
          {
            q: { ko: '수출이 역대 최고를 기록했습니다. 알맞은 표현은?', en: 'Exports reached their highest level ever. Which phrase fits?' },
            options: ['hit a record high', 'fell to a record low', 'remained flat', 'narrowed the gap'],
            answer: 0,
            explain: {
              ko: '최고치에는 record high, 최저치에는 record low를 씁니다.',
              en: 'A record high is the highest level; a record low is the lowest.'
            }
          },
          {
            q: { ko: '인용은 하되 이름은 밝히지 않는다는 표현은?', en: 'Which expression means usable but not attributed by name?' },
            options: ['on the record', 'off the record', 'on background', 'hot off the press'],
            answer: 2,
            explain: {
              ko: 'on background는 인용은 되지만 이름은 붙이지 않습니다. off the record는 아예 쓸 수 없습니다.',
              en: 'On background may be quoted without a name. Off the record may not be published at all.'
            }
          },
          {
            q: { ko: '헤드라인 Firm to cut 200 jobs의 뜻은?', en: 'What does the headline Firm to cut 200 jobs mean?' },
            options: ['The firm has cut 200 jobs.', 'The firm will cut 200 jobs.', 'The firm was cut by 200 jobs.', 'The firm is cutting jobs for 200.'],
            answer: 1,
            explain: {
              ko: '헤드라인의 to부정사는 앞으로의 계획을 나타냅니다.',
              en: 'A to infinitive in a headline points to a plan or a future event.'
            }
          },
          {
            q: { ko: '"소폭 오르다"에 알맞은 표현은?', en: 'Which phrase means to rise just a little?' },
            options: ['edge up', 'hit a record high', 'remain flat', 'narrow the gap'],
            answer: 0,
            explain: {
              ko: 'edge up이 아주 작은 증가입니다. remain flat은 변동이 없다는 뜻입니다.',
              en: 'Edge up is a small rise. Remain flat means no change at all.'
            }
          },
          {
            q: { ko: '"논쟁을 촉발하다"에 맞는 연어는?', en: 'Which collocation means to start a debate?' },
            options: ['spark a debate', 'draw a debate', 'run a debate', 'make a debate'],
            answer: 0,
            explain: {
              ko: 'spark a debate가 표준입니다. trigger a debate도 같은 뜻입니다.',
              en: 'You spark a debate. Trigger a debate means the same.'
            }
          },
          {
            q: { ko: '"여론조사"를 뜻하는 단어는?', en: 'Which word means a survey of opinions?' },
            options: ['poll', 'leak', 'brief', 'coverage'],
            answer: 0,
            explain: {
              ko: 'poll이 여론조사입니다. coverage는 보도를 뜻합니다.',
              en: 'A poll surveys opinions. Coverage is the reporting of an event.'
            }
          },
          {
            q: { ko: '주목을 받아 헤드라인에 오르다는 뜻은?', en: 'Which idiom means getting a lot of attention?' },
            options: ['make headlines', 'bury the lede', 'break down', 'tone down'],
            answer: 0,
            explain: {
              ko: 'make headlines가 주목을 받는다는 뜻입니다. bury the lede는 핵심을 뒤로 미루는 것입니다.',
              en: 'Make headlines means attracting attention. Bury the lede hides the main point.'
            }
          }
        ]
      },

      /* 15. 해설 노트 */
      {
        id: 'news-note',
        kind: 'note',
        level: 'B2',
        title: { ko: '해설 노트 — 뉴스 읽기의 함정', en: 'Notes — traps in reading the news' },
        bullets: [
          { en: '**Headlines are not sentences** — restore the auxiliary and the article before you translate.', ko: '**헤드라인은 문장이 아닙니다** — 해석하기 전에 조동사와 관사를 되살려 보세요.' },
          { en: '**Passive hides the actor** — ask who did it; that question is often the news.', ko: '**수동태는 행위자를 숨깁니다** — 누가 했는지가 곧 뉴스인 경우가 많습니다.' },
          { en: '**by and to are not the same** — by gives the change, to gives the level.', ko: '**by와 to는 다릅니다** — by는 변동폭, to는 도달한 값입니다.' },
          { en: '**attribute everything** — news always says who said it, and so should you.', ko: '**모든 문장에 출처가 붙습니다** — 누가 말했는지를 함께 읽어야 정확해집니다.' },
          { en: '**Read the last line too** — the strongest detail or the response often sits at the end.', ko: '**마지막 줄까지 읽으세요** — 반응이나 핵심 수치가 마지막에 오는 경우가 많습니다.' },
          { en: '**Do not translate every word** — skim with the numbers and names first.', ko: '**모든 단어를 옮기지 마세요** — 숫자와 이름만 먼저 훑고 내용을 잡으세요.' },
          { en: '**Note the verb, not the noun** — read the headline aloud and you will hear what is missing.', ko: '**명사보다 동사를 보세요** — 헤드라인을 소리 내어 읽으면 빠진 것이 들립니다.' },
          { en: '**Keep a source column** — write who said it next to every claim you copy into your notes.', ko: '**출처를 함께 적으세요** — 노트에 옮긴 문장마다 누가 말했는지 붙여 두세요.' },
          { en: '**A poll is not a fact** — it reports what people said on one day.', ko: '**여론조사는 사실이 아닙니다** — 특정 날에 사람들이 한 대답일 뿐입니다.' },
          { en: '**Hedging words protect the claim** — reportedly and allegedly tell you the evidence is thin.', ko: '**완곡어는 주장의 보호막입니다** — reportedly, allegedly는 근거가 얇다는 신호입니다.' },
          { en: '**Spark a debate, not make one** — news writing has its own verbs for starting things.', ko: '**논쟁은 spark a debate** — 사건의 시작에는 기사 특유의 동사를 씁니다.' },
          { en: '**Edge up, level off** — small movements have their own words.', ko: '**edge up · level off** — 작은 움직임에는 별도의 표현이 붙습니다.' }
        ]
      },
      /* 16. 문화 */
      {
        id: 'news-culture',
        kind: 'culture',
        level: 'B2',
        title: { ko: '문화 — 같은 사건, 다른 문장', en: 'Culture — same event, different sentence' },
        body: {
          en: [
            'English-language news separates **news** from **opinion** more strictly than many Korean readers expect. A reporter is not supposed to take a stance; the stance belongs on the editorial page.',
            'That is why the same event can read very differently in two outlets without either one lying. What changes is which fact goes first, which verb carries the sentence, and whose voice is quoted. Reading two reports of one event is the fastest way to see it.',
            '**Hedged language** is the other marker. Reporters write **reportedly**, **is said to** or **allegedly** when a fact is not confirmed, so that no sentence claims more than its evidence.'
          ],
          ko: [
            '영어권 뉴스는 **보도**와 **의견**을 우리가 기대하는 것보다 엄격하게 나놓습니다. 기자는 입장을 취하지 않고, 입장은 사설면에 둡니다.',
            '그래서 둘 다 거짓말하지 않아도 같은 사건이 전혀 다른 글로 읽힙니다. 어떤 사실을 앞에 두는지, 어떤 동사를 쓰는지, 누구 말을 인용하는지가 달라지기 때문입니다. 같은 사건의 두 기사를 비교해 읽는 것이 가장 빠른 방법입니다.',
            '**완곡한 표현**도 표지입니다. 기자들은 확인되지 않은 내용에 **reportedly**, **is said to**, **allegedly**를 붙여 문장이 근거보다 세지 않게 만듭니다. 우리말 뉴스보다 책임을 분산하는 장치가 많습니다.'
          ]
        },
        items: [
          { en: 'according to', ko: '~에 따르면', meaning: 'as stated by', example: 'According to the review, demand is rising.', note: '출처를 문장 안에 밝히는 기본 표현입니다' },
          { en: 'declined to comment', ko: '논평을 거부했다', meaning: 'refused to give a statement', example: 'The company declined to comment.', note: '보도에서 가장 자주 보이는 문장입니다' },
          { en: 'reportedly', ko: '보도에 따르면', meaning: 'according to reports', example: 'The plan is reportedly under review.', note: '확인되지 않은 내용에 붙입니다' },
          { en: 'a spokesperson said', ko: '대변인이 말했다', meaning: 'the official voice of an organisation', example: 'A spokesperson said the office was reviewing it.', note: '개인 이름 대신 직함으로 밝힐 때 씁니다' },
          { en: 'is said to be', ko: '~라고 전해진다', meaning: 'people say so, but it is not confirmed', example: 'The plan is said to be under review.', note: '주체를 숨기는 헤드라인 단골 표현입니다' },
          { en: 'allegedly', ko: '~라고 주장된', meaning: 'claimed but not proved', example: 'The files were allegedly copied.', note: '법적 분쟁을 다룰 때 특히 자주 보입니다' }
        ],
        quote: {
          ko: '같은 사건의 두 기사를 나란히 읽으면, 독해력보다 먼저 미디어 리터러시가 늘어납니다.',
          en: 'Read two reports side by side and your media literacy grows before your grammar does.'
        }
      },

      /* 17. 유머 */
      {
        id: 'news-humor',
        kind: 'humor',
        level: 'B1',
        title: { ko: '유머 — 편집자의 한마디', en: 'Humour — a line from the newsroom' },
        body: {
          en: [
            '**Editor:** "This headline is too long. Cut it in half."  **Reporter:** "Which half?"  **Editor:** "The one with the facts."',
            'The joke works because headline writing really does remove information on purpose. Understanding that habit makes real headlines easier, not harder, to read.'
          ],
          ko: [
            '**편집자:** "헤드라인이 너무 길어요. 반으로 줄이세요."  **기자:** "어느 쪽 반이요?"  **편집자:** "사실이 들어 있는 쪽이요."',
            '실제로 헤드라인은 정보를 일부러 덜어내며 만들어집니다. 그 규칙을 알면 진짜 헤드라인이 더 읽기 쉬워집니다.'
          ]
        },
        items: [
          { en: 'Cut it in half.', ko: '반으로 줄여라.', meaning: 'make it much shorter', example: 'Cut the paragraph in half.', note: 'cut은 삭제하라는 뜻으로도 씁니다' },
          { en: 'on purpose', ko: '일부러', meaning: 'deliberately', example: 'The words were left out on purpose.', note: 'by accident와 반대입니다' }
        ]
      },
    ]
  },

  /* ══ 3주 — 일상 회화 (발행) ═════════════════════════════════════════════ */
  {
    week: 3,
    slug: 'week-03',
    quarter: 1,
    published: '2026-09',
    level: 'B1',
    theme: { ko: '일상 회화', en: 'Everyday conversation' },
    title: {
      ko: '매일 쓰는 말투로 말하기',
      en: 'Speak like you actually do every day'
    },
    summary: {
      ko: '교과서 영어와 진짜 회화의 간격을 좁힙니다. 일상 어휘 16개, 구동사 10개, 연어 10개, 축약 발음 10개, 슬랭 10개, 이디엄 10개, 대화 3장, 받아쓰기 10문장, 독해 1편과 모범 표현, 모범 답안이 있는 작문 템플릿, 토론 질문 10개, 확인 문제 16개.',
      en: 'Closing the gap between textbook English and real conversation: sixteen everyday words, ten phrasal verbs, ten collocations, ten reductions, ten slang items, ten idioms, three dialogues, ten dictation lines, one reading passage with model expressions, a writing template with a model answer, ten discussion questions and sixteen quiz items.'
    },

    sections: [
      /* 0. 학습목표 */
      {
        id: 'daily-goals',
        kind: 'goals',
        level: 'B1',
        title: { ko: '이 주의 학습목표', en: 'What you will be able to do this week' },
        intro: {
          ko: '이 주를 마치면 아래 네 가지를 영어로 할 수 있게 됩니다. 읽기 전에 한 번, 다 읽고 한 번 확인하세요.',
          en: 'By the end of this week you should be able to do the four things below. Check them once before you read and once after.'
        },
        bullets: [
          { en: 'Keep a conversation going with someone you have not seen for a long time.', ko: '오랜만에 만난 사람과 대화를 끊기지 않게 이어 갑니다.' },
          { en: 'React with short, natural responses instead of silence or a nod.', ko: '침묵이나 고개 끄덕임 대신 짧고 자연스러운 반응을 붙입니다.' },
          { en: 'Recognise the most common everyday shortenings when you hear them.', ko: '일상에서 자주 들리는 줄임말을 귀로 알아듣습니다.' },
          { en: 'Turn what the other person said into your next question.', ko: '상대가 한 말을 받아 다음 질문으로 되돌립니다.' }
        ],
        quote: {
          ko: '회화는 문장을 외우는 일이 아니라 주고받는 리듬을 익히는 일입니다.',
          en: 'Conversation is not memorising sentences. It is learning the rhythm of taking turns.'
        }
      },

      /* 1. 일상 어휘 */
      {
        id: 'daily-words',
        kind: 'vocabulary',
        level: 'A2',
        title: { ko: '일상 어휘 — 하루에 한 번은 쓰는 16단어', en: 'Everyday words — sixteen you use daily' },
        intro: {
          ko: '뜻은 알아도 입에 안 붙는 단어들입니다. 소리 내어 세 번씩 읽어 보세요.',
          en: 'You know these, but they do not come out of your mouth yet. Say each one aloud three times.'
        },
        items: [
          { en: 'run errands', ko: '볼일을 보다', meaning: 'to do several small jobs outside the home', example: 'I have to run errands before lunch.', note: '장보기·은행·우체국처럼 자잘한 일을 한 번에 볼 때 씁니다' },
          { en: 'catch up', ko: '밀린 이야기를 나누다', meaning: 'to exchange recent news with someone', example: 'Let us catch up over coffee soon.', note: '사람과 사람 사이에 쓰면 근황을 나눈다는 뜻입니다' },
          { en: 'grab a bite', ko: '간단히 뭐 좀 먹다', meaning: 'to eat something quickly', example: 'Do you want to grab a bite after work?', note: 'sit down meal(제대로 된 식사)과 대비됩니다' },
          { en: 'head out', ko: '나가다, 출발하다', meaning: 'to leave a place', example: 'I am heading out in ten minutes.', note: 'leave보다 가볍고 자주 쓰입니다' },
          { en: 'whip up', ko: '(간단히) 뚝딱 만들다', meaning: 'to make something quickly', example: 'She whipped up dinner in twenty minutes.', note: '요리뿐 아니라 이메일·발표자료에도 씁니다' },
          { en: 'tidy up', ko: '정리정돈하다', meaning: 'to put things back in order', example: 'I tidy up every Sunday evening.', note: 'clean은 씻어내는 것, tidy는 정돈입니다' },
          { en: 'squeeze in', ko: '틈을 내어 넣다', meaning: 'to fit something into a tight schedule', example: 'Can we squeeze in a short call today?', note: '바쁜 일정에 억지로 끼워 넣는 느낌입니다' },
          { en: 'wind down', ko: '긴장을 풀다, 마무리하다', meaning: 'to relax after something busy', example: 'I wind down with a short walk.', note: '하루를 마감하며 쉬는 시간에 씁니다' },
          { en: 'pop in', ko: '잠깐 들르다', meaning: 'to visit briefly without planning', example: 'I will pop in on my way home.', note: '예고 없이 짧게 들르는 느낌입니다' },
          { en: 'sort out', ko: '정리하다, 해결하다', meaning: 'to organise or fix something', example: 'I need to sort out my train tickets.', note: '문제와 서류 모두에 씁니다' },
          { en: 'pick up', ko: '가져오다, 데리러 가다', meaning: 'to collect someone or something', example: 'Could you pick up some milk?', note: '사 오다·데리러 가다 두 뜻 모두 자주 씁니다' },
          { en: 'take your time', ko: '천천히 하세요', meaning: 'there is no need to hurry', example: 'Take your time, the train is late anyway.', note: '재촉하지 않는다는 배려의 표현입니다' },
          { en: 'sleep in', ko: '늦잠 자다', meaning: 'to sleep longer than usual', example: 'I slept in on Sunday morning.', note: 'sleep late보다 sleep in이 훨씬 흔합니다' },
          { en: 'keep me posted', ko: '계속 알려 줘', meaning: 'keep telling me the latest news', example: 'Keep me posted about the results.', note: '진행 상황을 계속 알려 달라는 표현입니다' },
          { en: 'out of town', ko: '여행 중, 출장 중', meaning: 'away from the city', example: 'She is out of town until Monday.', note: '타지에 나가 있는 상태입니다' },
          { en: 'on my way', ko: '가는 중', meaning: 'travelling there now', example: 'I am on my way, five minutes left.', note: '전화로 자주 쓰는 짧은 문장입니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'daily-phrasal',
        kind: 'phrasal',
        level: 'B1',
        title: { ko: '구동사 — 뜻이 통째로 달라지는 10개', en: 'Phrasal verbs — ten that change meaning completely' },
        intro: {
          ko: '동사만 알면 문장이 안 됩니다. 구동사는 덩어리로 외워야 합니다.',
          en: 'Knowing the verb alone is not enough. Learn these as single units.'
        },
        items: [
          { en: 'hang out', ko: '어울려 놀다', meaning: 'to spend relaxed time with someone', example: 'We hang out at the park on Saturdays.', note: '목적어가 사람이면 with를 씁니다' },
          { en: 'run into', ko: '우연히 만나다', meaning: 'to meet someone by chance', example: 'I ran into my old teacher at the market.', note: 'meet by chance를 한 단어로 대신합니다' },
          { en: 'turn up', ko: '나타나다', meaning: 'to arrive or appear', example: 'He turned up an hour late.', note: '예상치 못하게 등장할 때 자주 씁니다' },
          { en: 'put off', ko: '미루다', meaning: 'to delay something', example: 'Do not put off the dentist again.', note: 'postpone보다 회화에서 훨씬 흔합니다' },
          { en: 'figure out', ko: '알아내다, 이해하다', meaning: 'to understand or solve something', example: 'I finally figured out the app.', note: 'think out과 헷갈리지 마세요' },
          { en: 'come up with', ko: '생각해 내다', meaning: 'to think of an idea or plan', example: 'She came up with a great name.', note: '아이디어·해결책에 씁니다' },
          { en: 'get along with', ko: '~와 잘 지내다', meaning: 'to have a good relationship with someone', example: 'I get along with my new team.', note: '사람 사이에만 씁니다. 사물에는 쓸 수 없습니다' },
          { en: 'look after', ko: '돌보다', meaning: 'to take care of someone or something', example: 'Could you look after my cat?', note: 'take care of보다 회화적입니다' },
          { en: 'come over', ko: '놀러 오다', meaning: 'to visit someone home', example: 'Come over after work if you like.', note: '집으로 놀러 올 때 씁니다' },
          { en: 'get by', ko: '그럭저럭 지내다', meaning: 'to manage with difficulty', example: 'My English gets by in most situations.', note: '아슬아슬하지만 버틴다는 느낌입니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'daily-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 같이 다니는 단어 짝 10개', en: 'Collocations — ten word partnerships' },
        intro: {
          ko: '단어는 맞는데 조합이 어색하면 원어민이 바로 알아챕니다.',
          en: 'Right words, wrong partners, and a native speaker notices instantly.'
        },
        items: [
          { en: 'make a decision', ko: '결정을 내리다', meaning: 'to decide something', example: 'We need to make a decision by Friday.', note: 'do a decision은 틀립니다' },
          { en: 'take a break', ko: '쉬다', meaning: 'to stop for a short rest', example: 'Let us take a break for ten minutes.', note: 'have a break도 영국에서 씁니다' },
          { en: 'have a look', ko: '한번 보다', meaning: 'to look at something', example: 'Can I have a look at the menu?', note: 'look at보다 부드러운 요청입니다' },
          { en: 'keep in touch', ko: '연락하고 지내다', meaning: 'to stay in contact', example: 'Let us keep in touch after the course.', note: '헤어질 때 인사로도 씁니다' },
          { en: 'pay attention', ko: '주의를 기울이다', meaning: 'to focus on something', example: 'Pay attention to the last part.', note: 'to를 붙여 대상을 밝힙니다' },
          { en: 'make sense', ko: '말이 되다', meaning: 'to be logical or clear', example: 'That makes sense now.', note: 'Does that make sense? 는 설명 뒤 확인 표현입니다' },
          { en: 'have a chat', ko: '이야기를 나누다', meaning: 'to talk in a friendly way', example: 'Let us have a chat about it tomorrow.', note: 'talk보다 가볍고 짧은 대화입니다' },
          { en: 'run late', ko: '예정보다 늦어지다', meaning: 'to be behind schedule', example: 'Sorry, I am running late.', note: 'I am late는 내가 늦었다, run late는 진행이 밀린다는 느낌입니다' },
          { en: 'take a nap', ko: '낮잠을 자다', meaning: 'to sleep for a short time', example: 'I took a nap after lunch.', note: '낮잠은 nap, 밤잠은 sleep입니다' },
          { en: 'make plans', ko: '계획을 세우다', meaning: 'to arrange what to do', example: 'We made plans for the weekend.', note: '복수 plans로 자주 씁니다' }
        ]
      },

      /* 4. 문법 */
      {
        id: 'daily-grammar',
        kind: 'grammar',
        level: 'B1',
        title: { ko: '문법 — used to 세 가지를 구분하기', en: 'Grammar — three uses of used to' },
        intro: {
          ko: '한국어 화자가 가장 자주 섞는 세 형태입니다. 표로 한 번에 정리합니다.',
          en: 'These three forms get mixed up more than any others. The table sorts them out.'
        },
        body: {
          en: [
            '**used to + base verb** is about a past habit that is no longer true. It never appears in the present tense.',
            '**be used to + noun / -ing** means you are familiar with something. The **to** here is a preposition, so a noun or an -ing form follows.',
            '**get used to** is the process of becoming familiar. It is the one you need when you move somewhere new.',
            '**The error to watch** — used to cannot describe a habit you still have. For a habit that continues, use the present simple or usually: **I usually walk to work now.**'
          ],
          ko: [
            '**used to + 동사원형**은 지금은 더 이상 아닌 과거의 습관입니다. 현재시제로는 쓸 수 없습니다.',
            '**be used to + 명사/-ing**는 어떤 것에 익숙하다는 뜻입니다. 여기서 to는 전치사라서 명사나 -ing가 옵니다.',
            '**get used to**는 익숙해지는 과정입니다. 새 환경에 적응할 때 쓰는 표현입니다.',
            '**조심할 오류** — 아직 이어지는 습관에는 used to를 쓸 수 없습니다. 현재시제나 usually로 말합니다. 지금 걸어서 출근한다면 **I usually walk to work now.**입니다.'
          ]
        },
        table: {
          caption: { ko: '형태와 뜻 비교', en: 'Form and meaning' },
          head: [{ ko: '형태', en: 'Form' }, { ko: '뜻', en: 'Meaning' }, { ko: '예문', en: 'Example' }],
          rows: [
            ['used to + base verb', 'past habit, now finished', 'I used to walk to work.'],
            ['be used to + noun / -ing', 'be familiar with', 'I am used to the noise.'],
            ['get used to + noun / -ing', 'become familiar with', 'I am getting used to the heat.'],
            ['use + noun', 'to employ something', 'I use a bike now.']
          ]
        },
        items: [
          { en: 'I used to live in Busan.', ko: '예전에는 부산에 살았습니다.', note: '지금은 아니다 → used to', meaning: 'a past state that has ended' },
          { en: 'I am used to getting up early.', ko: '일찍 일어나는 것에 익숙합니다.', note: '익숙함 → be used to + -ing', meaning: 'accustomed to something' },
          { en: 'I am getting used to the new job.', ko: '새 일에 적응하는 중입니다.', note: '적응하는 과정 → get used to', meaning: 'becoming familiar' },
          { en: 'Did you use to cycle here?', ko: '예전에 여기서 자전거를 타곤 했나요?', note: '의문문은 did + use to (d가 사라집니다)', meaning: 'question form of used to' },
          { en: 'I did not use to drink coffee.', ko: '예전에는 커피를 마시지 않았습니다.', note: '부정문도 did not use to, 여기서도 d가 사라집니다', meaning: 'negative form of used to' },
          { en: 'I usually walk to work now.', ko: '지금은 보통 걸어서 출근합니다.', note: '지금도 이어지는 습관은 현재시제입니다', meaning: 'a habit that still continues' }
        ],
        quote: {
          ko: '과거의 습관은 used to, 익숙함은 be used to. 전치사 to 앞에는 명사나 -ing가 옵니다.',
          en: 'Past habit takes used to. Familiarity takes be used to, and its to is a preposition.'
        }
      },

      /* 5. 발음 */
      {
        id: 'daily-pron',
        kind: 'pronunciation',
        level: 'B1',
        title: { ko: '발음 — 빠르게 말할 때 줄어드는 소리', en: 'Pronunciation — what disappears in fast speech' },
        intro: {
          ko: '들은 대로 적으면 틀리고, 적힌 대로 들으면 안 들립니다. 줄어드는 규칙 열 가지를 익히세요.',
          en: 'Write what you hear and you are wrong. Expect what is written and you hear nothing. Learn ten reductions.'
        },
        items: [
          { en: 'What do you want?', ko: '뭐 원해요?', note: '실제로는 "와러유 원트"처럼 들립니다. do you가 붙어 /dʒə/가 됩니다.' },
          { en: 'I am going to call you.', ko: '전화할게요.', note: 'going to는 "고나"에 가깝게 줄어듭니다.' },
          { en: 'Let me see.', ko: '어디 보자.', note: 'Let me는 "레미"처럼 붙습니다.' },
          { en: 'Give me a second.', ko: '잠깐만요.', note: 'Give me는 "김미"가 됩니다.' },
          { en: 'Do you know him?', ko: '그 사람 알아요?', note: 'Do you는 "듀" 또는 "주"로 줄어듭니다.' },
          { en: 'Let us grab lunch.', ko: '점심 먹으러 가자.', note: 'Let us는 "레츠", grab lunch는 "그랩런치"로 붙습니다.' },
          { en: 'I have to go.', ko: '가 봐야 해.', note: 'have to는 "해프터"처럼 f 소리로 이어집니다.' },
          { en: 'See you later.', ko: '나중에 봐.', note: 'See you는 "시유"로 붙고 later는 가볍게 지나갑니다.' },
          { en: 'What are you up to?', ko: '뭐 해?', note: 'are you가 "아유"로 줄어들어 Whatarya up to처럼 들립니다.' },
          { en: 'I want to go.', ko: '가고 싶어.', note: 'want to는 "원터"로 짧아집니다. going to의 "고나"와 같은 축약입니다.' }
        ],
        bullets: [
          { en: 'Function words shrink. Content words stay clear.', ko: '기능어(do, you, to, me)는 줄고, 내용어(want, call, second)는 또렷하게 남습니다.' },
          { en: 'Stress the last content word in the sentence.', ko: '문장에서 마지막 내용어에 강세를 두면 훨씬 자연스럽게 들립니다.' },
          { en: 'If it all sounds like noise, catch just the stressed word first.', ko: '전부 소음처럼 들리면 강세가 실린 단어 하나만 먼저 잡아 보세요.' }
        ]
      },

      /* 6. 슬랭 */
      {
        id: 'daily-slang',
        kind: 'slang',
        level: 'B1',
        title: { ko: '슬랭 — 알아두면 편한 10가지', en: 'Slang — ten you should recognise' },
        intro: {
          ko: '먼저 알아듣는 것이 목표입니다. 격식 있는 자리에서는 쓰지 않는 편이 안전합니다.',
          en: 'Recognition comes first. In formal settings it is safer not to use these yourself.'
        },
        items: [
          { en: 'No worries.', ko: '괜찮아요.', meaning: 'that is fine, do not apologise', example: 'No worries, it happens.', note: '영국·호주에서 특히 자주 들립니다' },
          { en: 'My bad.', ko: '내 잘못이야.', meaning: 'I made a mistake', example: 'My bad, I sent the old file.', note: '가벼운 사과로만 씁니다' },
          { en: 'Fair enough.', ko: '그럴 만하네요.', meaning: 'that is reasonable', example: 'Fair enough, we can wait.', note: '상대 주장을 인정할 때 씁니다' },
          { en: 'Got it.', ko: '알겠어요.', meaning: 'I understand', example: 'Got it, I will send it tonight.', note: '이해했다는 가장 짧은 확인입니다' },
          { en: 'I am down.', ko: '나도 할래.', meaning: 'I want to join', example: 'A movie tonight? I am down.', note: '제안에 동의하는 캐주얼한 표현입니다' },
          { en: 'No big deal.', ko: '별거 아니에요.', meaning: 'it is not important', example: 'No big deal, we can redo it.', note: '감사의 말에 대한 답으로도 씁니다' },
          { en: 'Sounds good.', ko: '좋아요.', meaning: 'I agree with that plan', example: 'Seven works for me. Sounds good.', note: '제안을 짧게 수락하는 표현입니다' },
          { en: 'You bet.', ko: '그럼요.', meaning: 'certainly, of course', example: 'Can you help me move? You bet.', note: '친근한 확답입니다. 격식 있는 자리에는 피하세요' },
          { en: 'Kind of.', ko: '어느 정도는.', meaning: 'sort of, not exactly', example: 'Do you like it? Kind of.', note: 'kinda로 줄여 발음합니다. 격식 있는 자리에는 피합니다' },
          { en: 'Same here.', ko: '나도 그래.', meaning: 'I feel the same way', example: 'I am exhausted. Same here.', note: '동의를 짧게 전하는 표현입니다' }
        ]
      },

      /* 7. 이디엄 */
      {
        id: 'daily-idioms',
        kind: 'idioms',
        level: 'B1',
        title: { ko: '이디엄 — 일상에서 자주 나오는 10개', en: 'Idioms — ten that come up all the time' },
        intro: {
          ko: '직역하면 이상하지만, 들리는 빈도는 아주 높습니다.',
          en: 'They make no sense word for word, and you hear them constantly.'
        },
        items: [
          { en: 'a piece of cake', ko: '아주 쉬운 일', meaning: 'something very easy', example: 'The test was a piece of cake.', note: '쉬운 일을 음식에 비유합니다' },
          { en: 'under the weather', ko: '몸이 안 좋은', meaning: 'slightly ill', example: 'I am a bit under the weather today.', note: '심하게 아플 때는 쓰지 않습니다' },
          { en: 'hit the sack', ko: '자러 가다', meaning: 'to go to bed', example: 'I am exhausted, time to hit the sack.', note: 'hit the hay도 같은 뜻입니다' },
          { en: 'call it a day', ko: '오늘은 이만 끝내다', meaning: 'to stop working for today', example: 'It is late, let us call it a day.', note: '일을 마무리할 때 씁니다' },
          { en: 'in the same boat', ko: '같은 처지인', meaning: 'in the same difficult situation', example: 'We are all in the same boat here.', note: '공감하거나 위로할 때 좋습니다' },
          { en: 'out of the blue', ko: '갑자기, 난데없이', meaning: 'unexpectedly', example: 'She called me out of the blue.', note: '예상 못 한 일에 씁니다' },
          { en: 'hang in there', ko: '버텨 봐', meaning: 'keep going through a hard time', example: 'Hang in there, the term ends soon.', note: '위로할 때 쓰는 격려입니다' },
          { en: 'the last straw', ko: '더는 못 버티게 만든 결정적 계기', meaning: 'the final problem that ends your patience', example: 'The cancelled train was the last straw.', note: '원래는 낙타 등에 지는 마지막 짚이라는 뜻입니다' },
          { en: 'bite the bullet', ko: '마음먹고 참다', meaning: 'to accept something hard and do it', example: 'I bit the bullet and went to the dentist.', note: '힘든 일을 미루지 않고 감수한다는 뜻입니다' },
          { en: 'on the ball', ko: '기민한, 정신이 맑은', meaning: 'alert and quick to notice', example: 'The new assistant is really on the ball.', note: '꼼꼼한 사람을 칭찬할 때 씁니다' }
        ]
      },

      /* 8. 자연스러운 표현 */
      {
        id: 'daily-natural',
        kind: 'natural',
        level: 'A2',
        title: { ko: '자연스러운 표현 — 약속 잡기 전화', en: 'Natural English — arranging a meet-up' },
        intro: {
          ko: '시간을 묻고 확정하는 흐름입니다. 마지막 줄처럼 되짚어 확인하는 습관이 중요합니다.',
          en: 'The standard flow of asking, offering and confirming. Note how the last line repeats everything back.'
        },
        dialogue: [
          { who: 'Maya', en: 'Are you free this Friday evening?', ko: '이번 금요일 저녁에 시간 있어?' },
          { who: 'You', en: 'I should be. What did you have in mind?', ko: '아마 괜찮을 거야. 뭐 생각해 둔 게 있어?' },
          { who: 'Maya', en: 'A few of us are grabbing dinner around seven.', ko: '우리 몇 명이 7시쯤 저녁 먹으려고.' },
          { who: 'You', en: 'That works. Where are you thinking?', ko: '좋아. 어디 생각하고 있어?' },
          { who: 'Maya', en: 'That place near the station. I will text you the address.', ko: '역 근처 그 집. 주소는 문자로 보낼게.' },
          { who: 'You', en: 'Perfect. So Friday at seven, near the station. See you then.', ko: '좋아. 그럼 금요일 7시, 역 근처에서. 그때 봐.' }
        ],
        items: [
          { en: 'Are you free this Friday?', ko: '이번 금요일에 시간 있어?', meaning: 'do you have time available', example: 'Are you free for a quick call?', note: 'Do you have time보다 자연스럽습니다' },
          { en: 'What did you have in mind?', ko: '어떻게 생각하고 있어?', meaning: 'what are you planning', example: 'What did you have in mind for the budget?', note: '상대의 계획을 부드럽게 묻는 표현입니다' },
          { en: 'That works.', ko: '좋아, 그렇게 하자.', meaning: 'that is fine with me', example: 'Monday at ten? That works.', note: '확정 표현입니다' },
          { en: 'I will text you the address.', ko: '주소는 문자로 보낼게.', meaning: 'I will send it by message', example: 'I will text you the details.', note: 'will은 즉석 결정에 씁니다' },
          { en: 'That works for me.', ko: '나는 괜찮아.', meaning: 'that suits my schedule', example: 'Tuesday at six works for me.', note: 'That works보다 상대를 의식한 표현입니다' },
          { en: 'Let us say seven, then.', ko: '그럼 7시로 하자.', meaning: 'we agree on that time', example: 'Let us say Friday at noon.', note: '시간을 확정할 때 쓰는 관용 표현입니다' }
        ],
        quote: {
          ko: '약속은 마지막에 요일·시간·장소를 한 번 되짚으면 착오가 사라집니다.',
          en: 'Repeat the day, time and place once at the end, and nothing gets lost.'
        }
      },

      /* 9. 회화 1 */
      {
        id: 'daily-talk1',
        kind: 'conversation',
        level: 'B1',
        title: { ko: '회화 1 — 오랜만에 만난 친구', en: 'Conversation 1 — meeting an old friend' },
        intro: {
          ko: 'How are you 대신 실제로 쓰는 근황 질문들입니다.',
          en: 'What people really say instead of the flat how are you.'
        },
        dialogue: [
          { who: 'Sam', en: 'Hey, long time no see. How have you been?', ko: '야, 오랜만이야. 어떻게 지냈어?' },
          { who: 'You', en: 'Busy, but good. I changed jobs in March.', ko: '바빴지만 잘 지냈어. 3월에 이직했어.' },
          { who: 'Sam', en: 'No way. Where are you working now?', ko: '진짜? 지금 어디 다녀?' },
          { who: 'You', en: 'A small studio near the river. What about you?', ko: '강 근처 작은 스튜디오. 너는?' },
          { who: 'Sam', en: 'Same place, same desk. Nothing exciting.', ko: '같은 곳, 같은 자리. 별일 없지.' },
          { who: 'You', en: 'Still, it is good to see you. Let us not wait this long again.', ko: '그래도 만나서 반가워. 이렇게 오래 못 보면 안 되겠다.' }
        ],
        items: [
          { en: 'Long time no see.', ko: '오랜만이야.', meaning: 'it has been a long time', example: 'Long time no see, how are things?', note: '문법적으로는 비문이지만 표준 인사입니다' },
          { en: 'How have you been?', ko: '그동안 어떻게 지냈어요?', meaning: 'how have you been doing', example: 'How have you been since graduation?', note: 'How are you보다 오랜만일 때 씁니다' },
          { en: 'No way.', ko: '말도 안 돼.', meaning: 'I cannot believe it', example: 'No way, you moved to Seoul?', note: '놀람과 부정 두 뜻이 있습니다' },
          { en: 'What about you?', ko: '너는 어때?', meaning: 'and you', example: 'I am fine. What about you?', note: '질문을 되돌려 줄 때 씁니다' },
          { en: 'Nothing exciting.', ko: '별일 없어.', meaning: 'nothing special happened', example: 'Nothing exciting, just work.', note: '근황을 겸손하게 줄이는 표현입니다' },
          { en: 'It is good to see you.', ko: '만나서 반가워.', meaning: 'I am glad we met', example: 'It is good to see you again.', note: '오랜만에 만난 자리의 마무리 인사입니다' }
        ]
      },

      /* 10. 회화 2 */
      {
        id: 'daily-talk2',
        kind: 'conversation',
        level: 'A2',
        title: { ko: '회화 2 — 카페에서 주문하기', en: 'Conversation 2 — ordering at a cafe' },
        intro: {
          ko: '짧은 대화지만 실수하기 쉬운 지점이 모여 있습니다.',
          en: 'Short lines, but this is where small mistakes show up most.'
        },
        dialogue: [
          { who: 'Barista', en: 'Hi there. What can I get for you?', ko: '안녕하세요. 뭐 드릴까요?' },
          { who: 'You', en: 'Could I get a flat white, please? Medium.', ko: '플랫화이트 하나 주시겠어요? 미디엄으로요.' },
          { who: 'Barista', en: 'Sure. For here or to go?', ko: '네. 드시고 가시나요, 포장인가요?' },
          { who: 'You', en: 'For here, please. And could you make it decaf?', ko: '여기서 마실게요. 디카페인으로 해 주실 수 있나요?' },
          { who: 'Barista', en: 'No problem. Anything else?', ko: '물론이죠. 더 필요하세요?' },
          { who: 'You', en: 'That is all, thanks. Card, please.', ko: '그게 전부예요, 감사합니다. 카드로 할게요.' }
        ],
        items: [
          { en: 'Could I get a flat white?', ko: '플랫화이트 하나 주시겠어요?', meaning: 'polite way to order', example: 'Could I get a large one, please?', note: 'I want보다 훨씬 정중합니다' },
          { en: 'For here or to go?', ko: '드시고 가시나요, 포장인가요?', meaning: 'eat in or take away', example: 'Two coffees to go, please.', note: '영국에서는 takeaway라고도 합니다' },
          { en: 'Could you make it decaf?', ko: '디카페인으로 해 주실 수 있나요?', meaning: 'change the option, please', example: 'Could you make it oat milk?', note: 'make it + 형용사/명사가 핵심입니다' },
          { en: 'That is all, thanks.', ko: '그게 전부예요, 감사합니다.', meaning: 'nothing more, thank you', example: 'That is all for now, thanks.', note: '주문을 마무리하는 표현입니다' },
          { en: 'Hi there.', ko: '안녕하세요.', meaning: 'a friendly greeting', example: 'Hi there, is this seat free?', note: '점원이 손님에게 자주 건네는 인사입니다' },
          { en: 'No problem.', ko: '그럼요, 괜찮아요.', meaning: 'that is fine, of course', example: 'No problem, I will bring it over.', note: '부탁을 수락할 때도, 사과에 답할 때도 씁니다' }
        ]
      },

      /* 11. 듣기·받아쓰기 */
      {
        id: 'daily-listening',
        kind: 'listening',
        level: 'B1',
        title: { ko: '듣기·받아쓰기 — 들은 문장을 그대로 적기', en: 'Listening and dictation — write exactly what you hear' },
        intro: {
          ko: '재생 버튼을 누르고, 들리는 문장을 그대로 입력하세요. 틀린 단어는 빨갛게 표시됩니다.',
          en: 'Press play, type the sentence you hear, and check. Missed words come up in red.'
        },
        dictation: [
          { en: 'I am running a bit late, so start without me.', ko: '나 조금 늦어서 먼저 시작해.' },
          { en: 'Could you let me know before Friday?', ko: '금요일 전에 알려 줄 수 있어요?' },
          { en: 'That sounds great, but I have to check my schedule.', ko: '좋은데, 일정을 확인해 봐야 해.' },
          { en: 'I will bring the drinks if you bring the snacks.', ko: '내가 음료 가져갈 테니 너는 간식을 가져와.' },
          { en: 'Sorry, I am running a bit behind today.', ko: '미안, 오늘 조금 늦어지고 있어.' },
          { en: 'Do you want to grab a coffee after this?', ko: '이거 끝나고 커피 마시러 갈래?' },
          { en: 'I will let you know as soon as I hear back.', ko: '답을 듣는 대로 알려 줄게.' },
          { en: 'It was good to see you, let us do this again.', ko: '만나서 반가웠어, 다음에 또 하자.' },
          { en: 'Can we reschedule for some time next week?', ko: '다음 주로 다시 잡을 수 있을까요?' },
          { en: 'It slipped my mind, sorry about that.', ko: '깜빡했습니다, 미안해요.' }
        ],
        items: [
          { en: 'start without me', ko: '나 없이 시작해', meaning: 'begin and do not wait for me', example: 'Go ahead and start without me.', note: '늦을 때 쓰는 가장 짧은 문장입니다' },
          { en: 'let me know', ko: '알려 줘', meaning: 'inform me', example: 'Let me know how it goes.', note: 'tell me보다 부드럽습니다' },
          { en: 'check my schedule', ko: '일정을 확인하다', meaning: 'look at what I have planned', example: 'I will check my schedule and reply.', note: '거절을 늦추는 완곡한 표현으로도 씁니다' }
        ]
      },

      /* 12. 독해 */
      {
        id: 'daily-reading',
        kind: 'reading',
        level: 'B1',
        title: { ko: '독해 — 작은 습관 하나', en: 'Reading — one small habit' },
        intro: {
          ko: '한 단락씩 천천히 읽고, 아래 질문에 답해 보세요.',
          en: 'Read a paragraph at a time, then answer the questions below.'
        },
        reading: [
          'Most people who get better at a language do not do anything dramatic. They simply find a way to touch the language every day, even for ten minutes.',
          'The hard part is not the ten minutes. It is deciding what to do with them. A student who opens the same book at the same time each evening rarely needs motivation; the decision was already made a month ago.',
          'So the useful question is not how much time you have, but what you will do when the time arrives. Choose one action, tie it to something you already do, and let it run.'
        ],
        items: [
          { en: 'dramatic', ko: '극적인', meaning: 'sudden and noticeable', example: 'There was no dramatic change, just steady work.', note: 'drama에서 온 형용사입니다' },
          { en: 'rarely', ko: '거의 ~하지 않다', meaning: 'almost never', example: 'He rarely misses a morning session.', note: '문장 앞에 나오면 뒤가 도치됩니다' },
          { en: 'tie something to something', ko: '~에 붙여 두다', meaning: 'to connect one thing with another', example: 'Tie the reading to your morning coffee.', note: '습관 설계에서 자주 쓰는 표현입니다' }
        ],
        bullets: [
          { en: 'Answer with your own habit — I usually read on the bus.', ko: '내 습관으로 답하세요 — I usually read on the bus.' },
          { en: 'Answer with a reason — The reason is that...', ko: '이유를 붙여 답하세요 — The reason is that...' },
          { en: 'Answer with a plan — What I will do is...', ko: '계획으로 답하세요 — What I will do is...' }
        ],
        questions: [
          { ko: '이 글에서 성공을 가른 것은 무엇이라고 말하나요?', en: 'What does the passage say separates people who improve?' },
          { ko: '저자는 왜 시간의 양보다 행동이 중요하다고 하나요?', en: 'Why does the writer value the action over the amount of time?' },
          { ko: '매일 하는 일 중에 영어를 붙일 수 있는 습관 하나를 골라 보세요.', en: 'Which daily habit of yours could carry ten minutes of English?' },
          { ko: '열 분이라는 시간이 부족하다고 느껴지는 이유는 무엇인가요?', en: 'Why does ten minutes a day still feel like too little?' },
          { ko: '이번 주에 실제로 실행할 한 가지를 문장으로 써 보세요.', en: 'Write one sentence about what you will actually do this week.' },
          { ko: '이 글의 조언 중 이미 실천하고 있는 것이 있나요?', en: 'Which piece of advice from the passage are you already following?' }
        ]
      },

      /* 13. 쓰기 */
      {
        id: 'daily-writing',
        kind: 'writing',
        level: 'B1',
        title: { ko: '쓰기 — 하루 3문장 일기', en: 'Writing — a three-sentence journal' },
        intro: {
          ko: '먼저 오늘의 세 문장을 써 보고, 그다음 아래 모범 답안과 비교하세요.',
          en: 'Write your three sentences first, then compare them with the model answer below.'
        },
        body: {
          en: [
            '**Model answer for another day** — I met an old friend for coffee after work, and we talked for two hours. It felt warmer than the last time we met. Next week I am going to call her first.'
          ],
          ko: [
            '**다른 날의 모범 답안** — 퇴근길에 오랜 친구를 만나 커피를 마시며 두 시간을 이야기했습니다. 지난번보다 훨씬 편안했습니다. 다음 주에는 제가 먼저 전화할 생각입니다.'
          ]
        },
        bullets: [
          { en: 'Sentence 1 — what happened, in the past tense.', ko: '1문장 — 오늘 있었던 일, 과거시제로.' },
          { en: 'Sentence 2 — how you felt, with one adjective.', ko: '2문장 — 어땠는지, 형용사 하나로.' },
          { en: 'Sentence 3 — what you will do next, with will or going to.', ko: '3문장 — 다음에 할 일, will이나 be going to로.' },
          { en: 'Read it aloud once — three sentences take ten seconds and fix your rhythm.', ko: '한 번 소리 내어 읽으세요 — 세 문장이면 10초이고, 문장 리듬이 잡힙니다.' }
        ],
        items: [
          { en: 'I finally finished the report I had been avoiding.', ko: '미루던 보고서를 드디어 끝냈습니다.', note: '1문장 예시 — had been -ing로 그 전의 상태를 붙였습니다' },
          { en: 'It felt lighter than I expected.', ko: '생각보다 홀가분했습니다.', note: '2문장 예시 — 감정은 형용사로 짧게' },
          { en: 'Tomorrow I am going to start an hour earlier.', ko: '내일은 한 시간 일찍 시작할 겁니다.', note: '3문장 예시 — 예정된 계획은 be going to' }
        ],
        quote: {
          ko: '매일 세 문장. 1년이면 천 문장이 넘고, 그 안에서 시제가 자연스러워집니다.',
          en: 'Three sentences a day is over a thousand in a year, and your tenses settle on their own.'
        }
      },

      /* 14. 문화 */
      {
        id: 'daily-culture',
        kind: 'culture',
        level: 'B1',
        title: { ko: '문화 — 스몰토크의 규칙', en: 'Culture — how small talk actually works' },
        body: {
          en: [
            'Small talk is not a search for information. In most English-speaking workplaces it is a way of saying **I am not a threat** before anything serious begins.',
            'That is why the answer matters less than the follow-up. You are expected to give a short answer, then hand the question back. Answering fully and stopping is what makes a conversation feel cold.',
            '**One more rule** — small talk is short by design. Two or three turns are enough, and it is perfectly normal to finish with **Anyway, good to see you** and walk away.'
          ],
          ko: [
            '스몰토크는 정보를 얻으려는 대화가 아닙니다. 대부분의 영어권 직장에서 본론을 꺼내기 전에 **나는 적이 아니다**라고 알리는 신호입니다.',
            '그래서 대답의 내용보다 되묻는지가 중요합니다. 짧게 답하고 질문을 되돌려 주는 것이 예의입니다. 길게 답하고 끝내면 대화가 차갑게 느껴집니다.',
            '**한 가지 규칙이 더 있습니다** — 스몰토크는 원래 짧습니다. 두세 번 주고받았으면 **Anyway, good to see you**로 마무리하고 자리를 떠도 실례가 아닙니다.'
          ]
        },
        items: [
          { en: 'How is your week going?', ko: '이번 주 어때요?', meaning: 'how has your week been so far', example: 'How is your week going so far?', note: 'How are you보다 대답하기 쉽고 자연스럽습니다' },
          { en: 'Have you got any plans for the weekend?', ko: '주말에 계획 있어요?', meaning: 'do you have weekend plans', example: 'Have you got any plans for the long weekend?', note: '영국식 Have you got, 미국식 Do you have' },
          { en: 'I know what you mean.', ko: '무슨 말인지 알겠어요.', meaning: 'I understand your point', example: 'I know what you mean about the traffic.', note: '맞장구의 기본입니다' },
          { en: 'Anyway, how about you?', ko: '그나저나, 당신은 어때요?', meaning: 'let me ask you the same', example: 'Anyway, how about you? How was your trip?', note: 'Anyway로 화제를 넘기면 어색하지 않습니다' },
          { en: 'Long week?', ko: '한 주 길었죠?', meaning: 'was your week tiring', example: 'Long week? You look tired.', note: '두 단어만으로 분위기를 여는 질문입니다' },
          { en: 'I will let you get back to it.', ko: '그럼 하던 일 보세요.', meaning: 'I will end the conversation here', example: 'I will let you get back to it. Nice talking.', note: '대화를 짧게 닫는 예의 바른 문장입니다' }
        ],
        quote: {
          ko: '스몰토크는 답이 아니라 되묻기로 완성됩니다.',
          en: 'Small talk is finished by the question you hand back, not by your answer.'
        }
      },

      /* 15. 토론 */
      {
        id: 'daily-discussion',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '토론 — 10가지 질문', en: 'Discussion — ten questions' },
        intro: {
          ko: '소리 내어 30초씩 답해 보세요. 녹음해서 들어 보면 더 좋습니다.',
          en: 'Answer aloud for thirty seconds each. Recording yourself helps more than you expect.'
        },
        questions: [
          { ko: '스몰토크가 어색하게 느껴지는 이유는 무엇인가요?', en: 'Why does small talk feel awkward to you?' },
          { ko: '영어로 농담을 할 때 어려운 점은 무엇인가요?', en: 'What is hard about joking in English?' },
          { ko: '하루 중 영어를 쓸 수 있는 시간을 어디에 넣을 수 있나요?', en: 'Where in your day could English fit?' },
          { ko: '줄임말과 슬랭은 배워야 할까요, 피해야 할까요?', en: 'Should learners pick up slang, or avoid it?' },
          { ko: '발음에서 가장 고치고 싶은 부분은 어디인가요?', en: 'Which part of your pronunciation do you want to fix first?' },
          { ko: '영어로 말할 때 자신감을 높이는 방법은 무엇일까요?', en: 'What actually raises your confidence when you speak?' },
          { ko: '되묻는 질문을 일부러 하나씩 붙여 본다면, 어떤 문장을 써 보겠어요?', en: 'If you added one follow-up question to every answer, which line would you use most?' },
          { ko: '한국어로 하는 습관 중 영어로 바꿔 볼 수 있는 것은 무엇인가요?', en: 'Which habit you already do in Korean could you switch to English?' },
          { ko: '스몰토크를 두세 번으로 끝내는 것에 대해 어떻게 생각하나요?', en: 'How do you feel about finishing small talk after just two or three turns?' },
          { ko: '되묻기 습관을 들이면 대화가 어떻게 달라질까요?', en: 'How would a habit of asking back change your conversations?' }
        ],
        bullets: [
          { en: 'To keep going — Go on... / Really? What happened next?', ko: '말을 이어 달라고 할 때 — Go on... / Really? What happened next?' },
          { en: 'To show you are listening — Right. / I see. / That makes sense.', ko: '듣고 있다는 신호 — Right. / I see. / That makes sense.' },
          { en: 'To hand it back — What about you? / How about yourself?', ko: '질문을 되돌릴 때 — What about you? / How about yourself?' },
          { en: 'To close kindly — Anyway, good to see you.', ko: '정중하게 닫을 때 — Anyway, good to see you.' }
        ]
      },

      /* 16. 확인 문제 */
      {
        id: 'daily-quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 16문항', en: 'Quiz — sixteen questions' },
        intro: {
          ko: '보기를 고르면 바로 채점되고, 다 풀면 점수가 나옵니다. 틀려도 다시 풀 수 있습니다.',
          en: 'Pick an option and it is marked instantly. Your score appears when you finish, and you can start over.'
        },
        quiz: [
          {
            q: { ko: '빈칸에 알맞은 것은? "I ___ walk to work, but I cycle now."', en: 'Which fits? "I ___ walk to work, but I cycle now."' },
            options: ['am used to', 'used to', 'use to', 'getting used to'],
            answer: 1,
            explain: {
              ko: '지금은 아닌 과거의 습관이므로 used to + 동사원형입니다.',
              en: 'A past habit that has ended takes used to plus the base verb.'
            }
          },
          {
            q: { ko: '"그 사람은 아주 쉬운 일이었어"에 맞는 표현은?', en: 'Which means that something was very easy?' },
            options: ['a piece of cake', 'under the weather', 'out of the blue', 'in the same boat'],
            answer: 0,
            explain: {
              ko: 'a piece of cake가 정답입니다. under the weather는 몸이 안 좋은 상태입니다.',
              en: 'A piece of cake means very easy. Under the weather means slightly ill.'
            }
          },
          {
            q: { ko: '"약속을 미루다"에 해당하는 구동사는?', en: 'Which phrasal verb means to delay something?' },
            options: ['turn up', 'put off', 'run into', 'come up with'],
            answer: 1,
            explain: {
              ko: 'put off가 정답입니다. turn up은 나타나다입니다.',
              en: 'Put off means to delay. Turn up means to appear.'
            }
          },
          {
            q: { ko: '어색한 조합은 어느 것인가요?', en: 'Which one is the unnatural collocation?' },
            options: ['make a decision', 'take a break', 'do a decision', 'have a look'],
            answer: 2,
            explain: {
              ko: '결정은 make a decision입니다. do a decision은 쓰지 않습니다.',
              en: 'We make a decision. Do a decision is never used.'
            }
          },
          {
            q: { ko: '카페에서 포장을 뜻하는 표현은?', en: 'Which line asks for takeaway coffee?' },
            options: ['For here, please.', 'To go, please.', 'That is all, thanks.', 'Make it decaf.'],
            answer: 1,
            explain: {
              ko: 'To go가 포장입니다. For here는 매장에서 마시는 것입니다.',
              en: 'To go means takeaway. For here means eating in.'
            }
          },
          {
            q: { ko: '"그동안 어떻게 지냈어요?"로 가장 자연스러운 것은?', en: 'Which is the most natural way to ask how someone has been?' },
            options: ['How are you been?', 'How you have been?', 'How have you been?', 'How do you been?'],
            answer: 2,
            explain: {
              ko: '현재완료 의문문은 How have you been? 순서입니다.',
              en: 'The present perfect question keeps the order how have you been.'
            }
          },
          {
            q: { ko: '새 직장에 적응하는 중이라고 말하려면?', en: 'Which sentence means you are in the middle of adapting?' },
            options: ['I used to the new job.', 'I am used to the new job.', 'I am getting used to the new job.', 'I get used the new job.'],
            answer: 2,
            explain: {
              ko: '적응하는 과정은 be getting used to + 명사/-ing입니다.',
              en: 'The process takes be getting used to plus a noun or an -ing form.'
            }
          },
          {
            q: { ko: '동료와 잘 지낸다는 구동사는?', en: 'Which phrasal verb means having a good relationship with someone?' },
            options: ['get along with', 'get used to', 'look after', 'put off'],
            answer: 0,
            explain: {
              ko: '사람 사이에는 get along with, 사물을 돌볼 때는 look after를 씁니다.',
              en: 'Get along with is for people. Look after is for taking care of someone or something.'
            }
          },
          {
            q: { ko: '서류를 정리해 해결한다는 뜻의 구동사는?', en: 'Which phrasal verb means to organise and settle something?' },
            options: ['pop in', 'sort out', 'hang out', 'turn up'],
            answer: 1,
            explain: {
              ko: 'sort out은 정리해서 해결하다입니다. pop in은 잠깐 들르다입니다.',
              en: 'Sort out is to organise and settle. Pop in is to visit briefly.'
            }
          },
          {
            q: { ko: '약속에 늦어지고 있을 때 가장 자연스러운 문장은?', en: 'Which sentence fits when you are falling behind schedule?' },
            options: ['I run a bit late.', 'I am running a bit late.', 'I am late to run.', 'I have late.'],
            answer: 1,
            explain: {
              ko: '진행 중인 지연은 현재진행형 be running late입니다.',
              en: 'A delay in progress takes the present continuous: I am running late.'
            }
          },
          {
            q: { ko: '제안을 짧게 수락하는 표현은?', en: 'Which line accepts a suggestion briefly?' },
            options: ['Sounds good.', 'Out of the blue.', 'Under the weather.', 'The last straw.'],
            answer: 0,
            explain: {
              ko: 'Sounds good이 수락이고, 나머지는 이디엄입니다.',
              en: 'Sounds good accepts the plan. The other three are idioms with different meanings.'
            }
          },
          {
            q: { ko: '일정을 맞출 때 "나는 괜찮아"에 가장 가까운 것은?', en: 'Which line means the time suits you?' },
            options: ['That works for me.', 'That is all, thanks.', 'No big deal.', 'You bet.'],
            answer: 0,
            explain: {
              ko: 'That works for me는 일정이 맞는다는 뜻입니다.',
              en: 'That works for me says the arrangement is fine on your side.'
            }
          },
          {
            q: { ko: '"그럴 만하네요"에 해당하는 슬랭은?', en: 'Which slang means that something is reasonable?' },
            options: ['Fair enough.', 'My bad.', 'You bet.', 'Got it.'],
            answer: 0,
            explain: {
              ko: 'Fair enough가 그럴 만하다는 인정입니다. My bad는 내 잘못이라는 뜻입니다.',
              en: 'Fair enough accepts the point. My bad admits a small mistake.'
            }
          },
          {
            q: { ko: '"그럭저럭 버티다"에 해당하는 구동사는?', en: 'Which phrasal verb means to manage with difficulty?' },
            options: ['get by', 'come over', 'hang out', 'pop in'],
            answer: 0,
            explain: {
              ko: 'get by가 그럭저럭 지내다입니다. come over는 놀러 오다입니다.',
              en: 'Get by means managing. Come over means visiting someone home.'
            }
          },
          {
            q: { ko: '"낮잠을 자다"에 맞는 연어는?', en: 'Which collocation means a short daytime sleep?' },
            options: ['take a nap', 'do a nap', 'make a nap', 'sleep a nap'],
            answer: 0,
            explain: {
              ko: '낮잠은 take a nap으로만 씁니다.',
              en: 'A nap is always taken. The other verbs are never used with it.'
            }
          },
          {
            q: { ko: '빠른 말에서 going to는 어떻게 줄어드나요?', en: 'What does going to become in fast speech?' },
            options: ['gonna', 'gotta', 'wanna', 'goin to'],
            answer: 0,
            explain: {
              ko: 'going to는 gonna로 줄어듭니다. gotta는 have got to의 축약입니다.',
              en: 'Going to becomes gonna. Gotta stands for have got to.'
            }
          }
        ]
      },

      /* 17. 해설 노트 */
      {
        id: 'daily-note',
        kind: 'note',
        level: 'B1',
        title: { ko: '해설 노트 — 이번 호의 함정', en: 'Notes — the traps in this issue' },
        intro: {
          ko: '한국어 화자가 이번 호에서 특히 자주 걸리는 지점만 모았습니다.',
          en: 'Only the points Korean speakers trip over most often in this issue.'
        },
        bullets: [
          { en: '**used to vs be used to** — the first is a past habit; the second needs a noun or -ing after it.', ko: '**used to vs be used to** — 앞은 과거 습관, 뒤는 명사나 -ing가 따라옵니다.' },
          { en: '**make vs do** — decisions, plans and mistakes are made; work, homework and a favour are done.', ko: '**make vs do** — 결정·계획·실수는 make, 일·숙제·부탁은 do입니다.' },
          { en: '**Short answers sound cold** — add one follow-up question and the whole exchange warms up.', ko: '**짧은 대답은 차갑게 들립니다** — 되묻는 질문 하나면 대화가 살아납니다.' },
          { en: '**Reductions are not lazy speech** — they are the normal shape of fast English.', ko: '**축약은 게으른 발음이 아닙니다** — 빠른 영어의 기본 형태입니다.' },
          { en: '**Slang is for listening first** — understand it, then decide whether to use it.', ko: '**슬랭은 듣기가 먼저입니다** — 알아듣고 나서 쓸지 결정하세요.' },
          { en: '**Answer, then ask** — the follow-up question is the polite half of small talk.', ko: '**답한 뒤 되물으세요** — 되묻는 질문이 스몰토크의 나머지 절반입니다.' },
          { en: '**get along with people, look after things** — the two verbs are not interchangeable.', ko: '**사람에게는 get along with, 사물에는 look after** — 서로 바꿔 쓸 수 없습니다.' },
          { en: '**Say it out loud** — a line you have never spoken will not come out in a real conversation.', ko: '**소리 내어 말하세요** — 한 번도 입으로 뱉지 않은 문장은 실전에서 나오지 않습니다.' },
          { en: '**going to, want to, got to** — gonna, wanna, gotta in fast speech, but never in writing.', ko: '**going to · want to · got to** — 빠른 말에서는 gonna, wanna, gotta가 되지만 글로는 쓰지 않습니다.' },
          { en: '**Sleep in, not sleep late** — the phrasal verb is the one people say.', ko: '**늦잠은 sleep in** — sleep late보다 sleep in이 훨씬 흔합니다.' },
          { en: '**Keep me posted** — the standard way to ask for updates without asking again.', ko: '**Keep me posted** — 다시 묻지 않고도 진행 상황을 부탁하는 표준 표현입니다.' },
          { en: '**Naps are taken, plans are made** — here too the verbs are fixed.', ko: '**낮잠은 take, 계획은 make** — 여기서도 동사가 고정입니다.' }
        ]
      }
    ]
  },

  /* ══ 2주 — 직장 영어 (발행) ═════════════════════════════════════════════ */
  {
    week: 2,
    slug: 'week-02',
    quarter: 1,
    published: '2026-08',
    level: 'B1',
    theme: { ko: '직장 영어', en: 'English at work' },
    title: {
      ko: '회의와 이메일에서 통하는 문장',
      en: 'Sentences that work in meetings and email'
    },
    summary: {
      ko: '돌려 말하지 않고도 정중하게 말하는 법. 업무 어휘 16개, 구동사 12개, 연어 10개, 정중 표현 문법, 발음 10개, 비즈니스 이디엄 10개, 회의 대화 2장, 자연스러운 표현과 유머, 모범 이메일이 있는 작문, 받아쓰기 10문장, 독해 1편과 모범 표현, 회사 문화, 토론 질문 10개, 확인 문제 16개.',
      en: 'Being polite without being vague: sixteen work words, twelve phrasal verbs, ten collocations, a grammar point on polite forms, ten pronunciation points, ten business idioms, two meetings, natural expressions and humour, a model email, ten dictation lines, one reading passage with model expressions, a culture note, ten discussion questions and sixteen quiz items.'
    },

    sections: [
      /* 0. 학습목표 */
      {
        id: 'work-goals',
        kind: 'goals',
        level: 'B1',
        title: { ko: '이 주의 학습목표', en: 'What you will be able to do this week' },
        intro: {
          ko: '이 주를 마치면 아래 네 가지를 영어로 할 수 있게 됩니다. 읽기 전에 한 번, 다 읽고 한 번 확인하세요.',
          en: 'By the end of this week you should be able to do the four things below. Check them once before you read and once after.'
        },
        bullets: [
          { en: 'Report progress and flag a delay in one clear sentence.', ko: '진행 상황과 지연을 한 문장으로 분명하게 알립니다.' },
          { en: 'Pick the right rung of politeness for a request, from a chat message to a client email.', ko: '메신저부터 고객 메일까지 상황에 맞는 정중함의 단계를 골라 부탁합니다.' },
          { en: 'Read a short internal email quickly and answer what it actually asks.', ko: '짧은 업무 메일을 빠르게 읽고 요구 사항에 정확히 답합니다.' },
          { en: 'Say meeting language clearly enough to be understood on a call.', ko: '회의 표현을 통화에서도 들리게 또렷하게 말합니다.' }
        ],
        quote: {
          ko: '업무 영어는 유창함보다 정확한 한 문장이 먼저입니다.',
          en: 'In work English, one accurate sentence beats a fluent guess.'
        }
      },

      /* 1. 업무 어휘 */
      {
        id: 'work-words',
        kind: 'vocabulary',
        level: 'B1',
        title: { ko: '업무 어휘 — 회의에서 매일 나오는 16단어', en: 'Work words — sixteen that come up daily' },
        intro: {
          ko: '한국어로는 다르게 들려도, 영어 회의에서는 이 단어들이 반복됩니다.',
          en: 'They sound different in Korean, but in English meetings these come back constantly.'
        },
        items: [
          { en: 'deadline', ko: '마감', meaning: 'the time by which something must be finished', example: 'The deadline moved to Thursday.', note: 'move forward는 앞당기다, push back은 미루다입니다' },
          { en: 'deliverable', ko: '산출물', meaning: 'a result you are expected to hand over', example: 'What are the deliverables for this phase?', note: '결과물의 목록을 말할 때 복수로 씁니다' },
          { en: 'stakeholder', ko: '이해관계자', meaning: 'a person affected by a project', example: 'We should update the stakeholders first.', note: '고객·투자자·내부 팀 모두 포함합니다' },
          { en: 'scope', ko: '범위', meaning: 'the work included in a project', example: 'That is outside the scope of this release.', note: '정중한 거절로도 아주 유용합니다' },
          { en: 'bandwidth', ko: '(업무를 할) 여력', meaning: 'the time and energy available', example: 'I do not have the bandwidth this week.', note: '원어민도 회의에서 자주 쓰는 비유입니다' },
          { en: 'escalate', ko: '상위에 보고하다', meaning: 'to raise an issue to a higher level', example: 'Let us escalate this to the manager.', note: '문제를 키운다는 뜻이 아니라 올린다는 뜻입니다' },
          { en: 'alignment', ko: '방향 일치', meaning: 'agreement on the plan', example: 'We need alignment before we start.', note: 'We are aligned라고도 합니다' },
          { en: 'blocker', ko: '진행을 막는 문제', meaning: 'something that stops progress', example: 'Any blockers before Friday?', note: '상태를 물을 때 자주 씁니다' },
          { en: 'takeaway', ko: '핵심 요점', meaning: 'the main point to remember', example: 'What is the main takeaway from today?', note: '식당 포장 음식이라는 뜻도 있습니다' },
          { en: 'action item', ko: '할 일 항목', meaning: 'a task that someone must do', example: 'Let us list the action items here.', note: '회의록에서 담당자와 함께 적습니다' },
          { en: 'heads-up', ko: '미리 알림', meaning: 'an early warning about something', example: 'Thanks for the heads-up about the delay.', note: '명사 앞에 a를 붙여 a heads-up으로 씁니다' },
          { en: 'handover', ko: '업무 인계', meaning: 'the act of passing work to someone', example: 'We need a clean handover before she leaves.', note: '동사로는 hand over입니다' },
          { en: 'agenda', ko: '회의 안건', meaning: 'the list of things to discuss', example: 'The first item on the agenda is budget.', note: '안건은 agenda 순서대로 다룹니다' },
          { en: 'attendee', ko: '참석자', meaning: 'a person who attends a meeting', example: 'Attendees should join five minutes early.', note: '참가자·참석자를 모두 attendee로 씁니다' },
          { en: 'availability', ko: '일정 가능 여부', meaning: 'the times when someone is free', example: 'Please check your availability for Thursday.', note: '가능한 시간대는 available slot입니다' },
          { en: 'rework', ko: '재작업', meaning: 'work that has to be done again', example: 'The rework cost us two days.', note: '다시 만드는 작업 전체를 뜻합니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'work-phrasal',
        kind: 'phrasal',
        level: 'B1',
        title: { ko: '구동사 — 이메일을 짧게 만드는 12개', en: 'Phrasal verbs — twelve that shorten your email' },
        intro: {
          ko: '긴 문장을 한 단어로 줄여 줍니다. 다만 격식이 필요한 문서에서는 풀어 쓰는 편이 안전합니다.',
          en: 'They shrink long sentences into one unit. In very formal documents, the full form is safer.'
        },
        items: [
          { en: 'follow up', ko: '후속 조치하다', meaning: 'to check on something later', example: 'I will follow up with the vendor tomorrow.', note: '명사형은 a follow-up입니다' },
          { en: 'reach out', ko: '(먼저) 연락하다', meaning: 'to contact someone', example: 'Thanks for reaching out.', note: '이메일 첫 줄에 자주 씁니다' },
          { en: 'loop in', ko: '끼워 넣다, 공유하다', meaning: 'to include someone in a conversation', example: 'Please loop in the design team.', note: 'keep in the loop는 계속 알려 준다는 뜻입니다' },
          { en: 'circle back', ko: '나중에 다시 논의하다', meaning: 'to return to a topic later', example: 'Let us circle back after lunch.', note: '정중하게 결론을 미루는 표현입니다' },
          { en: 'run by', ko: '한번 봐 주다, 확인받다', meaning: 'to show something for approval', example: 'Let me run this by my manager.', note: 'run it by me는 나에게 확인시켜 달라는 뜻입니다' },
          { en: 'take over', ko: '넘겨받다', meaning: 'to take responsibility for something', example: 'Mina will take over the client account.', note: 'hand over는 넘겨주는 쪽입니다' },
          { en: 'roll out', ko: '단계적으로 출시하다', meaning: 'to release something gradually', example: 'We roll out the update on Monday.', note: '명사형은 a rollout입니다' },
          { en: 'sign off on', ko: '최종 승인하다', meaning: 'to give final approval', example: 'The director has to sign off on the budget.', note: 'sign off는 퇴근하다는 뜻도 있습니다' },
          { en: 'flag up', ko: '문제로 알리다', meaning: 'to point something out for attention', example: 'Please flag up any risk early.', note: 'raise a concern보다 짧은 동료 간 표현입니다' },
          { en: 'push back', ko: '일정을 미루다, 반대하다', meaning: 'to delay or to resist', example: 'Can we push back the launch by a week?', note: '일정과 의견 모두에 씁니다' },
          { en: 'carry over', ko: '다음으로 넘기다', meaning: 'to move something to the next period', example: 'Let us carry the rest over to next week.', note: '남은 항목·일정을 다음으로 미룰 때 씁니다' },
          { en: 'close out', ko: '마무리하다, 종결하다', meaning: 'to finish something formally', example: 'We closed out the ticket yesterday.', note: '이슈·티켓을 끝낼 때 자주 씁니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'work-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 문서에서 틀리기 쉬운 10쌍', en: 'Collocations — ten pairs that go wrong in writing' },
        items: [
          { en: 'meet a deadline', ko: '마감을 지키다', meaning: 'to finish on time', example: 'We met the deadline by two hours.', note: 'keep a deadline보다 meet을 씁니다' },
          { en: 'raise a concern', ko: '우려를 제기하다', meaning: 'to mention a worry', example: 'I would like to raise a concern about cost.', note: 'say a concern은 어색합니다' },
          { en: 'set up a meeting', ko: '회의를 잡다', meaning: 'to arrange a meeting', example: 'Can you set up a meeting for Monday?', note: 'arrange a meeting도 좋습니다' },
          { en: 'take minutes', ko: '회의록을 작성하다', meaning: 'to write the meeting notes', example: 'Who is taking minutes today?', note: 'minutes는 항상 복수입니다' },
          { en: 'give an update', ko: '현황을 알리다', meaning: 'to report the current state', example: 'Let me give a quick update.', note: 'update on + 대상 형태로도 씁니다' },
          { en: 'meet expectations', ko: '기대에 부응하다', meaning: 'to be as good as expected', example: 'The result met our expectations.', note: 'live up to expectations도 같은 뜻입니다' },
          { en: 'run a meeting', ko: '회의를 진행하다', meaning: 'to lead a meeting', example: 'She runs the Monday meeting.', note: 'do a meeting은 쓰지 않습니다' },
          { en: 'put together a plan', ko: '계획을 짜다', meaning: 'to prepare something from parts', example: 'I will put together a short plan.', note: 'write a plan보다 준비의 느낌이 강합니다' },
          { en: 'send a reminder', ko: '알림을 보내다', meaning: 'to remind someone about something', example: 'I will send a reminder on Monday morning.', note: '일정 알림은 reminder about로 붙입니다' },
          { en: 'hit a target', ko: '목표를 달성하다', meaning: 'to reach a goal', example: 'We hit the sales target in March.', note: '달성하다는 hit 또는 reach로 고정입니다' }
        ]
      },

      /* 4. 문법 */
      {
        id: 'work-grammar',
        kind: 'grammar',
        level: 'B2',
        title: { ko: '문법 — 정중함의 단계', en: 'Grammar — the ladder of politeness' },
        intro: {
          ko: '같은 부탁도 조동사 하나로 강도가 달라집니다. 상황에 맞게 골라 쓰세요.',
          en: 'One modal changes how hard a request lands. Pick the rung that fits the situation.'
        },
        body: {
          en: [
            'The further you move from **can** towards **would you mind**, the softer the request. Softness is not always better: with a close colleague, an over-polite sentence sounds distant.',
            'The most useful pattern for work is **Could you + base verb**. It is polite enough for a client and short enough for a chat message.',
            '**The mistake to watch** — would you mind takes an -ing form, never a base verb. **Would you mind checking this?** is right.'
          ],
          ko: [
            '**can**에서 **would you mind** 쪽으로 갈수록 부탁이 부드러워집니다. 다만 부드러움이 항상 좋은 것은 아닙니다. 가까운 동료에게 지나치게 격식 있는 문장은 오히려 거리를 만듭니다.',
            '업무에서 가장 요긴한 형태는 **Could you + 동사원형**입니다. 고객에게도 충분히 정중하고, 메신저에 쓰기에도 짧습니다.',
            '**자주 하는 실수** — Would you mind 뒤에는 -ing가 옵니다. **Would you mind checking this?**가 맞고, 동사원형을 쓰면 틀립니다.'
          ]
        },
        table: {
          caption: { ko: '부탁의 강도', en: 'Strength of a request' },
          head: [{ ko: '표현', en: 'Expression' }, { ko: '쓰는 자리', en: 'Where it fits' }],
          rows: [
            ['Send me the file.', 'direct, close colleagues'],
            ['Can you send me the file?', 'everyday, neutral'],
            ['Could you send me the file?', 'safe default at work'],
            ['Would you mind sending me the file?', 'very polite, formal'],
            ['I was wondering if you could send me the file.', 'soft, indirect, email']
          ]
        },
        items: [
          { en: 'Could you check this by Friday?', ko: '금요일까지 확인해 주시겠어요?', note: '업무 기본형 — 이 하나만 익혀도 됩니다' },
          { en: 'Would you mind taking a look?', ko: '한번 봐 주시겠어요?', note: 'mind 뒤에는 -ing가 옵니다' },
          { en: 'I was wondering if you could join us.', ko: '함께해 주실 수 있을지 궁금했습니다.', note: '가장 부드러운 부탁 — 이메일에 어울립니다' },
          { en: 'Let me know if that works for you.', ko: '괜찮으신지 알려 주세요.', note: '부탁을 닫는 문장으로 좋습니다' },
          { en: 'Would you mind checking this?', ko: '이것 좀 확인해 주시겠어요?', note: 'mind 뒤에는 -ing가 옵니다. 가장 자주 틀리는 자리입니다', meaning: 'a polite request with an -ing form' },
          { en: 'I appreciate you looking into it.', ko: '살펴봐 주셔서 감사합니다.', note: '업무 메일에서 Thank you보다 격식 있는 감사 표현입니다', meaning: 'a more formal thank you' }
        ],
        quote: {
          ko: '정중함은 길이가 아니라 조동사로 만듭니다. Could you 하나면 충분합니다.',
          en: 'Politeness comes from the modal, not the length. Could you is usually enough.'
        }
      },

      /* 5. 발음 */
      {
        id: 'work-pron',
        kind: 'pronunciation',
        level: 'B2',
        title: { ko: '발음 — 통화에서 문장이 또렷하게 들리게', en: 'Pronunciation — sounding clear on a call' },
        intro: {
          ko: '화상회의와 전화에서는 표정과 손짓이 없습니다. 강세와 끊어 읽기가 뜻을 나릅니다.',
          en: 'On a call nobody can see your face or hands. Stress and pausing carry the meaning.'
        },
        items: [
          { en: 'I will send it by end of day.', ko: '오늘 안으로 보내겠습니다.', note: 'send it by는 붙여 읽지 말고 by 앞에서 아주 짧게 쉽니다.' },
          { en: 'Could we push the deadline to Friday?', ko: '마감을 금요일로 미룰 수 있을까요?', note: 'push the deadline에서 deadline에 강세를 둡니다.' },
          { en: 'Sorry, you are breaking up.', ko: '죄송하지만 연결이 끊기네요.', note: 'breaking up은 통화 품질이 나쁠 때 쓰는 정형 표현입니다.' },
          { en: 'Let me share my screen.', ko: '화면을 공유하겠습니다.', note: 'share my를 한 덩어리로 붙여 말합니다.' },
          { en: 'I did not catch the last part.', ko: '마지막 부분을 못 들었습니다.', note: 'catch에 강세를 둡니다. did not은 약하게 지나갑니다.' },
          { en: 'Let me repeat that back to you.', ko: '다시 한번 정리해서 말씀드리겠습니다.', note: 'repeat that back은 한 덩어리로 이어 읽습니다.' },
          { en: 'Just to confirm, we are on for Thursday.', ko: '확인차 말씀드리면 목요일로 확정입니다.', note: 'Just to는 붙여 읽고 confirm에 강세를 둡니다.' },
          { en: 'The numbers are in the shared folder.', ko: '수치는 공유 폴더에 있습니다.', note: 'shared folder는 한 단어처럼 붙여 말합니다.' },
          { en: 'Let me walk you through the numbers.', ko: '수치를 하나씩 설명드리겠습니다.', note: 'walk you through는 차근차근 설명한다는 표현입니다.' },
          { en: 'I will circle back to you before five.', ko: '다섯 시 전에 다시 연락드리겠습니다.', note: 'circle back은 한 덩어리로 빠르게 읽습니다.' }
        ],
        bullets: [
          { en: 'Stress the noun that matters, then pause. Flat, fast sentences are the ones people ask you to repeat.', ko: '중요한 명사에 강세를 두고 짧게 쉽니다. 평평하고 빠른 문장이 되물음을 부릅니다.' },
          { en: 'Numbers and dates need a clear pause before and after.', ko: '숫자와 날짜는 앞뒤에 또렷한 쉼을 둡니다.' },
          { en: 'End each point with a falling tone, so people know you are done.', ko: '각 문장 끝을 내림조로 마쳐야 말이 끝났다는 신호가 됩니다.' }
        ]
      },

      /* 6. 이디엄 */
      {
        id: 'work-idioms',
        kind: 'idioms',
        level: 'B2',
        title: { ko: '비즈니스 이디엄 — 회의에서 들리는 10개', en: 'Business idioms — ten you hear in meetings' },
        items: [
          { en: 'touch base', ko: '짧게 상황을 공유하다', meaning: 'to make brief contact', example: 'Let us touch base on Friday.', note: '길게 논의하지 않고 확인만 하는 느낌입니다' },
          { en: 'ballpark figure', ko: '대략적인 수치', meaning: 'a rough estimate', example: 'Can you give me a ballpark figure?', note: '정확한 값이 아니어도 된다는 신호입니다' },
          { en: 'on the same page', ko: '같은 이해를 가진', meaning: 'sharing the same understanding', example: 'Let us make sure we are on the same page.', note: '회의 마무리에 자주 씁니다' },
          { en: 'move the needle', ko: '실질적인 변화를 만들다', meaning: 'to make a real difference', example: 'This feature will not move the needle.', note: '성과가 크지 않다는 뜻으로도 씁니다' },
          { en: 'in the loop', ko: '정보를 공유받는', meaning: 'informed about something', example: 'Please keep me in the loop.', note: 'out of the loop은 반대 상황입니다' },
          { en: 'low-hanging fruit', ko: '당장 성과를 내기 쉬운 일', meaning: 'the easiest wins', example: 'Let us start with the low-hanging fruit.', note: '쉬운 것부터 하자는 뜻입니다' },
          { en: 'cut corners', ko: '대충 넘어가다', meaning: 'to skip steps to save time', example: 'We cannot cut corners on testing.', note: '거의 항상 부정문으로 씁니다' },
          { en: 'circle back', ko: '나중에 다시 논의하다', meaning: 'to return to a topic later', example: 'Let us circle back after the release.', note: '구동사로도, 동사로도 익혀 두세요' },
          { en: 'on my radar', ko: '신경 쓰고 있는', meaning: 'something I am tracking', example: 'That risk is on my radar.', note: '괜찮다기보다 보고 있다는 뜻입니다' },
          { en: 'back to the drawing board', ko: '처음부터 다시', meaning: 'to start again after a failure', example: 'The test failed, so it is back to the drawing board.', note: '설계 도면으로 돌아간다는 이미지에서 온 표현입니다' }
        ]
      },

      /* 6-2. 자연스러운 표현 */
      {
        id: 'work-natural',
        kind: 'natural',
        level: 'B1',
        title: { ko: '자연스러운 표현 — 요청을 부드럽게', en: 'Natural English — softening a request' },
        intro: {
          ko: '같은 부탁도 이렇게 주고받으면 부담이 줄어듭니다. 짧은 확신과 확인 질문의 조합입니다.',
          en: 'The same request lands lighter in this shape — short reassurance plus a checking question.'
        },
        dialogue: [
          { who: 'Manager', en: 'Could you take a look at this before the meeting?', ko: '회의 전에 이것 좀 봐 주시겠어요?' },
          { who: 'You', en: 'Sure. Would you like it back today or tomorrow morning?', ko: '그럼요. 오늘 드릴까요, 내일 오전에 드릴까요?' },
          { who: 'Manager', en: 'Tomorrow morning is fine. There is no rush.', ko: '내일 오전이면 됩니다. 급하지 않습니다.' },
          { who: 'You', en: 'Understood. I will send it over before ten.', ko: '알겠습니다. 열 시 전에 보내 드리겠습니다.' },
          { who: 'Manager', en: 'And could you copy the sales team when you do?', ko: '그때 영업 팀도 참조로 넣어 주시겠어요?' },
          { who: 'You', en: 'Of course. I will add them to the reply.', ko: '물론이죠. 답장에 추가하겠습니다.' }
        ],
        items: [
          { en: 'Would you like it back today?', ko: '오늘 드릴까요?', meaning: 'when do you need it returned', example: 'Would you like it back today or tomorrow?', note: '기한을 먼저 정하면 오해가 줄어듭니다' },
          { en: 'There is no rush.', ko: '급하지 않습니다.', meaning: 'it is not urgent', example: 'No rush, tomorrow is fine.', note: '상대의 부담을 덜어 줄 때 씁니다' },
          { en: 'I will send it over before ten.', ko: '열 시 전에 보내 드리겠습니다.', meaning: 'I will email it before ten', example: 'I will send the file over tonight.', note: 'send over는 메일로 보내다는 회사 표현입니다' },
          { en: 'Understood.', ko: '알겠습니다.', meaning: 'I understand and will do it', example: 'Understood, I will fix it today.', note: 'OK보다 업무에 어울리는 간결한 답입니다' },
          { en: 'Could you copy the sales team?', ko: '영업 팀도 참조로 넣어 주시겠어요?', meaning: 'please add them to the email', example: 'Could you copy me on the reply?', note: '참조로 넣다는 말로 copy를 씁니다' },
          { en: 'That works for me.', ko: '저는 괜찮습니다.', meaning: 'that timing suits me', example: 'Two o clock works for me.', note: '일정 조율에서 자주 쓰는 동의 표현입니다' }
        ]
      },

      /* 6. 회의 대화 1 */
      {
        id: 'work-meeting1',
        kind: 'conversation',
        level: 'B1',
        title: { ko: '회의 1 — 의견을 정중하게 내기', en: 'Meeting 1 — putting an idea on the table' },
        intro: {
          ko: '반대할 때도 상대를 공격하지 않는 문장 구조가 있습니다.',
          en: 'There is a structure for disagreeing that never attacks the person.'
        },
        dialogue: [
          { who: 'Leader', en: 'Before we decide, does anyone have concerns?', ko: '결정하기 전에 우려되는 점 있나요?' },
          { who: 'You', en: 'I see the benefit, but I am worried about the timeline.', ko: '장점은 알겠는데 일정이 걱정됩니다.' },
          { who: 'Leader', en: 'Say more about that.', ko: '조금 더 말씀해 주세요.' },
          { who: 'You', en: 'If we start in October, testing lands in peak season.', ko: '10월에 시작하면 테스트가 성수기에 걸립니다.' },
          { who: 'Leader', en: 'That is a fair point. What would you suggest?', ko: '타당한 지적입니다. 어떻게 하면 좋을까요?' },
          { who: 'You', en: 'Could we run a smaller version first and review in November?', ko: '작은 버전으로 먼저 해 보고 11월에 검토하면 어떨까요?' }
        ],
        items: [
          { en: 'I see the benefit, but I am worried about the timeline.', ko: '장점은 알겠는데 일정이 걱정됩니다.', note: '인정한 뒤 반대하는 기본 구조입니다' },
          { en: 'That is a fair point.', ko: '타당한 지적입니다.', note: '상대 의견을 받아들이는 표현입니다' },
          { en: 'What would you suggest?', ko: '어떻게 하면 좋을까요?', note: '문제 제기와 해결책을 연결해 줍니다' },
          { en: 'Could we run a smaller version first?', ko: '작은 버전으로 먼저 해 보면 어떨까요?', note: '제안은 Could we + 동사원형으로 부드럽게' },
          { en: 'Before we decide, does anyone have concerns?', ko: '결정하기 전에 우려되는 점 있나요?', note: '회의를 여는 진행자 문장입니다' },
          { en: 'Say more about that.', ko: '조금 더 말씀해 주세요.', note: '상대 의견을 이끌어 내는 가장 짧은 문장입니다' }
        ]
      },

      /* 7. 회의 대화 2 */
      {
        id: 'work-meeting2',
        kind: 'conversation',
        level: 'B1',
        title: { ko: '회의 2 — 일정을 조율하고 마무리하기', en: 'Meeting 2 — juggling schedules and closing' },
        dialogue: [
          { who: 'Colleague', en: 'Can we move our review to Thursday?', ko: '검토를 목요일로 옮길 수 있을까요?' },
          { who: 'You', en: 'Thursday morning is tight. Would the afternoon work?', ko: '목요일 오전은 빠듯합니다. 오후는 괜찮으세요?' },
          { who: 'Colleague', en: 'Two o clock is fine for me.', ko: '저는 2시 괜찮습니다.' },
          { who: 'You', en: 'Let me confirm the room and send an invite.', ko: '회의실을 확인하고 초대를 보내겠습니다.' },
          { who: 'Colleague', en: 'Thanks. Should we invite the client?', ko: '감사합니다. 고객도 초대할까요?' },
          { who: 'You', en: 'Not yet. Let us review internally first, then loop them in.', ko: '아직은요. 우리끼리 먼저 검토하고 나서 공유하죠.' }
        ],
        items: [
          { en: 'Thursday morning is tight.', ko: '목요일 오전은 빠듯합니다.', note: '시간이 부족하다는 우회적 표현입니다' },
          { en: 'Would the afternoon work?', ko: '오후는 괜찮으세요?', note: 'Would + 명사 + work?로 대안을 제시합니다' },
          { en: 'Let me confirm and send an invite.', ko: '확인하고 초대를 보내겠습니다.', note: 'Let me + 동사원형은 즉시 하겠다는 약속입니다' },
          { en: 'Let us review internally first.', ko: '우리끼리 먼저 검토하죠.', note: 'Let us는 함께 하자는 제안입니다' },
          { en: 'Can we move our review to Thursday?', ko: '검토를 목요일로 옮길 수 있을까요?', note: '일정 변경은 Can we move로 시작합니다' },
          { en: 'Let me confirm the room and send an invite.', ko: '회의실을 확인하고 초대를 보내겠습니다.', note: '두 가지를 연달아 하겠다고 약속할 때 씁니다' }
        ]
      },

      /* 8. 이메일 쓰기 */
      {
        id: 'work-writing',
        kind: 'writing',
        level: 'B2',
        title: { ko: '쓰기 — 5줄 이메일 공식', en: 'Writing — the five-line email' },
        intro: {
          ko: '길게 쓰면 읽히지 않습니다. 다섯 줄이면 충분합니다.',
          en: 'Long emails do not get read. Five lines are enough.'
        },
        body: {
          en: [
            'A work email has one job: to make the next action obvious. Everything else is decoration.',
            'Open with why you are writing, state the action, give the deadline, then stop. If you need more than five lines, the request is probably more than one request.'
          ],
          ko: [
            '업무 이메일의 목적은 하나입니다. 다음에 무엇을 해야 하는지 분명하게 만드는 것입니다. 나머지는 장식입니다.',
            '왜 쓰는지로 시작하고, 할 일을 적고, 기한을 붙이고, 끝냅니다. 다섯 줄을 넘는다면 요청이 둘 이상일 가능성이 큽니다.'
          ]
        },
        bullets: [
          { en: 'Line 1 — I am writing about ... / Following our call, ...', ko: '1줄 — 무엇에 관한 메일인지 한 문장으로.' },
          { en: 'Line 2 — Could you ... ? (one action only)', ko: '2줄 — 부탁은 하나만. Could you + 동사원형.' },
          { en: 'Line 3 — If possible by Friday, that would help.', ko: '3줄 — 기한을 부드럽게 붙입니다.' },
          { en: 'Line 4 — Let me know if you need anything from me.', ko: '4줄 — 상대 부담을 낮춥니다.' },
          { en: 'Line 5 — Thanks, and your name.', ko: '5줄 — 맺음말과 이름.' },
          { en: 'Then read it once as the reader — is the action still obvious?', ko: '그다음 받는 사람 입장에서 한 번 읽으세요 — 할 일이 여전히 분명한가요?' }
        ],
        items: [
          { en: 'Following our call, I have attached the summary.', ko: '통화에 이어 요약을 첨부했습니다.', note: '첫 줄 — 대화를 이어받는 표현입니다' },
          { en: 'Could you confirm the numbers by Thursday?', ko: '목요일까지 수치를 확인해 주시겠어요?', note: '둘째 줄 — 요청은 하나만' },
          { en: 'Let me know if you need anything from me.', ko: '제가 도울 일이 있으면 알려 주세요.', note: '넷째 줄 — 상대 부담을 낮춥니다' },
          { en: 'Happy to adjust if the timing does not suit.', ko: '일정이 맞지 않으면 조정하겠습니다.', note: '거절당할 여지를 미리 열어 두는 문장입니다' },
          { en: 'I am writing about the April figures we discussed on Tuesday.', ko: '화요일에 논의한 4월 수치에 대해 쓰고 있습니다.', note: '모범 이메일 1줄 — 왜 쓰는지부터' },
          { en: 'Could you confirm the final numbers by Thursday?', ko: '목요일까지 최종 수치를 확인해 주시겠어요?', note: '모범 이메일 2줄 — 요청은 하나만' }
        ],
        quote: {
          ko: '좋은 업무 메일은 짧고, 요청이 하나이고, 기한이 보입니다.',
          en: 'A good work email is short, asks for one thing, and shows the deadline.'
        }
      },

      /* 9. 듣기·받아쓰기 */
      {
        id: 'work-listening',
        kind: 'listening',
        level: 'B1',
        title: { ko: '듣기·받아쓰기 — 업무 문장 10개', en: 'Listening and dictation — ten work sentences' },
        intro: {
          ko: '실제 회의에서 그대로 나오는 문장입니다. 들리는 대로 적어 보세요.',
          en: 'These come up word for word in real meetings. Write what you hear.'
        },
        dictation: [
          { en: 'Just to confirm, the deadline is next Wednesday.', ko: '확인차 말씀드리면, 마감은 다음 주 수요일입니다.' },
          { en: 'I will send the updated file this afternoon.', ko: '오늘 오후에 수정된 파일을 보내겠습니다.' },
          { en: 'Sorry, could you repeat the last part?', ko: '죄송하지만 마지막 부분을 다시 말씀해 주시겠어요?' },
          { en: 'Let us set up a short call to go over the details.', ko: '세부 내용을 볼 짧은 통화를 잡죠.' },
          { en: 'Both files are in the shared folder now.', ko: '두 파일 모두 지금 공유 폴더에 있습니다.' },
          { en: 'I have pushed the deadline to Friday afternoon.', ko: '마감을 금요일 오후로 미뤄 두었습니다.' },
          { en: 'Could you flag anything that looks risky?', ko: '위험해 보이는 부분이 있으면 알려 주시겠어요?' },
          { en: 'Thanks for the heads-up, I will update the plan.', ko: '미리 알려 주셔서 감사합니다, 계획을 수정하겠습니다.' },
          { en: 'Let me pull up the numbers on my screen.', ko: '제 화면에서 수치를 띄워 보겠습니다.' },
          { en: 'We are running five minutes behind schedule.', ko: '일정보다 오 분 늦어지고 있습니다.' }
        ],
        items: [
          { en: 'Just to confirm, ...', ko: '확인차 말씀드리면', note: '통화·메일 모두에서 재확인할 때 씁니다' },
          { en: 'Could you repeat the last part?', ko: '마지막 부분을 다시 말해 주시겠어요?', note: '못 들었을 때 가장 안전한 문장입니다' },
          { en: 'go over the details', ko: '세부 내용을 훑다', note: 'review보다 회화적입니다' }
        ]
      },

      /* 10. 독해 */
      {
        id: 'work-reading',
        kind: 'reading',
        level: 'B2',
        title: { ko: '독해 — 업무 메일 한 통', en: 'Reading — one short internal email' },
        intro: {
          ko: '학습용으로 새로 쓴 메일입니다. 요청이 몇 가지인지 세면서 읽어 보세요.',
          en: 'A practice email written for this issue. Read it and count how many requests it makes.'
        },
        reading: [
          'Hi Jiwon,',
          'Thanks for the draft you sent yesterday. I went through it quickly and the structure works well, so no need to rework the opening.',
          'Two things before we send it to the client. First, could you replace the March figures with the April ones? The numbers in section two are now out of date. Second, please loop in Dana from design, since the layout questions are hers to answer.',
          'I have copied the client on the timeline only. Nothing goes out until you have had a chance to check the wording, so take the morning if you need it.',
          'Best regards, Chris'
        ],
        items: [
          { en: 'went through it quickly', ko: '빠르게 훑어봤다', meaning: 'read it briefly', example: 'I went through the report on the train.', note: 'go through는 검토하다는 뜻의 기본 동사입니다' },
          { en: 'no need to rework the opening', ko: '도입부를 다시 손댈 필요는 없다', meaning: 'the start is fine as it is', example: 'No need to rewrite the summary.', note: '확인과 안심을 함께 주는 문장입니다' },
          { en: 'out of date', ko: '시효가 지난', meaning: 'no longer correct', example: 'That price list is out of date.', note: 'up to date는 반대말입니다' },
          { en: 'are hers to answer', ko: '그녀가 답할 몫이다', meaning: 'she is the one responsible', example: 'The budget questions are hers to answer.', note: '담당을 분명히 하는 표현입니다' }
        ],
        bullets: [
          { en: 'Answer with a number — The email asks for two things.', ko: '숫자로 답하세요 — The email asks for two things.' },
          { en: 'Answer with the action — She has to replace the figures.', ko: '할 일로 답하세요 — She has to replace the figures.' },
          { en: 'Answer with the reason — The sender leaves time because...', ko: '이유로 답하세요 — The sender leaves time because...' }
        ],
        questions: [
          { ko: '이 메일이 요청하는 일은 정확히 몇 가지인가요?', en: 'Exactly how many things does the email ask for?' },
          { ko: '보내는 사람이 시간을 준 이유는 무엇인가요?', en: 'Why does the sender leave time before anything goes out?' },
          { ko: '도입부를 그대로 둬도 된다고 밝힌 이유는 무엇일까요?', en: 'Why does the sender say the opening does not need reworking?' },
          { ko: '이 메일을 두 줄로 줄인다면 무엇을 남기겠어요?', en: 'If you cut this email to two lines, what would you keep?' },
          { ko: '답장에 반드시 들어가야 할 정보 두 가지는 무엇인가요?', en: 'Which two pieces of information must your reply contain?' },
          { ko: '이 메일에서 고객에게 공유된 것과 공유되지 않은 것을 구분해 보세요.', en: 'Work out what has and has not been shared with the client.' }
        ]
      },

      /* 11. 토론 */
      {
        id: 'work-discussion',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '토론 — 일과 영어에 대한 10가지 질문', en: 'Discussion — ten questions about work and English' },
        questions: [
          { ko: '영어 회의에서 가장 말하기 어려운 순간은 언제인가요?', en: 'When is speaking up hardest for you in an English meeting?' },
          { ko: '정중함과 솔직함 중 어느 쪽이 더 어렵나요?', en: 'Which is harder for you, being polite or being direct?' },
          { ko: '이메일을 영어로 쓸 때 시간이 가장 오래 걸리는 부분은 어디인가요?', en: 'Which part of writing an English email takes you longest?' },
          { ko: '모르는 단어가 나왔을 때 어떻게 넘기나요?', en: 'How do you move past a word you do not know?' },
          { ko: '업무 영어를 늘리는 현실적인 방법은 무엇일까요?', en: 'What is a realistic way to grow your work English?' },
          { ko: '영어 메일을 쓰고 나서 다시 읽고 고치는 편인가요?', en: 'Do you reread and edit your English emails before sending?' },
          { ko: '회의에서 한 번도 말하지 못하고 끝난 적이 있다면, 무엇이 막았나요?', en: 'If you have left a meeting without speaking, what stopped you?' },
          { ko: '내일 바로 써 볼 문장 하나를 이번 주에서 고른다면 무엇인가요?', en: 'Which single line from this week would you use tomorrow?' },
          { ko: '동료에게 영어로 부탁할 때 어느 표현을 가장 자주 쓰나요?', en: 'Which request pattern do you use most with colleagues in English?' },
          { ko: '영어 메일을 쓰는 시간을 절반으로 줄인다면 무엇을 바꾸겠어요?', en: 'What would you change to write English emails in half the time?' }
        ],
        bullets: [
          { en: 'To open a meeting — Shall we start with the first item?', ko: '회의를 열 때 — Shall we start with the first item?' },
          { en: 'To disagree safely — I see the benefit, but...', ko: '안전하게 반대할 때 — I see the benefit, but...' },
          { en: 'To ask for time — Can I come back to you on that?', ko: '시간을 벌 때 — Can I come back to you on that?' },
          { en: 'To close — Let us summarise the action items.', ko: '맺을 때 — Let us summarise the action items.' }
        ]
      },

      /* 12. 문화 */
      {
        id: 'work-culture',
        kind: 'culture',
        level: 'B2',
        title: { ko: '문화 — 이름을 부르는 거리', en: 'Culture — how close a name sounds' },
        intro: {
          ko: '영어권 회사에서는 직함보다 이름을 먼저 씁니다. 다만 부르는 방식에는 아직 단계가 있습니다.',
          en: 'English-speaking offices put first names before titles, but there is still a ladder in how you address people.'
        },
        body: {
          en: [
            'An email greeting is not a formality to get past. It tells the reader how close the two of you are, and getting it wrong is the first thing people notice about non-native writing.',
            '**Dear plus a title** is for people you have never met, or for anything that may be forwarded to a client. **Hi plus a first name** is the normal working tone, and it is safe with almost everyone once you have exchanged one message.',
            'The closing line matters less than the opening, but it follows the same logic: **Best regards** is neutral and always safe, while **Thanks** alone is fine when you are asking for something.'
          ],
          ko: [
            '메일 첫 인사는 넘겨야 할 형식이 아니라, 두 사람이 얼마나 가까운지를 알려 주는 신호입니다. 이 한 줄을 잘못 고르면 원어민이 가장 먼저 알아챕니다.',
            '**Dear + 직함**은 한 번도 만난 적 없는 상대, 또는 고객에게 전달될 수 있는 메일에 씁니다. **Hi + 이름**은 업무의 기본 온도이고, 한 번이라도 메일을 주고받았다면 대부분 안전합니다.',
            '맺음말은 첫 줄보다 중요도가 낮지만 규칙은 같습니다. **Best regards**는 중립적이라 언제나 안전하고, 부탁을 하는 메일이라면 **Thanks**만으로도 충분합니다.'
          ]
        },
        items: [
          { en: 'Hi Chris,', ko: '크리스님,', meaning: 'a normal, neutral opening', example: 'Hi Chris, thanks for the note.', note: '업무 메일의 기본 인사입니다' },
          { en: 'Dear Ms Park,', ko: '박 부장님께,', meaning: 'formal, first contact', example: 'Dear Ms Park, I am writing about the proposal.', note: '모르는 상대나 첫 메일에 씁니다' },
          { en: 'first-name basis', ko: '이름을 부르는 사이', meaning: 'close enough to use first names', example: 'We are on a first-name basis now.', note: '관계의 가까움을 나타내는 관용 표현입니다' },
          { en: 'by their job title', ko: '직함으로 부르는', meaning: 'using the role instead of the name', example: 'In some teams people are called by their job title.', note: '문화에 따라 이름과 직함 중 무엇을 앞세우는지가 다릅니다' },
          { en: 'Best regards,', ko: '감사합니다,', meaning: 'a neutral, safe closing', example: 'Best regards, Chris', note: '모르는 상대에게도 안전한 맺음말입니다' },
          { en: 'Thanks,', ko: '감사합니다,', meaning: 'a short closing when asking for something', example: 'Thanks, Jiwon', note: '부탁을 한 메일에 잘 맞습니다' }
        ],
        quote: {
          ko: '처음에는 격식으로, 익숙해지면 이름으로. 상대가 먼저 낮추면 따라가면 됩니다.',
          en: 'Start formal, move to first names. When the other side moves first, follow.'
        }
      },

      /* 13. 확인 문제 */
      {
        id: 'work-quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 16문항', en: 'Quiz — sixteen questions' },
        quiz: [
          {
            q: { ko: '가장 정중한 부탁은 어느 것인가요?', en: 'Which request is the softest?' },
            options: ['Send me the file.', 'Can you send me the file?', 'Would you mind sending me the file?', 'I want the file.'],
            answer: 2,
            explain: {
              ko: 'Would you mind + -ing가 가장 부드러운 형태입니다.',
              en: 'Would you mind plus -ing is the softest of these.'
            }
          },
          {
            q: { ko: '"마감을 지키다"에 맞는 조합은?', en: 'Which is the correct collocation for finishing on time?' },
            options: ['keep a deadline', 'meet a deadline', 'do a deadline', 'take a deadline'],
            answer: 1,
            explain: {
              ko: 'meet a deadline이 표준입니다.',
              en: 'We meet a deadline. The others are not used.'
            }
          },
          {
            q: { ko: '"나중에 다시 논의하죠"에 해당하는 표현은?', en: 'Which phrasal verb means to discuss it later?' },
            options: ['circle back', 'reach out', 'take over', 'follow up'],
            answer: 0,
            explain: {
              ko: 'circle back이 나중에 다시 논의한다는 뜻입니다.',
              en: 'Circle back means to return to the topic later.'
            }
          },
          {
            q: { ko: '"현재 상황을 계속 공유받는" 상태를 뜻하는 표현은?', en: 'Which idiom means being kept informed?' },
            options: ['out of the loop', 'in the loop', 'on the same page', 'ballpark figure'],
            answer: 1,
            explain: {
              ko: 'in the loop가 정답이고, 반대는 out of the loop입니다.',
              en: 'In the loop means informed. The opposite is out of the loop.'
            }
          },
          {
            q: { ko: '다섯 줄 이메일에서 둘째 줄에 와야 하는 것은?', en: 'What belongs in the second line of a five-line email?' },
            options: [
              { ko: '인사말', en: 'A greeting' },
              { ko: '요청 한 가지', en: 'One request' },
              { ko: '첨부 안내', en: 'A note about attachments' },
              { ko: '서명', en: 'A signature' }
            ],
            answer: 1,
            explain: {
              ko: '둘째 줄에 요청을 하나만 둡니다. 요청이 많으면 답장이 늦어집니다.',
              en: 'One single request goes in line two. More requests mean slower replies.'
            }
          },
          {
            q: { ko: '"우려를 제기하다"의 올바른 동사는?', en: 'Which verb goes with a concern?' },
            options: ['say', 'raise', 'tell', 'speak'],
            answer: 1,
            explain: {
              ko: 'raise a concern이 맞습니다.',
              en: 'Raise a concern is the standard pairing.'
            }
          },
          {
            q: { ko: 'Would you mind ___ this by Friday? 빈칸에 알맞은 것은?', en: 'Which form fits? Would you mind ___ this by Friday?' },
            options: ['check', 'checking', 'to check', 'checked'],
            answer: 1,
            explain: {
              ko: 'Would you mind 뒤에는 -ing가 옵니다.',
              en: 'After would you mind, the verb takes an -ing form.'
            }
          },
          {
            q: { ko: '미리 알려 줘서 고맙다는 표현은?', en: 'Which line thanks someone for an early warning?' },
            options: ['Thanks for the heads-up.', 'Thanks for the takeaway.', 'Thanks for the handover.', 'Thanks for the bandwidth.'],
            answer: 0,
            explain: {
              ko: 'a heads-up은 미리 알리는 것입니다. takeaway는 핵심 요점입니다.',
              en: 'A heads-up is an early warning. A takeaway is the main point to remember.'
            }
          },
          {
            q: { ko: '회의록에서 할 일 항목을 뜻하는 말은?', en: 'Which word names a task that someone must do?' },
            options: ['action item', 'takeaway', 'blocker', 'scope'],
            answer: 0,
            explain: {
              ko: 'action item이 맞습니다. blocker는 진행을 막는 문제입니다.',
              en: 'An action item is a task. A blocker is something that stops progress.'
            }
          },
          {
            q: { ko: '위험을 미리 알려 달라고 할 때 알맞은 구동사는?', en: 'Which phrasal verb means to point something out for attention?' },
            options: ['sign off on', 'flag up', 'roll out', 'take over'],
            answer: 1,
            explain: {
              ko: 'flag up은 문제로 알리다입니다. sign off on은 승인하다입니다.',
              en: 'Flag up is to point something out. Sign off on is to give approval.'
            }
          },
          {
            q: { ko: '출시를 일주일 미룬다는 올바른 문장은?', en: 'Which sentence correctly says the launch moves a week later?' },
            options: ['We push back the launch by a week.', 'We push up the launch by a week.', 'We put off the launch on a week.', 'We pull the launch of a week.'],
            answer: 0,
            explain: {
              ko: '일정을 미룰 때는 push back + 기간입니다.',
              en: 'To move a date later, use push back plus a period of time.'
            }
          },
          {
            q: { ko: '회의를 진행한다는 올바른 동사는?', en: 'Which verb goes with a meeting when you lead it?' },
            options: ['do', 'run', 'take', 'play'],
            answer: 1,
            explain: {
              ko: 'run a meeting이 표준이고, set up a meeting은 회의를 잡는 것입니다.',
              en: 'You run a meeting. You set up a meeting when you arrange it.'
            }
          },
          {
            q: { ko: '"회의 안건"을 영어로 하면?', en: 'What do you call the list of things to discuss?' },
            options: ['agenda', 'attendee', 'minutes', 'bandwidth'],
            answer: 0,
            explain: {
              ko: 'agenda가 안건 목록입니다. minutes는 회의록입니다.',
              en: 'The agenda is the list. Minutes are the written record afterwards.'
            }
          },
          {
            q: { ko: '"남은 항목을 다음 주로 넘기자"는 어느 것인가요?', en: 'Which means moving the rest to next week?' },
            options: ['carry it over', 'carry it out', 'carry it on', 'carry it up'],
            answer: 0,
            explain: {
              ko: 'carry over는 다음 기간으로 넘기다이고, carry out은 실행하다입니다.',
              en: 'Carry over means moving to the next period. Carry out means doing it.'
            }
          },
          {
            q: { ko: '"목표를 달성하다"에 맞는 연어는?', en: 'Which collocation means reaching a goal?' },
            options: ['hit a target', 'beat a target', 'make a target', 'do a target'],
            answer: 0,
            explain: {
              ko: 'hit a target 또는 reach a target만 씁니다.',
              en: 'You hit or reach a target. The others are not used.'
            }
          },
          {
            q: { ko: '처음 만나는 고객에게 안전한 인사는?', en: 'Which greeting is safest for a client you have never met?' },
            options: ['Hi Chris,', 'Dear Ms Park,', 'Hey there,', 'Yo,'],
            answer: 1,
            explain: {
              ko: '한 번도 만난 적 없는 상대는 Dear + 직함이 안전합니다.',
              en: 'Dear plus a title is safe for first contact.'
            }
          }
        ]
      },

      /* 13-2. 유머 */
      {
        id: 'work-humor',
        kind: 'humor',
        level: 'B1',
        title: { ko: '유머 — 회의에 관한 농담', en: 'Humour — a joke about meetings' },
        intro: {
          ko: '직장 유머는 대개 회의와 이메일에서 나옵니다. 조동사와 시제가 웃음을 만듭니다.',
          en: 'Workplace humour is mostly about meetings and email, and it turns on modals and tenses.'
        },
        body: {
          en: [
            '**A:** "This meeting could have been an email."  **B:** "And this email could have been a chat message."',
            'The joke works because could have been quietly claims that everyone already knew the answer. The grammar is half the joke, so say the full form, not coulda.'
          ],
          ko: [
            '**A:** "이 회의는 이메일이면 됐을 텐데."  **B:** "그 이메일도 채팅 한 줄이면 됐을 텐데."',
            'could have been이라는 형태가 "모두가 답을 알고 있었다"는 뉘앙스를 슬쩍 넣기 때문에 웃음이 납니다. 문법이 농담의 절반이므로 coulda로 줄이지 말고 풀어서 말하세요.'
          ]
        },
        items: [
          { en: 'This meeting could have been an email.', ko: '이 회의는 이메일이면 됐을 텐데.', meaning: 'the meeting was unnecessary', example: 'Another meeting that could have been an email.', note: 'could have been은 ~이면 됐을 텐데입니다' },
          { en: 'Let us take this offline.', ko: '이건 따로 이야기하죠.', meaning: 'to stop discussing it in the meeting', example: 'Good point, let us take this offline.', note: '회의에서 논의를 끊는 정중한 표현입니다' },
          { en: 'Per my last email.', ko: '앞서 보낸 메일에 적었듯이.', meaning: 'as I already wrote', example: 'Per my last email, the deadline is Friday.', note: '무뚝뚝한 회신에서 자주 보이는 표현입니다' },
          { en: 'Just circling back.', ko: '다시 한번 여쭙니다.', meaning: 'a gentle reminder', example: 'Just circling back on my question below.', note: '재촉 메일의 부드러운 첫 줄입니다' }
        ],
        quote: {
          ko: '직장 유머의 핵심은 과장이 아니라, 모두가 아는 사실을 정확한 문법으로 말하는 것입니다.',
          en: 'Work humour is not exaggeration. It is saying what everyone knows in exact grammar.'
        }
      },

      /* 14. 해설 노트 */
      {
        id: 'work-note',
        kind: 'note',
        level: 'B1',
        title: { ko: '해설 노트 — 직장 영어의 함정', en: 'Notes — traps in work English' },
        bullets: [
          { en: '**Do not translate Korean politeness directly** — honorifics become modals in English.', ko: '**한국어 존댓말을 그대로 옮기지 마세요** — 영어에서는 조동사가 그 역할을 합니다.' },
          { en: '**One email, one request** — two requests usually get one reply.', ko: '**메일 하나에 요청 하나** — 요청이 둘이면 답장은 하나만 옵니다.' },
          { en: '**Escalate is neutral** — it means raising an issue, not making it worse.', ko: '**escalate는 중립적입니다** — 문제를 키우는 것이 아니라 위로 올린다는 뜻입니다.' },
          { en: '**Bandwidth is about time, not the network** — it is normal in meetings.', ko: '**bandwidth는 시간 여력** — 회의에서 자연스럽게 쓰는 비유입니다.' },
          { en: '**Ask again politely** — Could you repeat the last part? is always acceptable.', ko: '**다시 묻는 것은 실례가 아닙니다** — 마지막 부분을 다시 말해 달라고 해도 됩니다.' },
          { en: '**Would you mind takes -ing** — this is the single most common request error.', ko: '**Would you mind 뒤에는 -ing** — 부탁 문장에서 가장 흔한 오류입니다.' },
          { en: '**Start formal, move down** — Hi is safe after one exchange, Dear is safe before it.', ko: '**처음에는 격식으로, 그다음 이름으로** — 한 번 주고받기 전에는 Dear가 안전합니다.' },
          { en: '**Say the number out loud** — deadlines that are only written are the ones that get missed.', ko: '**날짜는 소리 내어 읽으세요** — 눈으로만 본 기한은 놓치기 쉬운 기한입니다.' },
          { en: '**Agenda is the list, minutes are the record** — the two are never swapped.', ko: '**agenda는 안건, minutes는 회의록** — 바꿔 쓰지 않습니다.' },
          { en: '**Hit a target, meet a deadline** — the verbs are fixed, so learn them as pairs.', ko: '**목표는 hit, 마감은 meet** — 동사가 고정이므로 짝으로 외웁니다.' },
          { en: '**Carry over means next period** — the politest way to say something was delayed.', ko: '**carry over는 다음 기간으로** — 미뤄졌다는 뜻을 가장 정중하게 전하는 표현입니다.' },
          { en: '**End with a falling tone** — a rising tone makes people wait for the rest of the sentence.', ko: '**문장 끝은 내림조로** — 오르막조로 끝나면 상대는 아직 말이 남은 줄 압니다.' }
        ]
      }
    ]
  },

  /* ══ 1주 — 여행 영어 (발행) ═════════════════════════════════════════════ */
  {
    week: 1,
    slug: 'week-01',
    quarter: 1,
    published: '2026-07',
    level: 'B1',
    theme: { ko: '여행 영어', en: 'Travel English' },
    title: {
      ko: '공항에서 호텔까지, 여행 영어 한 호',
      en: 'From airport to hotel — one issue of travel English'
    },
    summary: {
      ko: '여행에서 실제로 쓰는 표현만 모았습니다. 학습목표, 테마 어휘 16개, 문법 1가지, 구동사 12개, 연어 10개, 발음 10개, 이디엄 10개, 대화 3장, 받아쓰기 10문장, 독해 1편과 모범 표현, 모범 답안이 있는 예약 메일 쓰기, 토론 질문 10개, 확인 문제 16개.',
      en: 'Only the expressions you actually use on a trip: learning goals, sixteen theme words, one grammar point, twelve phrasal verbs, ten collocations, ten pronunciation points, ten idioms, three dialogues, ten dictation lines, one reading passage with model expressions, a booking email task with a model answer, ten discussion questions and sixteen quiz items.'
    },

    sections: [
      /* ── 0. 학습목표 ──────────────────────────────────────────────── */
      {
        id: 'travel-goals',
        kind: 'goals',
        level: 'B1',
        title: { ko: '이 주의 학습목표', en: 'What you will be able to do this week' },
        intro: {
          ko: '이 주를 마치면 아래 네 가지를 영어로 할 수 있게 됩니다. 읽기 전에 한 번, 다 읽고 한 번 확인하세요.',
          en: 'By the end of this week you should be able to do the four things below. Check them once before you read and once after.'
        },
        bullets: [
          { en: 'Get sixteen airport and hotel words and twelve phrasal verbs into your mouth.', ko: '공항·호텔에서 쓰는 16단어와 구동사 12개를 입에 붙입니다.' },
          { en: 'Choose between the present perfect and the past simple while you are speaking.', ko: '말하는 도중에 현재완료와 과거시제를 골라 씁니다.' },
          { en: 'Catch the numbers, gates and times in an announcement, and pull the key details out of a booking email.', ko: '안내 방송의 숫자·게이트·시간을 놓치지 않고, 예약 메일에서 핵심 정보를 골라냅니다.' },
          { en: 'Keep a check-in or taxi exchange going for three sentences or more.', ko: '체크인이나 택시에서 세 문장 이상 주고받습니다.' }
        ],
        quote: {
          ko: '목표는 아는 단어 수가 아니라 입 밖으로 나오는 문장 수입니다.',
          en: 'The goal is not the number of words you know, but the sentences that come out of your mouth.'
        }
      },

      /* ── 1. 테마 어휘 ─────────────────────────────────────────────── */
      {
        id: 'theme-words',
        kind: 'vocabulary',
        level: 'A2',
        title: { ko: '테마 어휘 — 여행 필수 16단어', en: 'Theme words — sixteen you need for travel' },
        intro: {
          ko: '이 열여섯 개만 손에 익히면 여행 중 대부분의 상황을 문장으로 만들 수 있습니다. 뉴스와 달리 여행 어휘는 빈도가 아니라 상황에 묶여 있어서, 상황별로 덩어리째 외우는 편이 빠릅니다.',
          en: 'Get these sixteen into your hands and you can build most travel sentences. Travel words are tied to situations rather than frequency, so learn them situation by situation.'
        },
        items: [
          { en: 'itinerary', ko: '여행 일정표', meaning: 'a plan of a journey', example: 'Do you have the itinerary?', note: '복수형은 itineraries입니다' },
          { en: 'boarding pass', ko: '탑승권', meaning: 'the card that lets you board', example: 'Could I see your boarding pass?', note: '모바일 탑승권은 mobile boarding pass입니다' },
          { en: 'layover', ko: '경유 대기', meaning: 'a wait between flights', example: 'I have a three-hour layover in Tokyo.', note: 'stopover는 하루 이상 머무는 경유입니다' },
          { en: 'check-in', ko: '체크인, 수속', meaning: 'the process of registering', example: 'Online check-in opens tomorrow.', note: '명사와 동사로 모두 씁니다' },
          { en: 'customs', ko: '세관', meaning: 'the place that inspects goods', example: 'We went through customs quickly.', note: '항상 복수로 씁니다' },
          { en: 'departure', ko: '출발', meaning: 'the act of leaving', example: 'The departure gate changed to 42.', note: '반대말은 arrival입니다' },
          { en: 'aisle seat', ko: '통로 좌석', meaning: 'a seat next to the walkway', example: 'An aisle seat, please.', note: 'aisle은 s를 소리 내지 않습니다' },
          { en: 'carry-on', ko: '기내 수하물', meaning: 'a bag you take on board', example: 'This is my carry-on only.', note: 'checked baggage는 부치는 짐입니다' },
          { en: 'stopover', ko: '경유 체류', meaning: 'a longer stay between flights', example: 'We had a stopover of two days in Istanbul.', note: 'layover보다 길게 머무를 때 씁니다' },
          { en: 'baggage claim', ko: '수하물 찾는 곳', meaning: 'the area where bags arrive', example: 'Let us meet at baggage claim.', note: 'baggage는 셀 수 없는 명사입니다' },
          { en: 'window seat', ko: '창가 좌석', meaning: 'a seat beside the window', example: 'I would prefer a window seat.', note: '복도는 aisle, 가운데는 middle seat입니다' },
          { en: 'jet lag', ko: '시차 피로', meaning: 'tiredness after crossing time zones', example: 'Jet lag hit me on the second day.', note: 'I am jet-lagged처럼 형용사로도 씁니다' },
          { en: 'immigration', ko: '입국 심사', meaning: 'the border check for people', example: 'We waited at immigration for an hour.', note: '사람 검사는 immigration, 물건 검사는 customs입니다' },
          { en: 'connecting flight', ko: '환승편', meaning: 'the flight you take after the first one', example: 'Our connecting flight leaves at nine.', note: '환승 대기 시간은 layover입니다' },
          { en: 'travel insurance', ko: '여행자 보험', meaning: 'cover for problems on a trip', example: 'Travel insurance covered the delay.', note: '보험 증서는 travel insurance policy입니다' },
          { en: 'souvenir', ko: '기념품', meaning: 'something you bring back from a trip', example: 'I bought souvenirs for the family.', note: '발음은 수브니어에 가깝습니다' }
        ]
      },

      /* ── 2. 문법 ──────────────────────────────────────────────────── */
      {
        id: 'grammar',
        kind: 'grammar',
        level: 'B1',
        title: { ko: '문법 — 경험은 현재완료로 말합니다', en: 'Grammar — talk about experience with the present perfect' },
        intro: {
          ko: '여행 경험을 말할 때 한국어 습관대로 과거시제를 쓰면 어색해집니다.',
          en: 'Korean speakers often reach for the past simple here, and it sounds off.'
        },
        body: {
          en: [
            'Use the present perfect (have + past participle) for experience up to now. When it happened is not the point.',
            'The moment you say when, the past simple takes over. Compare the two sentences side by side.',
            '**Where the mistake happens** — Korean has no present perfect, so the past simple feels safe. In travel talk, the first sentence of a story should usually be **I have been**, not I went.'
          ],
          ko: [
            '지금까지의 경험을 말할 때는 현재완료(have + p.p.)를 씁니다. 언제였는지는 중요하지 않습니다.',
            '언제였는지를 말하는 순간 기준이 그 시점이 되므로 과거시제를 씁니다. 두 문장을 나란히 비교해 보세요.',
            '**실수가 생기는 자리** — 한국어에는 현재완료가 없어서 과거시제가 안전해 보입니다. 여행 이야기의 첫 문장은 보통 **I have been**, 곧 가본 적 있다로 시작합니다.'
          ]
        },
        table: {
          caption: { ko: '자주 쓰는 불규칙 동사', en: 'Common irregular verbs' },
          head: [{ ko: '동사', en: 'Base' }, { ko: '과거', en: 'Past' }, { ko: '과거분사', en: 'Past participle' }],
          rows: [
            ['go', 'went', 'gone'],
            ['fly', 'flew', 'flown'],
            ['take', 'took', 'taken'],
            ['see', 'saw', 'seen'],
            ['be', 'was / were', 'been']
          ]
        },
        items: [
          { en: 'I have been to Japan twice.', ko: '나는 일본에 두 번 가본 적이 있다.', note: '경험 → 현재완료', meaning: 'experience with no time stated' },
          { en: 'I went to Japan in 2024.', ko: '나는 2024년에 일본에 갔다.', note: '시점을 말하면 → 과거시제', meaning: 'a finished trip at a known time' },
          { en: 'Have you ever been abroad?', ko: '해외에 가본 적 있나요?', note: 'ever는 지금까지 한 번이라도', meaning: 'at any time up to now' },
          { en: 'I have never flown alone.', ko: '나는 혼자 비행기를 타본 적이 없다.', note: 'never는 한 번도', meaning: 'not once in my life' },
          { en: 'How many times have you been there?', ko: '거기 몇 번 가봤어요?', note: '횟수를 묻는 질문은 현재완료입니다', meaning: 'asking about the number of visits' },
          { en: 'I have just arrived at the hotel.', ko: '막 호텔에 도착했습니다.', note: 'just는 방금 — 도착 직후에 씁니다', meaning: 'something happened a moment ago' }
        ],
        quote: {
          ko: '경험에는 시점이 없고, 시점을 말하면 경험이 사라집니다.',
          en: 'Experience has no date. Say the date and the experience becomes an event.'
        }
      },

      /* ── 3. 구동사 ───────────────────────────────────────────────── */
      {
        id: 'travel-phrasal',
        kind: 'phrasal',
        level: 'B1',
        title: { ko: '구동사 — 공항과 호텔에서 12개', en: 'Phrasal verbs — twelve for airports and hotels' },
        intro: {
          ko: '안내 방송과 직원이 실제로 쓰는 동사들입니다.',
          en: 'These are the verbs in announcements and at the front desk.'
        },
        items: [
          { en: 'check in', ko: '체크인하다', meaning: 'to register on arrival', example: 'We checked in two hours early.', note: '호텔과 공항 모두에 씁니다' },
          { en: 'set off', ko: '출발하다', meaning: 'to start a journey', example: 'We set off before sunrise.', note: '영국에서 특히 자주 씁니다' },
          { en: 'get around', ko: '돌아다니다', meaning: 'to travel within a place', example: 'It is easy to get around by metro.', note: '교통 수단과 함께 씁니다' },
          { en: 'pick up', ko: '데리러 가다, 찾다', meaning: 'to collect or fetch', example: 'Could you pick me up at eight?', note: '사람과 물건 모두에 씁니다' },
          { en: 'drop off', ko: '내려 주다, 맡기다', meaning: 'to take something somewhere', example: 'The shuttle drops you off at terminal two.', note: 'pick up의 반대입니다' },
          { en: 'look forward to', ko: '기대하다', meaning: 'to wait for something happily', example: 'I am looking forward to the trip.', note: 'to 뒤에 명사나 -ing가 옵니다' },
          { en: 'check out', ko: '체크아웃하다', meaning: 'to leave a hotel and settle the bill', example: 'We check out at eleven.', note: '살펴보다라는 뜻도 있으니 문맥을 보세요' },
          { en: 'stop by', ko: '잠깐 들르다', meaning: 'to visit briefly on the way', example: 'Could we stop by the ticket office?', note: 'pop in보다 목적지에 가는 길에 들른다는 느낌입니다' },
          { en: 'end up', ko: '결국 ~하게 되다', meaning: 'to arrive somewhere or do something in the end', example: 'We ended up walking to the hotel.', note: '계획과 달라진 결과를 말할 때 씁니다' },
          { en: 'take off', ko: '이륙하다', meaning: 'to leave the ground', example: 'The plane took off an hour late.', note: '벗다라는 뜻도 있습니다. 문맥으로 구분하세요' },
          { en: 'see off', ko: '배웅하다', meaning: 'to go and say goodbye to someone leaving', example: 'We went to the station to see him off.', note: '떠나는 사람보다 배웅하는 사람이 씁니다' },
          { en: 'get in', ko: '도착하다', meaning: 'to arrive, for trains and planes', example: 'Our train gets in at seven.', note: '기차·비행기 도착에 씁니다. get off는 내리는 것입니다' }
        ]
      },

      /* ── 4. 연어 ─────────────────────────────────────────────────── */
      {
        id: 'travel-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 여행에서 틀리기 쉬운 10쌍', en: 'Collocations — ten pairs travellers get wrong' },
        items: [
          { en: 'catch a flight', ko: '비행기를 타다', meaning: 'to be in time for a flight', example: 'I have to catch a flight at six.', note: 'take a flight도 쓰지만 catch가 시간 맞춰 탄다는 뉘앙스입니다' },
          { en: 'book a room', ko: '방을 예약하다', meaning: 'to reserve a room', example: 'I booked a room for three nights.', note: 'reserve a room도 맞습니다' },
          { en: 'miss a connection', ko: '환승을 놓치다', meaning: 'to be too late for the next flight', example: 'We missed the connection in Doha.', note: '연결편은 connection입니다' },
          { en: 'get a refund', ko: '환불받다', meaning: 'to receive your money back', example: 'Can I get a refund for this ticket?', note: '환불은 refund, 교환은 exchange입니다' },
          { en: 'pay in cash', ko: '현금으로 내다', meaning: 'to pay with notes and coins', example: 'Do you take cards, or should I pay in cash?', note: 'by card, in cash로 전치사가 다릅니다' },
          { en: 'make a reservation', ko: '예약하다', meaning: 'to arrange in advance', example: 'I made a reservation under Kim.', note: '식당에서는 reservation, 숙소에서는 booking도 씁니다' },
          { en: 'check the luggage', ko: '짐을 부치다', meaning: 'to hand your bags to the airline', example: 'We checked the luggage at the counter.', note: 'have your bags checked도 같은 뜻입니다' },
          { en: 'take a taxi', ko: '택시를 타다', meaning: 'to travel by taxi', example: 'Let us take a taxi from the station.', note: 'ride a taxi는 쓰지 않습니다. take 또는 get을 씁니다' },
          { en: 'board a plane', ko: '비행기에 탑승하다', meaning: 'to get on a plane', example: 'We boarded the plane an hour early.', note: '비행기·기차는 board, 택시는 take를 씁니다' },
          { en: 'go through customs', ko: '세관을 통과하다', meaning: 'to pass the border check for goods', example: 'We went through customs in ten minutes.', note: '통과하다는 go through로 고정입니다' }
        ]
      },

      /* ── 5. 발음 ─────────────────────────────────────────────────── */
      {
        id: 'travel-pron',
        kind: 'pronunciation',
        level: 'B1',
        title: { ko: '발음 — 공항 방송을 알아듣는 법', en: 'Pronunciation — hearing the airport announcements' },
        intro: {
          ko: '방송이 안 들리는 이유는 대개 속도가 아니라 연결과 축약입니다.',
          en: 'Announcements do not fail because of speed, but because of linking and reduction.'
        },
        items: [
          { en: 'Gate forty-two is now boarding.', ko: '42번 게이트 탑승을 시작합니다.', note: 'now boarding은 "나우보딩"처럼 붙어 들립니다.' },
          { en: 'Please have your passport ready.', ko: '여권을 준비해 주세요.', note: 'have your는 "해뷰"에 가깝게 들립니다.' },
          { en: 'This is the final call for flight 802.', ko: '802편 마지막 안내입니다.', note: 'final call은 마지막 탑승 안내라는 뜻입니다.' },
          { en: 'We are now boarding rows twenty to thirty.', ko: '이십 열부터 삼십 열까지 탑승합니다.', note: '숫자 뒤 rows를 놓치면 순서를 알 수 없습니다.' },
          { en: 'The flight has been delayed by an hour.', ko: '항공편이 한 시간 지연되었습니다.', note: 'has been delayed는 수동태 현재완료입니다.' },
          { en: 'Passengers for Seoul, please proceed to gate twelve.', ko: '서울행 승객은 12번 게이트로 가 주세요.', note: 'proceed to는 방송에서 가장 자주 나오는 지시 동사입니다.' },
          { en: 'Boarding will begin in about ten minutes.', ko: '약 십 분 뒤 탑승을 시작합니다.', note: 'will begin은 약하게, ten minutes에 강세가 갑니다.' },
          { en: 'Please keep your seatbelt fastened.', ko: '좌석벨트를 계속 매 주세요.', note: 'keep + 목적어 + 과거분사 형태입니다.' },
          { en: 'Your baggage is now available at carousel six.', ko: '수하물은 이제 6번 회전대에서 찾을 수 있습니다.', note: 'carousel은 수하물 회전대입니다. available은 "에블"로 짧게 들립니다.' },
          { en: 'We apologise for the delay and expect to board shortly.', ko: '지연되어 사과드리며 곧 탑승을 시작할 예정입니다.', note: 'apologise는 영국식 철자이고, shortly는 곧이라는 뜻입니다.' }
        ],
        bullets: [
          { en: 'Numbers, gates and times are stressed. Everything else is fast.', ko: '숫자·게이트·시간만 또렷합니다. 나머지는 빠르게 지나갑니다.' },
          { en: 'Listen for the verb first: boarding, delayed, cancelled.', ko: '동사부터 들으세요. boarding, delayed, cancelled 중 무엇인지가 핵심입니다.' },
          { en: 'Stress hits the key word: FINAL call, BOARDING pass, GATE twelve.', ko: '핵심 단어에 강세가 갑니다. FINAL call, BOARDING pass, GATE twelve.' }
        ]
      },

      /* ── 6. 이디엄 ────────────────────────────────────────────────── */
      {
        id: 'idioms',
        kind: 'idioms',
        level: 'B1',
        title: { ko: '이디엄 — 이동과 여행의 10가지', en: 'Idioms — ten for travel and moving around' },
        intro: {
          ko: '직역하면 뜻이 통하지 않습니다. 통째로 외우는 편이 빠릅니다.',
          en: 'Word-for-word translation will not help. Learn these as single chunks.'
        },
        items: [
          { en: 'get itchy feet', ko: '여행이 가고 싶어지다', meaning: 'to want to travel', example: 'I get itchy feet every spring.', note: '발이 근질거린다는 이미지에서 온 표현입니다' },
          { en: 'hit the road', ko: '길을 나서다', meaning: 'to start driving or travelling', example: 'Let us hit the road before the traffic builds up.', note: '아침 출발을 재촉할 때 씁니다' },
          { en: 'travel light', ko: '짐을 가볍게 하다', meaning: 'to take very little luggage', example: 'Travel light and you will move faster.', note: '짐을 줄이라는 조언으로 자주 들립니다' },
          { en: 'off the beaten track', ko: '외진 곳의', meaning: 'away from the usual tourist places', example: 'We stayed somewhere off the beaten track.', note: 'beaten track은 사람들이 다니는 길입니다' },
          { en: 'in the middle of nowhere', ko: '외딴 곳에', meaning: 'far from any town', example: 'The hotel was in the middle of nowhere.', note: '불평과 감탄 두 가지로 모두 씁니다' },
          { en: 'live out of a suitcase', ko: '여행 다니며 지내다', meaning: 'to travel constantly', example: 'I have been living out of a suitcase all month.', note: '출장이 잦은 사람에게 씁니다' },
          { en: 'a stones throw', ko: '아주 가까운 거리', meaning: 'very close by', example: 'The station is a stones throw from the hotel.', note: '원래는 돌을 던져 닿을 거리라는 뜻입니다' },
          { en: 'call it a night', ko: '오늘은 이만 자다', meaning: 'to stop for the night', example: 'It is past midnight, let us call it a night.', note: '여행 첫날 밤에 자주 쓰는 표현입니다' },
          { en: 'touch down', ko: '착륙하다', meaning: 'to land', example: 'We touched down twenty minutes early.', note: '비행기 착륙에만 씁니다' },
          { en: 'on the go', ko: '쉴 틈 없이 이동하다', meaning: 'busy moving from place to place', example: 'I have been on the go since five this morning.', note: '여행 중 쉴 틈 없는 나날을 말할 때 씁니다' }
        ],
        quote: {
          ko: '이디엄은 단어가 아니라 덩어리로 외웁니다. 직역은 도움이 안 됩니다.',
          en: 'Idioms are chunks, not words. Translating them one by one will not help.'
        }
      },

      /* ── 7. 자연스러운 표현 ──────────────────────────────────────── */
      {
        id: 'natural',
        kind: 'natural',
        level: 'A2',
        title: { ko: '자연스러운 표현 — 입국 심사에서', en: 'Natural English — at passport control' },
        intro: {
          ko: '심사관 질문에 한 단어로만 답하면 다시 묻습니다. 문장으로 답하는 습관을 들이세요.',
          en: 'Single-word answers make officers repeat the question. Answer in full sentences.'
        },
        dialogue: [
          { who: 'Officer', en: 'What is the purpose of your visit?', ko: '방문 목적이 무엇입니까?' },
          { who: 'You', en: 'I am here on holiday for a week.', ko: '일주일간 휴가로 왔습니다.' },
          { who: 'Officer', en: 'Where will you be staying?', ko: '어디에 머무르십니까?' },
          { who: 'You', en: 'At a hotel in the city centre. Here is my booking.', ko: '시내 호텔입니다. 예약 확인서 여기 있습니다.' },
          { who: 'Officer', en: 'How much cash are you carrying?', ko: '현금은 얼마나 가지고 계십니까?' },
          { who: 'You', en: 'About three hundred dollars, and I have cards as well.', ko: '300달러 정도이고 카드도 있습니다.' }
        ],
        items: [
          { en: 'I am here on holiday.', ko: '휴가로 왔습니다.', meaning: 'I came for a holiday', example: 'I am here on business, not on holiday.', note: 'on business는 출장으로입니다' },
          { en: 'Here is my booking.', ko: '예약 확인서 여기 있습니다.', meaning: 'this is my reservation', example: 'Here is my hotel booking.', note: 'booking과 reservation은 같은 뜻입니다' },
          { en: 'I am travelling with a friend.', ko: '친구와 함께 여행 중입니다.', meaning: 'someone is travelling with me', example: 'I am travelling with my sister.', note: '여행 동반자를 밝히면 추가 질문이 줄어듭니다' },
          { en: 'About three hundred dollars, and I have cards as well.', ko: '300달러 정도이고 카드도 있습니다.', meaning: 'cash plus cards', example: 'About two hundred euros, and a card.', note: '금액에 about을 붙이면 더 자연스럽습니다' },
          { en: 'I am here for a week, then I fly home.', ko: '일주일 있다가 집으로 갑니다.', meaning: 'stating the length of the stay', example: 'I am here for three days on business.', note: '체류 기간을 먼저 밝히면 질문이 줄어듭니다' }
        ]
      },

      /* ── 8. 회화 1 ────────────────────────────────────────────────── */
      {
        id: 'conversation',
        kind: 'conversation',
        level: 'B1',
        title: { ko: '회화 1 — 호텔 체크인', en: 'Conversation 1 — checking in at a hotel' },
        intro: {
          ko: '체크인에서 가장 많이 나오는 흐름입니다. 굵은 표현은 그대로 써도 됩니다.',
          en: 'This is the standard flow at check-in. The bold lines are safe to reuse as they are.'
        },
        dialogue: [
          { who: 'Front desk', en: 'Good evening. Do you have a reservation with us?', ko: '안녕하세요. 예약하셨나요?' },
          { who: 'You', en: 'Yes, under the name Kim, for three nights.', ko: '네, 김으로 3박 예약했습니다.' },
          { who: 'Front desk', en: 'Could I have your passport and a card for incidentals?', ko: '여권과 부대비용용 카드 주시겠어요?' },
          { who: 'You', en: 'Sure. Is breakfast included?', ko: '네. 조식이 포함되어 있나요?' },
          { who: 'Front desk', en: 'It is, until ten thirty. Your room is on the fifth floor.', ko: '네, 10시 30분까지입니다. 방은 5층입니다.' },
          { who: 'You', en: 'Could I get a late checkout tomorrow?', ko: '내일 늦게 체크아웃할 수 있을까요?' }
        ],
        items: [
          { en: 'for three nights', ko: '3박으로', meaning: 'for three nights of stay', example: 'We are staying for five nights.', note: '숙박은 nights, 날짜는 days — 섞으면 어색합니다' },
          { en: 'for incidentals', ko: '부대비용 담보용으로', meaning: 'against extra charges', example: 'We need a card for incidentals.', note: '체크인에서 자주 듣는 표현입니다' },
          { en: 'Could I get a late checkout?', ko: '늦게 체크아웃할 수 있을까요?', meaning: 'may I check out later', example: 'Could I get a late checkout until two?', note: 'Could I get ~은 정중한 요청의 기본형입니다' },
          { en: 'Is breakfast included?', ko: '조식이 포함되어 있나요?', meaning: 'does the price cover breakfast', example: 'Is breakfast included in the rate?', note: 'rate는 1박 요금입니다' },
          { en: 'Could I have a card for incidentals?', ko: '부대비용 담보용 카드를 드릴까요?', meaning: 'a card used against extra charges', example: 'We need a card for incidentals at check-in.', note: '체크인에서 그대로 들을 수 있습니다' },
          { en: 'Your room is on the fifth floor.', ko: '방은 5층입니다.', meaning: 'the floor number', example: 'Your room is on the third floor.', note: '층은 서수로 말합니다. five floor가 아닙니다' }
        ]
      },

      /* ── 9. 회화 2 — 택시 ────────────────────────────────────────── */
      {
        id: 'travel-taxi',
        kind: 'conversation',
        level: 'A2',
        title: { ko: '회화 2 — 택시에서 목적지 말하기', en: 'Conversation 2 — telling the driver where to go' },
        intro: {
          ko: '주소를 말하고 요금을 확인하는 최소한의 문장입니다.',
          en: 'The minimum you need to give an address and check the fare.'
        },
        dialogue: [
          { who: 'Driver', en: 'Where to?', ko: '어디로 가시나요?' },
          { who: 'You', en: 'The Grand Hotel, please. Do you know it?', ko: '그랜드 호텔로 가 주세요. 아시나요?' },
          { who: 'Driver', en: 'Yes, about fifteen minutes. Is that all right?', ko: '네, 15분 정도 걸립니다. 괜찮으시겠어요?' },
          { who: 'You', en: 'That is fine. Roughly how much will it be?', ko: '괜찮습니다. 대략 얼마 정도 나올까요?' },
          { who: 'Driver', en: 'Around twenty dollars, depending on traffic.', ko: '교통 상황에 따라 20달러 정도입니다.' },
          { who: 'You', en: 'Could you drop me at the main entrance?', ko: '정문에 내려 주시겠어요?' }
        ],
        items: [
          { en: 'Where to?', ko: '어디로 가시나요?', meaning: 'where are you going', example: 'Where to, sir?', note: '택시 기사가 가장 먼저 하는 말입니다' },
          { en: 'Roughly how much will it be?', ko: '대략 얼마 정도 나올까요?', meaning: 'about what price', example: 'Roughly how much is the fare?', note: '바가지 요금을 막는 가장 실용적인 질문입니다' },
          { en: 'Could you drop me at the main entrance?', ko: '정문에 내려 주시겠어요?', meaning: 'please stop at the main entrance', example: 'Could you drop me at the corner?', note: 'drop은 내려 주다는 뜻의 구동사입니다' },
          { en: 'Keep the change.', ko: '거스름돈은 가지세요.', meaning: 'you can keep the rest', example: 'Twenty is fine, keep the change.', note: '팁을 줄 때 쓰는 가장 짧은 문장입니다' },
          { en: 'Do you know it?', ko: '거기 아시나요?', meaning: 'do you know this place', example: 'The Grand Hotel, do you know it?', note: '주소만 말하고 끝내지 않는 이유입니다' },
          { en: 'How long will it take?', ko: '얼마나 걸릴까요?', meaning: 'how much time is needed', example: 'How long will it take to get there?', note: '요금을 묻기 전에 시간부터 확인하면 좋습니다' }
        ]
      },

      /* ── 10. 듣기·받아쓰기 ───────────────────────────────────────── */
      {
        id: 'travel-listening',
        kind: 'listening',
        level: 'B1',
        title: { ko: '듣기·받아쓰기 — 여행 문장 10개', en: 'Listening and dictation — ten travel sentences' },
        intro: {
          ko: '공항과 호텔에서 그대로 나오는 문장입니다. 들리는 대로 적어 보세요.',
          en: 'You will hear these word for word. Type what you hear.'
        },
        dictation: [
          { en: 'Your flight has been delayed by about forty minutes.', ko: '항공편이 약 40분 지연되었습니다.' },
          { en: 'Could I see your passport and boarding pass, please?', ko: '여권과 탑승권을 보여 주시겠어요?' },
          { en: 'I would like to change my seat if possible.', ko: '가능하면 좌석을 바꾸고 싶습니다.' },
          { en: 'Is there a shuttle from the airport to the hotel?', ko: '공항에서 호텔로 가는 셔틀이 있나요?' },
          { en: 'The gate has changed to twelve B, near the food court.', ko: '게이트가 푸드코트 옆 12B로 변경되었습니다.' },
          { en: 'Check-in closes forty minutes before departure.', ko: '체크인은 출발 40분 전에 마감됩니다.' },
          { en: 'We will make up the room while you are out.', ko: '외출하신 동안 방을 정리해 드리겠습니다.' },
          { en: 'Could you leave the key at the front desk?', ko: '키를 프런트에 놓고 가 주시겠어요?' },
          { en: 'The meeting point is just inside the main entrance.', ko: '만남 장소는 정문 안쪽입니다.' },
          { en: 'Please place your bag in the overhead bin above your seat.', ko: '짐을 머리 위 선반에 넣어 주세요.' }
        ],
        items: [
          { en: 'delayed by about forty minutes', ko: '약 40분 지연', meaning: 'late by roughly forty minutes', example: 'The flight was delayed by two hours.', note: 'delay 뒤에는 by가 옵니다' },
          { en: 'I would like to change my seat.', ko: '좌석을 바꾸고 싶습니다.', meaning: 'I want to change my seat, politely', example: 'I would like to change my room.', note: 'I want보다 정중한 기본형입니다' },
          { en: 'Is there a shuttle?', ko: '셔틀이 있나요?', meaning: 'does a shuttle service exist', example: 'Is there a bus to the city?', note: 'Is there + 명사 패턴입니다' }
        ]
      },

      /* ── 11. 독해 ─────────────────────────────────────────────────── */
      {
        id: 'travel-reading',
        kind: 'reading',
        level: 'B1',
        title: { ko: '독해 — 예약 확인 메일 한 통', en: 'Reading — one booking confirmation' },
        intro: {
          ko: '학습용으로 새로 쓴 예약 메일입니다. 실제로 확인해야 할 세부 사항을 세면서 읽어 보세요.',
          en: 'A practice confirmation written for this issue. Read it and count the details a guest actually has to check.'
        },
        reading: [
          'Thank you for your booking. Check-in begins at three in the afternoon, and the front desk stays open all night for late arrivals.',
          'Breakfast is included on weekdays only. At the weekend the kitchen is closed, and guests receive a voucher for the cafe next door.',
          'Please note that the lift will be serviced on Thursday morning, so guests on the upper floors should use the stairs between nine and eleven.',
          'Everything else is standard: free cancellation up to forty-eight hours before arrival, and a small charge for any checkout after one in the afternoon.'
        ],
        items: [
          { en: 'the front desk stays open all night', ko: '프런트는 밤새 열려 있다', meaning: 'someone is there through the night', example: 'The desk stays open all night for late flights.', note: '늦은 도착을 안심시키는 문장입니다' },
          { en: 'a voucher for the cafe next door', ko: '옆 카페에서 쓸 수 있는 교환권', meaning: 'a ticket you can exchange for something', example: 'We were given a voucher for the cafe.', note: '조식 대신 주는 경우가 많습니다' },
          { en: 'the lift will be serviced', ko: '엘리베이터를 점검할 예정이다', meaning: 'it will be checked or repaired', example: 'The lift will be serviced on Monday.', note: '수동태로 알림을 전달합니다' },
          { en: 'free cancellation up to forty-eight hours before arrival', ko: '도착 48시간 전까지 무료 취소', meaning: 'you can cancel without paying until that time', example: 'Free cancellation up to seven days before arrival.', note: 'up to는 그 시점까지라는 뜻입니다' }
        ],
        bullets: [
          { en: 'Answer with the detail — Check-in begins at three.', ko: '세부 사항으로 답하세요 — Check-in begins at three.' },
          { en: 'Answer with the condition — Breakfast is included on weekdays only.', ko: '조건을 붙여 답하세요 — Breakfast is included on weekdays only.' },
          { en: 'Answer the risk — The lift is out of service on Thursday morning.', ko: '불편 사항을 짚어 답하세요 — The lift is out of service on Thursday morning.' }
        ],
        questions: [
          { ko: '이 메일에서 실제로 확인해야 할 세부 사항 세 가지를 찾아보세요.', en: 'Find the three details in the email that a guest actually has to check.' },
          { ko: '주말에 도착한다면 아침 식사는 어떻게 해결해야 하나요?', en: 'If you arrive at the weekend, what should you do about breakfast?' },
          { ko: '늦은 밤에 도착하는 사람에게 중요한 문장은 어느 것인가요?', en: 'Which sentence matters most to a guest arriving late at night?' },
          { ko: '취소 조건을 한 문장으로 요약해 보세요.', en: 'Summarise the cancellation rule in one sentence.' },
          { ko: '이 메일을 읽고 다시 물어봐야 할 것이 있다면 무엇인가요?', en: 'What, if anything, would you still need to ask the hotel?' },
          { ko: '이 메일에서 확실히 정해진 것과 여전히 불확실한 것을 각각 하나씩 말해 보세요.', en: 'Name one thing the email settles and one thing it leaves unclear.' }
        ]
      },

      /* ── 12. 쓰기 ────────────────────────────────────────────────── */
      {
        id: 'travel-writing',
        kind: 'writing',
        level: 'B1',
        title: { ko: '쓰기 — 예약 문의 메일 세 줄', en: 'Writing — a three-line booking email' },
        intro: {
          ko: '먼저 세 줄을 직접 써 보고, 그다음 아래 모범 답안과 비교하세요.',
          en: 'Write your three lines first, then compare them with the model answer below.'
        },
        body: {
          en: [
            '**Model answer** — I would like to book a double room for two nights, from Friday to Sunday. We arrive on the evening flight, so we expect to reach the hotel around nine, and we are two adults. Could you confirm whether breakfast is included and whether a late arrival is a problem?'
          ],
          ko: [
            '**모범 답안** — 금요일부터 일요일까지, 2박으로 더블룸을 예약하고 싶습니다. 저녁 항공편으로 도착해 9시쯤 호텔에 닿을 예정이고, 성인 두 명입니다. 조식이 포함되는지, 늦은 도착이 괜찮은지 확인해 주시겠어요?'
          ]
        },
        bullets: [
          { en: 'Line 1 — what you want, in one sentence.', ko: '1줄 — 원하는 것을 한 문장으로.' },
          { en: 'Line 2 — the dates, the number of guests and one condition.', ko: '2줄 — 날짜·인원·조건 하나.' },
          { en: 'Line 3 — a polite close and one clear question.', ko: '3줄 — 정중한 마무리와 분명한 질문 하나.' },
          { en: 'Check yourself — dates, number of guests, one condition, one question.', ko: '스스로 점검 — 날짜 · 인원 · 조건 하나 · 질문 하나가 들어 있으면 통과입니다.' }
        ],
        items: [
          { en: 'I would like to book a room for two nights.', ko: '2박으로 방을 예약하고 싶습니다.', note: '1줄 예시 — 요청을 앞에 둡니다' },
          { en: 'We arrive on Friday and leave on Sunday, two adults.', ko: '금요일에 도착해 일요일에 떠나고, 성인 두 명입니다.', note: '2줄 예시 — 날짜와 인원을 함께' },
          { en: 'Could you confirm whether breakfast is included?', ko: '조식이 포함되는지 확인해 주시겠어요?', note: '3줄 예시 — 질문 하나로 닫습니다' }
        ],
        quote: {
          ko: '세 줄이면 충분합니다. 길게 쓰면 상대가 무엇을 답해야 할지 놓칩니다.',
          en: 'Three lines are enough. A long email hides the one thing you need answered.'
        }
      },

      /* ── 13. 토론 ────────────────────────────────────────────────── */
      {
        id: 'group-talk',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '그룹 토크 — 여행에 대한 10가지 질문', en: 'Group talk — ten questions about travel' },
        intro: {
          ko: '혼자서도 소리 내어 답해 보세요. 30초씩 말하면 충분합니다.',
          en: 'Answer out loud, even alone. Thirty seconds each is plenty.'
        },
        questions: [
          { ko: '여행에서 가장 기억에 남는 순간은 언제였나요?', en: 'What is the most memorable moment of your travels?' },
          { ko: '계획형 여행자입니까, 즉흥형 여행자입니까?', en: 'Are you a planner or a spontaneous traveller?' },
          { ko: '짐을 쌀 때 절대 빼놓지 않는 것은 무엇인가요?', en: 'What do you never leave out when you pack?' },
          { ko: '다시 가고 싶은 도시가 있나요? 이유도 말해 보세요.', en: 'Is there a city you would go back to? Why?' },
          { ko: '여행 중에 생긴 문제를 어떻게 해결했나요?', en: 'How did you solve a problem that came up on a trip?' },
          { ko: '혼자 여행과 함께 여행 중 어느 쪽을 선호하나요?', en: 'Do you prefer travelling alone or with others?' },
          { ko: '말이 통하지 않는 곳에서 문제를 해결한 적이 있나요?', en: 'Have you ever solved a problem where nobody shared your language?' },
          { ko: '다음 여행에서 이번 주 표현 중 어떤 것을 써 볼 건가요?', en: 'Which expression from this week will you use on your next trip?' },
          { ko: '여행에서 가장 잘 쓴 돈은 무엇이었나요?', en: 'What was the best money you spent on a trip?' },
          { ko: '여행에서 익힌 습관이 일상에 남은 적이 있나요?', en: 'Has a habit from a trip ever stayed with you at home?' }
        ],
        bullets: [
          { en: 'To open a story — The first time I went there, I...', ko: '이야기를 꺼낼 때 — The first time I went there, I...' },
          { en: 'To give a reason — The reason I liked it was...', ko: '이유를 붙일 때 — The reason I liked it was...' },
          { en: 'To disagree softly — I see it differently, actually.', ko: '부드럽게 반대할 때 — I see it differently, actually.' },
          { en: 'To finish — Since then, I have always...', ko: '맺을 때 — Since then, I have always...' }
        ]
      },

      /* ── 14. 문화 ────────────────────────────────────────────────── */
      {
        id: 'culture',
        kind: 'culture',
        level: 'B1',
        title: { ko: '문화 — 팁 문화가 낯선 사람들을 위해', en: 'Culture — travelling where tipping is unfamiliar' },
        body: {
          en: [
            'Tipping is one of the easiest things to get wrong. Where it is expected, it is part of the price of service, not a sign of friendliness.',
            'Where it is not expected, offering it can be awkward. Carry a little cash and quietly ask at the counter — that is the safest route.',
            '**The safest sentence** is a question, not a gesture: **Is the tip included?** It works in both kinds of country and it never causes offence.'
          ],
          ko: [
            '한국에서 온 여행자에게 가장 헷갈리는 것 중 하나가 팁입니다. 팁을 주는 나라에서는 서비스에 대한 대가이지 친절의 표시가 아닙니다.',
            '반대로 팁이 필요 없는 나라에서는 억지로 주면 오히려 어색해집니다. 현금을 조금 준비해 두고 계산대에서 조용히 물어보는 편이 가장 안전합니다.',
            '**가장 안전한 문장은 동작이 아니라 질문입니다** — Is the tip included? 두 종류의 나라에서 모두 통하고, 실례가 되지 않습니다.'
          ]
        },
        items: [
          { en: 'Is the tip included?', ko: '팁이 포함되어 있나요?', meaning: 'does the bill already include service', example: 'Is the tip included in the total?', note: '계산서의 service included를 먼저 확인하세요' },
          { en: 'round it up', ko: '잔돈을 올려 계산하다', meaning: 'to pay the next whole amount as a tip', example: 'Just round it up, thanks.', note: '카드로 계산할 때 팁을 얹는 방법입니다' },
          { en: 'No tip, thanks.', ko: '팁은 괜찮습니다.', meaning: 'I will not add a tip', example: 'No tip, thanks, the total is fine.', note: '팁이 불필요한 곳에서 쓰는 표현입니다' },
          { en: 'Could we split the bill?', ko: '계산을 나눌 수 있을까요?', meaning: 'can we pay separately', example: 'Could we split the bill three ways?', note: '여행 중 모임에서 자주 씁니다' },
          { en: 'Is service included?', ko: '서비스 요금이 포함되어 있나요?', meaning: 'is the service charge already added', example: 'Is service included in the total?', note: '유럽에서는 계산서에 붙어 있는 경우가 많습니다' }
        ],
        quote: {
          ko: '팁은 친절의 표시가 아니라 값의 일부입니다.',
          en: 'A tip is part of the price, not a sign of friendliness.'
        }
      },

      /* ── 15. 확인 문제 ───────────────────────────────────────────── */
      {
        id: 'quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 16문항', en: 'Quiz — sixteen questions' },
        intro: {
          ko: '보기를 고르면 바로 채점됩니다. 틀려도 괜찮습니다.',
          en: 'Pick an option and it is marked straight away.'
        },
        quiz: [
          {
            q: { ko: '빈칸에 알맞은 것은? "I ___ to Japan twice."', en: 'Which fits? "I ___ to Japan twice."' },
            options: ['went', 'have been', 'was going', 'had gone'],
            answer: 1,
            explain: {
              ko: '횟수(twice)만 말하고 시점이 없으므로 경험의 현재완료 have been을 씁니다.',
              en: 'The count (twice) is given without a time, so the present perfect have been fits.'
            }
          },
          {
            q: { ko: '"3박으로 묵습니다"는 어느 쪽이 자연스러운가요?', en: 'Which is natural for a three-night stay?' },
            options: ['for three days', 'for three nights', 'during three nights', 'on three days'],
            answer: 1,
            explain: {
              ko: '숙박은 nights를 씁니다. days를 쓰면 숙박 기간임이 분명하지 않습니다.',
              en: 'Hotels count nights. Days would not make the length of the stay clear.'
            }
          },
          {
            q: { ko: '"짐을 가볍게 하다"에 해당하는 표현은?', en: 'Which means to pack very little?' },
            options: ['catch a flight', 'travel light', 'hit the road', 'keep the change'],
            answer: 1,
            explain: {
              ko: 'travel light이 정답입니다. hit the road는 길을 나서다입니다.',
              en: 'Travel light is the one. Hit the road means to set off.'
            }
          },
          {
            q: { ko: '택시에서 요금을 미리 확인하는 가장 좋은 문장은?', en: 'Which line checks the fare before you set off?' },
            options: ['Where to?', 'Roughly how much will it be?', 'Keep the change.', 'Is breakfast included?'],
            answer: 1,
            explain: {
              ko: 'Roughly how much will it be?가 요금을 묻는 표현입니다.',
              en: 'Roughly how much will it be? asks for an estimate.'
            }
          },
          {
            q: { ko: '환승을 놓쳤을 때 쓰는 표현은?', en: 'Which expression is about a missed onward flight?' },
            options: ['meet a deadline', 'miss a connection', 'get a refund', 'pay in cash'],
            answer: 1,
            explain: {
              ko: '환승편은 connection이고, 놓치는 것은 miss입니다.',
              en: 'A connecting flight is a connection, and you miss it.'
            }
          },
          {
            q: { ko: '통로 좌석을 영어로 하면?', en: 'What is the seat next to the walkway called?' },
            options: ['window seat', 'aisle seat', 'middle seat', 'exit row'],
            answer: 1,
            explain: {
              ko: 'aisle seat입니다. aisle의 s는 소리 내지 않습니다.',
              en: 'It is an aisle seat, and the s in aisle is silent.'
            }
          },
          {
            q: { ko: '빈칸에 알맞은 것은? "I ___ just arrived at the hotel."', en: 'Which fits? "I ___ just arrived at the hotel."' },
            options: ['have', 'had', 'was', 'am being'],
            answer: 0,
            explain: {
              ko: 'just는 방금을 뜻하므로 현재완료 have arrived를 씁니다.',
              en: 'Just points to a moment ago, so the present perfect have arrived fits.'
            }
          },
          {
            q: { ko: '짐을 부쳤다는 올바른 표현은?', en: 'Which is the correct way to say you handed in your bags?' },
            options: ['We checked the luggage.', 'We did the luggage.', 'We made the luggage.', 'We took the luggage to check.'],
            answer: 0,
            explain: {
              ko: '짐을 부칠 때는 check the luggage입니다.',
              en: 'You check the luggage at the counter. The other verbs are never used.'
            }
          },
          {
            q: { ko: '시차 피로를 뜻하는 말은?', en: 'Which word means tiredness after crossing time zones?' },
            options: ['stopover', 'jet lag', 'layover', 'baggage claim'],
            answer: 1,
            explain: {
              ko: 'jet lag가 시차 피로입니다. layover와 stopover는 경유입니다.',
              en: 'Jet lag is the tiredness. A layover and a stopover are waits between flights.'
            }
          },
          {
            q: { ko: '체크아웃한다는 구동사는?', en: 'Which phrasal verb means leaving a hotel and settling the bill?' },
            options: ['check in', 'check out', 'stop by', 'end up'],
            answer: 1,
            explain: {
              ko: 'check out은 체크아웃하다입니다. check in은 체크인입니다.',
              en: 'Check out is leaving the hotel. Check in is arriving.'
            }
          },
          {
            q: { ko: '팁을 얼마 줄지 미리 확인하는 가장 안전한 질문은?', en: 'Which question is the safest way to check about tipping?' },
            options: ['No tip, thanks.', 'Is the tip included?', 'Keep the change.', 'Round it up.'],
            answer: 1,
            explain: {
              ko: 'Is the tip included?는 두 경우 모두에서 실례가 되지 않습니다.',
              en: 'Is the tip included? works whether or not tipping is expected.'
            }
          },
          {
            q: { ko: '여행 경험을 말하는 문장은 어느 것인가요?', en: 'Which expression means you have been to a place at some point?' },
            options: ['I went to Rome once in 2019.', 'I have been to Rome once.', 'I was going to Rome once.', 'I had been Rome once.'],
            answer: 1,
            explain: {
              ko: '시점을 말하지 않은 경험은 have been입니다. 2019를 붙이면 과거시제로 바뀝니다.',
              en: 'An experience without a date takes have been. Adding 2019 would switch the sentence to the past simple.'
            }
          },
          {
            q: { ko: '수하물 찾는 곳을 영어로 하면?', en: 'Where do you collect your bags after a flight?' },
            options: ['baggage claim', 'lost and found', 'check-in desk', 'departure lounge'],
            answer: 0,
            explain: {
              ko: 'baggage claim이 수하물 찾는 곳입니다. departure lounge는 탑승 전 대기 구역입니다.',
              en: 'Baggage claim is where bags arrive. The departure lounge is where you wait to board.'
            }
          },
          {
            q: { ko: '빈칸에 알맞은 것은? "We ___ walking to the hotel in the end."', en: 'Which fits? "We ___ walking to the hotel in the end."' },
            options: ['ended up', 'ended over', 'ended by', 'ended on'],
            answer: 0,
            explain: {
              ko: 'end up은 결국 ~하게 되다이고, 뒤에는 -ing가 옵니다.',
              en: 'End up means finally doing something, and it takes -ing after it.'
            }
          },
          {
            q: { ko: '올바른 연어는 어느 것인가요?', en: 'Which collocation is correct?' },
            options: ['take a taxi', 'ride a taxi', 'move a taxi', 'go a taxi'],
            answer: 0,
            explain: {
              ko: '택시는 take a taxi 또는 get a taxi로만 씁니다.',
              en: 'You take or get a taxi. The other verbs are never used with taxi.'
            }
          },
          {
            q: { ko: '빈칸에 알맞은 것은? "I ___ never ___ alone."', en: 'Which fits? "I ___ never ___ alone."' },
            options: ['have / flown', 'did / fly', 'was / flying', 'had / flew'],
            answer: 0,
            explain: {
              ko: 'never가 들어간 경험은 현재완료이고, flown은 fly의 과거분사입니다.',
              en: 'Never with experience takes the present perfect, and flown is the past participle of fly.'
            }
          }
        ]
      },

      /* ── 16. 유머 ────────────────────────────────────────────────── */
      {
        id: 'humor',
        kind: 'humor',
        level: 'A2',
        title: { ko: '유머 — 공항에서 생긴 일', en: 'Humour — a small airport joke' },
        intro: {
          ko: '영어 농담은 대개 시제와 단어 선택에서 웃음이 나옵니다.',
          en: 'English jokes often turn on tense and word choice.'
        },
        body: {
          en: [
            '**A:** "Did you pack your bags yourself?"  **B:** "Yes, and then I unpacked them at security and packed them again."',
            'The joke turns on the simple past. The point is not repacking, but answering the exact question you were asked.'
          ],
          ko: [
            '**A:** "짐은 직접 싸셨습니까?"  **B:** "네, 그리고 보안 검색대에서 다시 꺼내고 다시 쌌습니다."',
            '웃음의 핵심은 과거시제입니다. 짐을 두 번 쌌다는 사실보다, 심사관의 질문을 그대로 되받아 쓰는 구조에서 웃음이 나옵니다.'
          ]
        },
        items: [
          { en: 'Did you pack your bags yourself?', ko: '짐은 직접 싸셨습니까?', meaning: 'a standard security question', example: 'Did you pack your bags yourself, sir?', note: '보안 검문에서 그대로 나오는 문장입니다' },
          { en: 'I packed them again at security.', ko: '보안 검색대에서 다시 쌌습니다.', meaning: 'the bag was repacked later', example: 'They packed them again at security.', note: 'at security는 보안 검색대에서라는 뜻입니다' },
          { en: 'Did you leave your bag unattended?', ko: '가방을 방치하셨습니까?', meaning: 'was the bag left alone', example: 'Never leave your bag unattended.', note: '공항 방송에 그대로 나오는 문장입니다' },
          { en: 'Any liquids over one hundred millilitres?', ko: '100밀리리터를 넘는 액체가 있나요?', meaning: 'the usual security question about liquids', example: 'Any liquids over one hundred millilitres, sir?', note: 'millilitres의 강세는 첫 음절에 있습니다' }
        ],
        quote: {
          ko: '농담은 시제를 정확히 쓸 때 더 재미있어집니다.',
          en: 'A joke lands harder when the tense is exact.'
        }
      },

      /* ── 17. 해설 노트 ───────────────────────────────────────────── */
      {
        id: 'note',
        kind: 'note',
        level: 'B1',
        title: { ko: '한국어 해설 노트', en: 'Notes for Korean learners' },
        intro: {
          ko: '한국어 화자가 특히 자주 걸리는 지점만 모았습니다.',
          en: 'Only the points Korean speakers trip over most often.'
        },
        bullets: [
          { en: '**Present perfect vs past** — experience takes have p.p.; naming the time switches to the past simple.', ko: '**현재완료 vs 과거** — 경험은 have p.p., 시점이 나오면 과거시제로 넘어갑니다.' },
          { en: '**Nights for stays** — three days blurs the length of a hotel stay.', ko: '**숙박은 nights** — 3박을 three days로 옮기면 기간이 흐려집니다.' },
          { en: '**Could I get ~** — the safest all-round request pattern.', ko: '**Could I get ~** — 요청의 기본형입니다. Can I보다 안전합니다.' },
          { en: '**Answer in sentences** — one-word replies get you asked again.', ko: '**답은 문장으로** — 심사와 체크인에서 한 단어 답변은 되묻는 질문을 부릅니다.' },
          { en: '**in cash, by card** — the prepositions are fixed.', ko: '**현금은 in cash, 카드는 by card** — 전치사가 고정되어 있습니다.' },
          { en: '**Aisle is silent** — the s is not pronounced at all.', ko: '**aisle의 s는 묵음** — 소리 내지 않습니다.' },
          { en: '**One question beats a gesture** — Is the tip included? is safer than guessing.', ko: '**동작보다 질문 한 마디** — 팁은 추측하지 말고 Is the tip included?로 물으세요.' },
          { en: '**Say the numbers twice** — repeat the gate, floor and price back before you move on.', ko: '**숫자는 한 번 되풀이하세요** — 게이트·층·요금을 되받아 말하면 실수가 사라집니다.' },
          { en: '**Board, take, get** — you board a plane or train, but you take a taxi and get on a bus.', ko: '**board · take · get** — 비행기·기차는 board, 택시는 take, 버스는 get on입니다.' },
          { en: '**Immigration for people, customs for bags** — the two words are not interchangeable.', ko: '**immigration은 사람, customs는 물건** — 바꿔 쓰지 않습니다.' },
          { en: '**get in vs get off** — the train gets in at seven, and you get off at your stop.', ko: '**get in과 get off** — 기차가 도착하면 gets in, 내가 내리면 get off입니다.' },
          { en: '**A connecting flight is a connection** — you catch it, and you can miss it.', ko: '**환승편은 connection** — connection을 catch하기도 하고 miss하기도 합니다.' }
        ]
      }
    ]
  },

  /* ══════════════════════════════════════════════════════════════════════
     5~52주 — 계획 (아직 발행 전)
     ══════════════════════════════════════════════════════════════════════
     구성이 끝난 주부터 차례로 `published`와 `sections`를 채우면
     표지·플랜 화면에서 "발행됨"으로 바뀝니다. */

  /* ── 1분기 · 생활 밀착 영어 (5~13주) ──────────────────────────────────── */
  {
    week: 5,
    slug: 'week-05',
    quarter: 1,
    level: 'B1',
    theme: { ko: '쇼핑·결제', en: 'Shopping and paying' },
    title: { ko: '사이즈를 바꾸고 환불받기', en: 'Sizes, exchanges and refunds' },
    summary: {
      ko: '옷과 신발을 고르고, 사이즈를 바꾸고, 환불 조건을 확인하는 문장을 익힙니다. 가격과 수량 표현이 중심입니다.',
      en: 'Choose clothes and shoes, swap sizes and check the refund terms. Prices and quantity words carry the sentences.'
    },
    plan: {
      goals: {
        ko: ['가격과 사이즈를 정확히 말하고 다른 것을 요청합니다.', '할인과 환불 조건을 확인하고 요청합니다.', '결제 방법을 고르고 영수증을 확인합니다.'],
        en: ['Name a price and a size and ask for another one.', 'Check the discount and refund terms and ask for one.', 'Choose how to pay and check the receipt.']
      },
      grammar: { ko: '셀 수 없는 명사와 수량 표현 (much·many·a little)', en: 'uncountable nouns and quantity words' },
      words: { ko: '옷·신발·결제 어휘 16개', en: 'sixteen words for clothes, shoes and paying' },
      pron: { ko: '가격의 숫자와 -teen / -ty 구분', en: 'numbers in prices, and telling -teen from -ty' },
      output: { ko: '환불을 요청하는 세 문장 만들기', en: 'Ask for a refund in three sentences' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 6,
    slug: 'week-06',
    quarter: 1,
    level: 'B1',
    theme: { ko: '음식·주문', en: 'Food and ordering' },
    title: { ko: '주문부터 알레르기까지 한 번에', en: 'Ordering, allergies and the bill' },
    summary: {
      ko: '카페와 식당에서 주문하고, 재료를 묻고, 계산을 나누는 표현을 다룹니다.',
      en: 'Order at a cafe or restaurant, ask about ingredients and split the bill.'
    },
    plan: {
      goals: {
        ko: ['메뉴에서 주문하고 옵션을 바꿔 말합니다.', '재료와 알레르기를 묻고 답합니다.', '계산을 나누고 팁을 남깁니다.'],
        en: ['Order from a menu and change the options.', 'Ask and answer about ingredients and allergies.', 'Split the bill and leave a tip.']
      },
      grammar: { ko: '부탁의 단계 (Would you ~? · Could you ~? · Would you mind)', en: 'the ladder of requests: would you, could you, would you mind' },
      words: { ko: '음식·주문·결제 어휘 16개', en: 'sixteen words for food, ordering and paying' },
      pron: { ko: '주문 문장의 억양과 would의 축약 발음', en: 'the intonation of an order and the reduction of would' },
      output: { ko: '알레르기를 밝히고 대안을 요청하는 대화 한 장', en: 'One exchange that names an allergy and asks for an alternative' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 7,
    slug: 'week-07',
    quarter: 1,
    level: 'B1',
    theme: { ko: '교통·길찾기', en: 'Getting around' },
    title: { ko: '표 사고 갈아타기', en: 'Tickets, transfers and asking the way' },
    summary: {
      ko: '표를 사고, 갈아타고, 길을 묻는 최소한의 문장을 익힙니다.',
      en: 'The minimum you need to buy a ticket, change lines and ask for directions.'
    },
    plan: {
      goals: {
        ko: ['표를 사고 시간과 승강장을 확인합니다.', '갈아타는 곳을 묻고 안내를 따라갑니다.', '길을 묻고 들은 설명을 되짚어 확인합니다.'],
        en: ['Buy a ticket and check the time and platform.', 'Ask where to change and follow the directions.', 'Ask the way and repeat the answer back to be sure.']
      },
      grammar: { ko: '이동과 위치의 전치사 (to·from·via·through·across)', en: 'prepositions of movement and place: to, from, via, through, across' },
      words: { ko: '교통·방향 어휘 16개', en: 'sixteen words for transport and directions' },
      pron: { ko: '지명과 정류장 이름의 강세와 연음', en: 'stress and linking in place and stop names' },
      output: { ko: '두 번 갈아타는 길을 순서대로 설명하기', en: 'Explain a route with two changes, in order' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 8,
    slug: 'week-08',
    quarter: 1,
    level: 'B1',
    theme: { ko: '약속·일정', en: 'Plans and schedules' },
    title: { ko: '시간을 맞추고 미루기', en: 'Setting, moving and cancelling plans' },
    summary: {
      ko: '약속을 잡고, 옮기고, 취소하는 표현을 다룹니다.',
      en: 'Make a plan, move it and cancel it without sounding stiff.'
    },
    plan: {
      goals: {
        ko: ['약속을 잡고 시간과 장소를 확정합니다.', '일정을 옮기자고 정중하게 제안합니다.', '취소를 알리고 사과합니다.'],
        en: ['Make a plan and fix the time and place.', 'Suggest moving a plan politely.', 'Cancel and apologise without sounding stiff.']
      },
      grammar: { ko: '미래 3형의 구분 (will · be going to · 현재진행형)', en: 'three futures: will, be going to and the present continuous' },
      words: { ko: '약속·일정 어휘 16개', en: 'sixteen words for plans and schedules' },
      pron: { ko: '시간 표현의 약화 (at seven의 at)', en: 'weak forms in time phrases' },
      output: { ko: '약속을 하루 미루자고 제안하는 통화 한 판', en: 'One call that moves a plan by one day' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 9,
    slug: 'week-09',
    quarter: 1,
    level: 'B1',
    theme: { ko: '전화·메시지', en: 'Calls and messages' },
    title: { ko: '안 들릴 때 되묻는 법', en: 'Asking again when you cannot hear' },
    summary: {
      ko: '전화에서 놓친 부분을 되묻고, 요지를 남기는 표현을 익힙니다.',
      en: 'Ask people to repeat what you missed on a call and leave a clear message.'
    },
    plan: {
      goals: {
        ko: ['전화에서 놓친 부분을 정중하게 되묻습니다.', '들은 숫자와 이름을 소리 내어 확인합니다.', '용건과 연락처를 남기고 끊습니다.'],
        en: ['Ask someone to repeat what you missed on a call.', 'Read numbers and names back to confirm them.', 'Leave the point and a number before you hang up.']
      },
      grammar: { ko: '간접 의문문과 확인 질문 (Could you tell me ~? · Do you mean ~?)', en: 'indirect questions and checking questions' },
      words: { ko: '통화·메시지 어휘 16개', en: 'sixteen words for calls and messages' },
      pron: { ko: '전화에서 흐려지는 자음과 축약', en: 'reductions and unclear consonants on a call' },
      output: { ko: '30초 음성 메시지 한 통 남기기', en: 'Leave a thirty-second voice message' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 10,
    slug: 'week-10',
    quarter: 1,
    level: 'B2',
    theme: { ko: '건강·병원', en: 'Health and the doctor' },
    title: { ko: '증상을 말하고 예약하기', en: 'Describing symptoms and booking a visit' },
    summary: {
      ko: '아픈 곳을 설명하고, 약국에서 약을 묻고, 예약을 잡습니다.',
      en: 'Describe what hurts, ask at a pharmacy and book an appointment.'
    },
    plan: {
      goals: {
        ko: ['증상을 아픈 곳과 기간으로 설명합니다.', '약국에서 약과 복용법을 묻습니다.', '진료 예약을 잡고 보험을 확인합니다.'],
        en: ['Describe a symptom by place and duration.', 'Ask at a pharmacy about medicine and how to take it.', 'Book an appointment and check insurance.']
      },
      grammar: { ko: '현재완료 진행형과 기간 (I have been ~ing for · since)', en: 'the present perfect continuous with for and since' },
      words: { ko: '증상·진료 어휘 16개', en: 'sixteen words for symptoms and treatment' },
      pron: { ko: '아픈 곳을 말할 때의 강세와 끊어 읽기', en: 'stress and pausing when naming what hurts' },
      output: { ko: '증상을 세 문장으로 설명하고 예약 잡기', en: 'Describe a symptom in three sentences and book a visit' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 11,
    slug: 'week-11',
    quarter: 1,
    level: 'B2',
    theme: { ko: '집·이웃', en: 'Home and neighbours' },
    title: { ko: '이사하고 이웃과 지내기', en: 'Moving in and getting along with neighbours' },
    summary: {
      ko: '집을 구하고, 수리를 요청하고, 이웃과 가볍게 인사하는 표현을 다룹니다.',
      en: 'Find a place, ask for a repair and make small talk with neighbours.'
    },
    plan: {
      goals: {
        ko: ['집의 조건과 문제를 설명합니다.', '집주인이나 관리실에 수리를 요청합니다.', '이웃과 인사하고 도움을 주고받습니다.'],
        en: ['Describe a place and the problem with it.', 'Ask a landlord or building office for a repair.', 'Greet neighbours and offer or accept help.']
      },
      grammar: { ko: '수동태로 말하는 상태와 요청 (The window is broken · It needs to be fixed)', en: 'the passive for states and requests' },
      words: { ko: '집·수리·이웃 어휘 16개', en: 'sixteen words for housing, repairs and neighbours' },
      pron: { ko: '수동태 -ed의 세 가지 발음', en: 'the three endings of -ed' },
      output: { ko: '수리를 요청하는 짧은 메시지 남기기', en: 'Leave a short message asking for a repair' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 12,
    slug: 'week-12',
    quarter: 1,
    level: 'B2',
    theme: { ko: '취미·운동', en: 'Hobbies and sport' },
    title: { ko: '취미를 소개하고 같이 하기', en: 'Hobbies, invitations and joining in' },
    summary: {
      ko: '취미를 소개하고, 같이 하자고 권하고, 일정을 맞추는 표현을 익힙니다.',
      en: 'Talk about hobbies, invite someone along and agree on a time.'
    },
    plan: {
      goals: {
        ko: ['취미를 소개하고 얼마나 자주 하는지 말합니다.', '상대를 같이 하자고 권합니다.', '시간과 장소를 맞춥니다.'],
        en: ['Introduce a hobby and say how often you do it.', 'Invite someone to join you.', 'Agree on a time and a place.']
      },
      grammar: { ko: '동명사와 부정사 (enjoy·avoid + -ing · decide + to)', en: 'gerunds and infinitives after common verbs' },
      words: { ko: '취미·운동 어휘 16개', en: 'sixteen words for hobbies and sport' },
      pron: { ko: '권유 문장의 억양 (Do you want to ~)', en: 'the intonation of an invitation' },
      output: { ko: '같이 하자고 권하고 일정을 맞추는 대화 한 장', en: 'One dialogue that invites someone and sets a time' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 13,
    slug: 'week-13',
    quarter: 1,
    level: 'B2',
    theme: { ko: '1분기 점검', en: 'Q1 check-up' },
    title: { ko: '1~12주를 한 번에 되짚기', en: 'Reviewing weeks one to twelve' },
    summary: {
      ko: '1분기의 어휘·구동사·문법을 다시 풀며 약한 곳을 찾습니다.',
      en: 'Revisit the words, phrasal verbs and grammar of Q1 and find the weak spots.'
    },
    plan: {
      goals: {
        ko: ['1분기 어휘와 구동사를 다시 꺼내 씁니다.', '약한 문법 항목을 스스로 찾아냅니다.', '저장한 표현으로 짧은 자기 점검을 합니다.'],
        en: ['Recall the words and phrasal verbs of Q1.', 'Find your weak grammar points yourself.', 'Self-check with the expressions you saved.']
      },
      grammar: { ko: '1분기 문법 총정리 (수량·미래·현재완료·수동태)', en: 'a recap of Q1 grammar: quantity, futures, the perfect and the passive' },
      words: { ko: '1~12주 누적 어휘 복습', en: 'cumulative vocabulary from weeks one to twelve' },
      pron: { ko: '1분기 발음 포인트 다시 듣기', en: 'revisiting the pronunciation points of Q1' },
      output: { ko: '1분기에서 가장 약한 섹션 하나를 골라 다시 풀기', en: 'Pick your weakest section of Q1 and do it again' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  },

  /* ── 2분기 · 일과 협업 (14~26주) ──────────────────────────────────────── */
  {
    week: 14,
    slug: 'week-14',
    quarter: 2,
    level: 'B2',
    theme: { ko: '업무 이메일', en: 'Work email' },
    title: { ko: '다섯 줄로 끝내는 메일', en: 'Getting it done in five lines' },
    summary: {
      ko: '요청과 기한과 맺음말을 다섯 줄 안에 넣는 메일 공식을 다룹니다.',
      en: 'Fit the request, the deadline and the sign-off into five lines.'
    },
    plan: {
      goals: {
        ko: ['메일 첫 줄에 요청과 기한을 함께 넣습니다.', '정중하게 재촉하고 답장 기한을 제안합니다.', '다섯 줄 안에 맺음말까지 마칩니다.'],
        en: ['Put the request and the deadline in the first line.', 'Chase politely and suggest a reply date.', 'Close the email inside five lines.']
      },
      grammar: { ko: '격식의 수동태와 정형 표현 (Please find attached · It has been agreed)', en: 'formal passives and set phrases in email' },
      words: { ko: '이메일 표제·맺음말 어휘 16개', en: 'sixteen words for email subjects and sign-offs' },
      pron: { ko: '읽어도 자연스러운 문장 부호와 쉼', en: 'pausing and punctuation that read well aloud' },
      output: { ko: '요청·기한·맺음말이 든 다섯 줄 메일 한 통', en: 'A five-line email with a request, a deadline and a sign-off' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 15,
    slug: 'week-15',
    quarter: 2,
    level: 'B2',
    theme: { ko: '회의·발표', en: 'Meetings and talks' },
    title: { ko: '끼어들고 정리하기', en: 'Cutting in and wrapping up' },
    summary: {
      ko: '회의에서 의견을 내고, 끼어들고, 요약해 마무리하는 표현을 익힙니다.',
      en: 'Put an idea forward, cut in politely and summarise before you close.'
    },
    plan: {
      goals: {
        ko: ['의견을 부드럽게 내고 근거를 붙입니다.', '남의 말에 끼어들어 동의·반대를 표시합니다.', '회의 끝에 결정과 다음 단계를 요약합니다.'],
        en: ['Put an idea forward with a reason.', 'Cut in to agree or disagree.', 'Summarise decisions and next steps at the end.']
      },
      grammar: { ko: '헤지와 완곡한 반대 (It seems that ~ · I would rather ~)', en: 'hedging and soft disagreement' },
      words: { ko: '회의 진행 어휘 16개', en: 'sixteen words for running a meeting' },
      pron: { ko: '끼어들 때 쓰는 신호 억양 (Sorry, can I just ~)', en: 'the intonation that signals you want to speak' },
      output: { ko: '3분 발표를 열고 닫는 두 문장', en: 'An opening and a closing line for a three-minute talk' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 16,
    slug: 'week-16',
    quarter: 2,
    level: 'B2',
    theme: { ko: '협상·설득', en: 'Negotiating' },
    title: { ko: '조건을 조율하는 문장', en: 'Trading conditions, not feelings' },
    summary: {
      ko: '조건을 제시하고, 양보하고, 대안을 요구하는 표현을 다룹니다.',
      en: 'Offer terms, give ground and ask for another option.'
    },
    plan: {
      goals: {
        ko: ['조건을 제시하고 상대 조건을 확인합니다.', '양보할 것과 지킬 것을 구분해 말합니다.', '대안을 요구하고 합의점을 문장으로 남깁니다.'],
        en: ['Offer terms and check the conditions on the other side.', 'Separate what you can give from what you cannot.', 'Ask for an alternative and put the agreement in writing.']
      },
      grammar: { ko: '조건문 2·3형 (If you could ~, we would ~ · If we had ~, we would have ~)', en: 'the second and third conditionals in negotiation' },
      words: { ko: '협상·계약 어휘 16개', en: 'sixteen words for negotiation and terms' },
      pron: { ko: '숫자와 조건에 두는 강세', en: 'stressing numbers and conditions' },
      output: { ko: '가격과 납기를 주고받는 협상 대화 한 장', en: 'One dialogue trading price and delivery time' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 17,
    slug: 'week-17',
    quarter: 2,
    level: 'B2',
    theme: { ko: '숫자와 데이터', en: 'Numbers and data' },
    title: { ko: '그래프를 문장으로', en: 'Putting a chart into words' },
    summary: {
      ko: '증가와 감소와 비율을 문장으로 옮기고 근거를 붙이는 법을 익힙니다.',
      en: 'Turn rises, falls and shares into sentences, and attach the evidence.'
    },
    plan: {
      goals: {
        ko: ['증가·감소·비율을 문장으로 옮깁니다.', '수치에 근거와 출처를 붙입니다.', '그래프를 보고 한 문단으로 요약합니다.'],
        en: ['Turn rises, falls and shares into sentences.', 'Attach a source to every figure.', 'Summarise a chart in one paragraph.']
      },
      grammar: { ko: '비교 구조 심화 (twice as ~ as · the more ~ the more)', en: 'deeper comparison: multiples and paired comparatives' },
      words: { ko: '수치·추세 어휘 16개', en: 'sixteen words for figures and trends' },
      pron: { ko: '큰 숫자와 퍼센트 읽기', en: 'reading large numbers and percentages' },
      output: { ko: '그래프 한 장을 근거와 함께 세 문장으로 설명', en: 'Explain one chart in three sentences with evidence' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 18,
    slug: 'week-18',
    quarter: 2,
    level: 'B2',
    theme: { ko: '면접 영어', en: 'Interviews' },
    title: { ko: '경험을 결과로 말하기', en: 'Turning experience into results' },
    summary: {
      ko: '경험을 결과 중심으로 말하고, 어려운 질문을 되받는 표현을 다룹니다.',
      en: 'Talk about experience in terms of results and handle hard questions.'
    },
    plan: {
      goals: {
        ko: ['경험을 결과 중심으로 말합니다.', '약점 질문에 사실과 배움으로 답합니다.', '어려운 질문을 되받아 시간을 법니다.'],
        en: ['Talk about experience in terms of results.', 'Answer a weakness question with a fact and a lesson.', 'Buy time on a hard question without dodging it.']
      },
      grammar: { ko: '관계절과 분사로 경험 압축 (the role I led · leading to ~)', en: 'compressing experience with relative and participle clauses' },
      words: { ko: '면접 질문·평가 어휘 16개', en: 'sixteen words for interview questions and assessment' },
      pron: { ko: '답변 첫 문장을 또렷하게 시작하기', en: 'starting an answer with a clear first line' },
      output: { ko: '경험을 90초 답변으로 정리하기', en: 'Shape one experience into a ninety-second answer' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 19,
    slug: 'week-19',
    quarter: 2,
    level: 'B2',
    theme: { ko: '자기소개·이력서', en: 'Self-introduction and CV' },
    title: { ko: '한 문단으로 나를 정리하기', en: 'Your profile in one paragraph' },
    summary: {
      ko: '이력서 요약과 30초 자기소개를 영어로 정리합니다.',
      en: 'Write your summary line and a thirty-second introduction.'
    },
    plan: {
      goals: {
        ko: ['한 문단 프로필을 씁니다.', '30초 자기소개를 말합니다.', '강점을 수치로 뒷받침합니다.'],
        en: ['Write a one-paragraph profile.', 'Give a thirty-second introduction.', 'Back a strength with a number.']
      },
      grammar: { ko: '이력서 문체 — 주어 생략과 명사 구 (Led a team of six · team leadership)', en: 'resume style: dropped subjects and noun phrases' },
      words: { ko: '직무·성과 어휘 16개', en: 'sixteen words for roles and achievements' },
      pron: { ko: '강점을 말할 때의 속도와 강세', en: 'pace and stress when naming a strength' },
      output: { ko: '내 이력서 요약 한 문단과 30초 소개', en: 'Your own profile paragraph and a thirty-second intro' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 20,
    slug: 'week-20',
    quarter: 2,
    level: 'B2',
    theme: { ko: '재택·협업 도구', en: 'Remote work' },
    title: { ko: '화면 공유와 화상회의', en: 'Sharing a screen without panic' },
    summary: {
      ko: '화상회의에서 순서를 잡고, 화면을 공유하고, 연결 문제를 설명합니다.',
      en: 'Take turns on a call, share a screen and explain a connection problem.'
    },
    plan: {
      goals: {
        ko: ['화상회의에서 순서를 잡고 양해를 구합니다.', '연결 문제를 설명하고 대안을 제안합니다.', '화면 공유와 파일 전달을 말로 안내합니다.'],
        en: ['Take turns on a call and ask for the floor.', 'Explain a connection problem and offer a fix.', 'Talk someone through a screen share.']
      },
      grammar: { ko: '실시간 상태 — 현재완료와 부사 위치 (I have just shared · it is still loading)', en: 'live status with the perfect and adverb position' },
      words: { ko: '화상회의·협업 도구 어휘 16개', en: 'sixteen words for calls and collaboration tools' },
      pron: { ko: '화면 공유 중 자주 쓰는 짧은 지시문', en: 'short instructions during a screen share' },
      output: { ko: '연결이 끊긴 상황을 설명하는 세 문장', en: 'Three sentences that explain a dropped connection' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 21,
    slug: 'week-21',
    quarter: 2,
    level: 'B2',
    theme: { ko: '고객 응대', en: 'Customer service' },
    title: { ko: '사과하고 대안 주기', en: 'Apologising and offering a fix' },
    summary: {
      ko: '불만을 듣고, 사과하고, 대안을 제시하는 표현을 다룹니다.',
      en: 'Take a complaint, apologise and offer a concrete alternative.'
    },
    plan: {
      goals: {
        ko: ['불만을 끝까지 듣고 요점을 되짚습니다.', '책임을 인정하고 사과합니다.', '대안과 처리 기한을 제시합니다.'],
        en: ['Hear a complaint out and repeat the point back.', 'Own the problem and apologise.', 'Offer an alternative with a date.']
      },
      grammar: { ko: '사과의 시제와 조동사 (I am sorry that we have ~ · I should have ~)', en: 'tenses and modals in an apology' },
      words: { ko: '응대·보상 어휘 16개', en: 'sixteen words for service and compensation' },
      pron: { ko: '사과 문장의 억양과 속도', en: 'the pace and intonation of an apology' },
      output: { ko: '불만 전화에 답하는 네 문장 스크립트', en: 'A four-line script for answering a complaint' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 22,
    slug: 'week-22',
    quarter: 2,
    level: 'B2',
    theme: { ko: '일정·프로젝트', en: 'Schedules and projects' },
    title: { ko: '마감과 우선순위 말하기', en: 'Deadlines and priorities' },
    summary: {
      ko: '진행 상황을 알리고, 지연을 알리고, 우선순위를 합의합니다.',
      en: 'Report progress, flag a delay and agree on what comes first.'
    },
    plan: {
      goals: {
        ko: ['진행 상황을 한 문장으로 보고합니다.', '지연과 그 이유를 사실만으로 알립니다.', '우선순위를 합의해 순서를 정합니다.'],
        en: ['Report progress in one sentence.', 'Flag a delay with the reason, without excuses.', 'Agree on what comes first.']
      },
      grammar: { ko: '미래완료와 시간 전치사 (will have done by · until · within)', en: 'the future perfect with by, until and within' },
      words: { ko: '프로젝트·일정 어휘 16개', en: 'sixteen words for projects and schedules' },
      pron: { ko: '날짜와 마감을 말할 때의 강세', en: 'stress when naming dates and deadlines' },
      output: { ko: '일주일 진행 보고 세 문장', en: 'A three-line weekly progress report' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 23,
    slug: 'week-23',
    quarter: 2,
    level: 'B2',
    theme: { ko: '문제 해결', en: 'Problem solving' },
    title: { ko: '원인부터 차근차근', en: 'From cause to fix' },
    summary: {
      ko: '문제를 사실과 추측으로 나눠 설명하고 해결책을 제안합니다.',
      en: 'Separate facts from guesses and propose a fix.'
    },
    plan: {
      goals: {
        ko: ['사실과 추측을 나눠 설명합니다.', '원인을 하나씩 짚어 확인합니다.', '해결책과 그 부작용을 함께 제안합니다.'],
        en: ['Separate facts from guesses.', 'Check causes one at a time.', 'Propose a fix and name its side effect.']
      },
      grammar: { ko: '추측의 조동사 (must have · might have been · cannot have)', en: 'modals of deduction' },
      words: { ko: '문제·원인 어휘 16개', en: 'sixteen words for problems and causes' },
      pron: { ko: '강조로 가르는 확신과 의심', en: 'stress that marks certainty and doubt' },
      output: { ko: '장애 원인을 사실과 추측으로 나눠 세 문장', en: 'Three sentences that split fact from guess' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 24,
    slug: 'week-24',
    quarter: 2,
    level: 'B2',
    theme: { ko: '피드백', en: 'Feedback' },
    title: { ko: '부드럽게 지적하고 받아들이기', en: 'Giving and taking feedback' },
    summary: {
      ko: '상대를 공격하지 않고 지적하고, 같은 말을 받아들이는 표현을 익힙니다.',
      en: 'Point out a problem without attacking, and take the same in return.'
    },
    plan: {
      goals: {
        ko: ['상대를 공격하지 않고 문제를 짚습니다.', '구체적 예와 대안을 함께 줍니다.', '받은 피드백을 되풀이해 이해를 확인합니다.'],
        en: ['Point out a problem without attacking.', 'Give an example and a suggestion together.', 'Repeat feedback back to check you understood.']
      },
      grammar: { ko: 'wish · if only와 완곡한 지적 (I wish we had ~ · It might help if ~)', en: 'wish, if only and softened criticism' },
      words: { ko: '피드백 어휘 16개', en: 'sixteen words for giving and taking feedback' },
      pron: { ko: '부드럽게 만드는 억양과 속도', en: 'intonation and pace that keep it soft' },
      output: { ko: '동료에게 주는 세 문장 피드백', en: 'Three sentences of feedback for a colleague' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 25,
    slug: 'week-25',
    quarter: 2,
    level: 'B2',
    theme: { ko: '공부 방법', en: 'Study methods' },
    title: { ko: '하루 10분을 지키는 법', en: 'Keeping ten minutes a day' },
    summary: {
      ko: '짧게 매일 하는 학습 계획을 세우고 영어로 설명합니다.',
      en: 'Build a short daily routine and explain it in English.'
    },
    plan: {
      goals: {
        ko: ['하루 학습 루틴을 영어로 설명합니다.', '목표를 기간과 함께 세웁니다.', '막혔을 때 쓸 방법을 말합니다.'],
        en: ['Explain a daily study routine in English.', 'Set a goal with a period attached.', 'Describe what you do when you get stuck.']
      },
      grammar: { ko: '동명사·부정사의 대비 (remember to do vs remember doing)', en: 'gerund and infinitive contrasts: remember to do and remember doing' },
      words: { ko: '학습·습관 어휘 16개', en: 'sixteen words for studying and habits' },
      pron: { ko: '자기 계획을 말할 때의 리듬', en: 'the rhythm of describing your own plan' },
      output: { ko: '내 넉 주 학습 계획을 다섯 문장으로', en: 'Your four-week study plan in five sentences' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 26,
    slug: 'week-26',
    quarter: 2,
    level: 'B2',
    theme: { ko: '2분기 점검', en: 'Q2 check-up' },
    title: { ko: '13~25주 되짚기', en: 'Reviewing weeks thirteen to twenty-five' },
    summary: {
      ko: '2분기의 업무 표현을 다시 풀고 약한 곳을 보완합니다.',
      en: 'Revisit the work English of Q2 and patch the weak spots.'
    },
    plan: {
      goals: {
        ko: ['2분기 업무 표현을 다시 씁니다.', '이메일과 회의 표현을 스스로 점검합니다.', '약한 문법 항목을 골라 보완합니다.'],
        en: ['Reuse the work expressions of Q2.', 'Check your email and meeting language yourself.', 'Pick weak grammar points and patch them.']
      },
      grammar: { ko: '2분기 문법 총정리 (조건문·수동태·추측·wish)', en: 'a recap of Q2 grammar: conditionals, the passive, deduction and wish' },
      words: { ko: '13~25주 누적 어휘 복습', en: 'cumulative vocabulary from weeks thirteen to twenty-five' },
      pron: { ko: '2분기 발음 포인트 다시 듣기', en: 'revisiting the pronunciation points of Q2' },
      output: { ko: '실제 업무 메일 한 통을 다시 써 보기', en: 'Rewrite one real email from your own work' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  },

  /* ── 3분기 · 세상과 문화 (27~39주) ────────────────────────────────────── */
  {
    week: 27,
    slug: 'week-27',
    quarter: 3,
    level: 'B2',
    theme: { ko: '미디어 리터러시', en: 'Media literacy' },
    title: { ko: '같은 사건, 다른 문장', en: 'One event, two articles' },
    summary: {
      ko: '두 기사를 비교하며 사실과 논평을 구분하는 법을 익힙니다.',
      en: 'Compare two reports and tell fact from opinion.'
    },
    plan: {
      goals: {
        ko: ['두 기사를 같은 사건으로 놓고 비교해 읽습니다.', '사실 진술과 논평을 구분합니다.', '표현 차이가 만드는 인상을 설명합니다.'],
        en: ['Read two reports on one event side by side.', 'Sort factual statements from opinion.', 'Explain the impression a word choice creates.']
      },
      grammar: { ko: '간접화법 전체 (say·tell·claim + 시제 역행·의문·지시)', en: 'the full range of reported speech: statements, questions and commands' },
      words: { ko: '미디어·논평 어휘 16개', en: 'sixteen words for media and commentary' },
      pron: { ko: '인용문과 직접 화법의 억양 차이', en: 'intonation in reported and direct speech' },
      output: { ko: '기사 두 편을 비교하는 네 문장 요약', en: 'A four-line comparison of two articles' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 28,
    slug: 'week-28',
    quarter: 3,
    level: 'B2',
    theme: { ko: '영화·드라마', en: 'Film and TV' },
    title: { ko: '줄거리 말하고 추천하기', en: 'Summarising and recommending' },
    summary: {
      ko: '스포일러 없이 줄거리를 말하고 추천하는 표현을 다룹니다.',
      en: 'Describe a plot without spoilers and recommend it.'
    },
    plan: {
      goals: {
        ko: ['스포일러 없이 줄거리를 소개합니다.', '장르와 분위기를 형용사로 말합니다.', '추천과 비추천의 이유를 붙입니다.'],
        en: ['Describe a plot without spoilers.', 'Name the genre and mood with adjectives.', 'Recommend or warn off, with a reason.']
      },
      grammar: { ko: '관계절 심화 (whose·where·비제한 관계절)', en: 'deeper relative clauses: whose, where and non-defining clauses' },
      words: { ko: '영화·드라마 어휘 16개', en: 'sixteen words for film and TV' },
      pron: { ko: '형용사 강세와 감탄 억양', en: 'adjective stress and emphatic intonation' },
      output: { ko: '본 작품 하나를 스포일러 없이 다섯 문장으로 소개', en: 'One title described in five spoiler-free sentences' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 29,
    slug: 'week-29',
    quarter: 3,
    level: 'B2',
    theme: { ko: '음악·공연', en: 'Music and shows' },
    title: { ko: '공연 예매와 감상 나누기', en: 'Booking tickets and comparing notes' },
    summary: {
      ko: '공연을 예매하고, 감상을 형용사로 나누는 표현을 익힙니다.',
      en: 'Book a show and talk about it with the right adjectives.'
    },
    plan: {
      goals: {
        ko: ['공연을 예매하고 좌석과 시간을 확인합니다.', '감상을 형용사와 비교로 나눕니다.', '상대 취향을 묻고 추천을 주고받습니다.'],
        en: ['Book a show and check seats and times.', 'Share a reaction with adjectives and comparisons.', 'Ask about taste and exchange recommendations.']
      },
      grammar: { ko: '강조하는 비교 (by far the best · not nearly as good as)', en: 'emphatic comparison' },
      words: { ko: '음악·공연 어휘 16개', en: 'sixteen words for music and live shows' },
      pron: { ko: '감상 표현의 강세와 속도', en: 'stress and pace in reactions' },
      output: { ko: '공연 후기를 네 문장으로 말하기', en: 'A four-sentence review of a show you saw' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 30,
    slug: 'week-30',
    quarter: 3,
    level: 'B2',
    theme: { ko: '스포츠', en: 'Sport' },
    title: { ko: '경기 규칙과 결과 말하기', en: 'Rules, scores and comebacks' },
    summary: {
      ko: '경기 규칙과 결과를 설명하고 응원하는 표현을 다룹니다.',
      en: 'Explain a rule, report a score and cheer someone on.'
    },
    plan: {
      goals: {
        ko: ['경기 규칙과 진행을 설명합니다.', '점수와 결과를 정확히 보고합니다.', '응원과 격려를 자연스럽게 말합니다.'],
        en: ['Explain a rule and how a game flows.', 'Report a score and a result accurately.', 'Cheer someone on naturally.']
      },
      grammar: { ko: '수동태 고급 (modal passive: was awarded · must have been ruled)', en: 'advanced passives with modals' },
      words: { ko: '스포츠·경기 어휘 16개', en: 'sixteen words for sport and matches' },
      pron: { ko: '점수 읽기와 팀 이름 강세', en: 'reading scores and stressing team names' },
      output: { ko: '경기 하나를 규칙·결과·소감 순서로 다섯 문장', en: 'One match in five sentences: rule, result, reaction' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 31,
    slug: 'week-31',
    quarter: 3,
    level: 'C1',
    theme: { ko: '과학·기술', en: 'Science and tech' },
    title: { ko: '원리를 쉬운 말로', en: 'Explaining how it works' },
    summary: {
      ko: '기술의 원리를 쉬운 문장으로 설명하는 연습을 합니다.',
      en: 'Practise explaining how a technology works in plain sentences.'
    },
    plan: {
      goals: {
        ko: ['기술의 원리를 쉬운 문장으로 설명합니다.', '전문용어를 일상어로 바꿔 말합니다.', '한계와 위험을 사실대로 밝힙니다.'],
        en: ['Explain how a technology works in plain sentences.', 'Swap technical terms for everyday words.', 'State the limits and risks honestly.']
      },
      grammar: { ko: '분사 구문으로 설명 압축 (Using this method, ~ · Known as ~)', en: 'participle clauses in explanation' },
      words: { ko: '과학·기술 어휘 16개', en: 'sixteen words for science and technology' },
      pron: { ko: '긴 전문용어의 강세 위치', en: 'stress placement in long technical words' },
      output: { ko: '내 분야 기술 하나를 90초로 설명하기', en: 'Explain one technology from your field in ninety seconds' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 32,
    slug: 'week-32',
    quarter: 3,
    level: 'C1',
    theme: { ko: '환경·기후', en: 'Environment and climate' },
    title: { ko: '수치와 책임 말하기', en: 'Numbers and responsibility' },
    summary: {
      ko: '환경 지표와 책임 주체를 영어로 정확하게 말합니다.',
      en: 'Talk about environmental figures and who is responsible.'
    },
    plan: {
      goals: {
        ko: ['환경 지표를 정확한 수치로 말합니다.', '책임 주체를 분명히 밝힙니다.', '원인과 결과를 구분해 설명합니다.'],
        en: ['Quote environmental figures accurately.', 'Name who is responsible.', 'Separate causes from consequences.']
      },
      grammar: { ko: '명사화와 인과 (the rise of ~ leads to · a reduction in)', en: 'nominalisation and cause and effect' },
      words: { ko: '환경·기후 어휘 16개', en: 'sixteen words for environment and climate' },
      pron: { ko: '수치와 단위를 붙여 읽기', en: 'reading figures with their units' },
      output: { ko: '지표 하나를 원인·결과·책임으로 세 문장', en: 'One figure in three sentences: cause, effect, responsibility' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 33,
    slug: 'week-33',
    quarter: 3,
    level: 'C1',
    theme: { ko: '사회 이슈', en: 'Social issues' },
    title: { ko: '찬반을 근거로 말하기', en: 'Arguing both sides with reasons' },
    summary: {
      ko: '찬반 주장을 근거와 함께 정리하는 표현을 익힙니다.',
      en: 'Lay out both sides of an argument with reasons.'
    },
    plan: {
      goals: {
        ko: ['찬반 양쪽 주장을 공평하게 정리합니다.', '내 입장을 근거와 함께 말합니다.', '반대 근거를 인정하고 답합니다.'],
        en: ['Lay out both sides fairly.', 'State your position with reasons.', 'Acknowledge the counter-argument and answer it.']
      },
      grammar: { ko: '양보·반박과 강조 구문 (While it is true that ~ · What matters is ~)', en: 'concession, rebuttal and cleft emphasis' },
      words: { ko: '사회·정책 어휘 16개', en: 'sixteen words for social issues and policy' },
      pron: { ko: '주장 문장의 강세와 속도 조절', en: 'stress and pacing in an argument' },
      output: { ko: '한 쟁점의 찬반을 각각 세 문장으로', en: 'Both sides of one issue, three sentences each' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 34,
    slug: 'week-34',
    quarter: 3,
    level: 'C1',
    theme: { ko: '역사·인물', en: 'History and people' },
    title: { ko: '사건을 시간 순서로', en: 'Events in order' },
    summary: {
      ko: '과거 사건을 시간 순서와 인과로 설명하는 표현을 다룹니다.',
      en: 'Describe past events in order and link cause to effect.'
    },
    plan: {
      goals: {
        ko: ['사건을 시간 순서로 설명합니다.', '원인과 결과를 연결합니다.', '인물의 선택과 배경을 설명합니다.'],
        en: ['Describe events in chronological order.', 'Link causes to effects.', 'Explain a person choices and the context around them.']
      },
      grammar: { ko: '과거의 층위 (had done · was doing · did의 배열)', en: 'layers of the past: past perfect, past continuous and past simple' },
      words: { ko: '역사·인물 어휘 16개', en: 'sixteen words for history and people' },
      pron: { ko: '연도와 세기 읽기', en: 'reading years and centuries' },
      output: { ko: '사건 하나를 시간 순서로 다섯 문장', en: 'One event in five sentences, in order' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 35,
    slug: 'week-35',
    quarter: 3,
    level: 'C1',
    theme: { ko: '예술·디자인', en: 'Art and design' },
    title: { ko: '인상과 이유 말하기', en: 'Impressions and reasons' },
    summary: {
      ko: '작품에서 받은 인상을 말하고 그 이유를 붙이는 연습을 합니다.',
      en: 'Say what a piece makes you feel and why.'
    },
    plan: {
      goals: {
        ko: ['작품에서 받은 인상을 말합니다.', '그 이유를 형태·색·재료로 설명합니다.', '취향과 평가를 구분해 말합니다.'],
        en: ['Say what a piece makes you feel.', 'Explain why with shape, colour and material.', 'Separate taste from judgement.']
      },
      grammar: { ko: '감각 동사와 as if 가정 (looks as though it were · feels like)', en: 'sense verbs and as if' },
      words: { ko: '예술·디자인 어휘 16개', en: 'sixteen words for art and design' },
      pron: { ko: '묘사 문장의 리듬과 쉼', en: 'rhythm and pausing in description' },
      output: { ko: '작품 하나를 인상·이유·평가로 네 문장', en: 'One piece in four sentences: impression, reason, view' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 36,
    slug: 'week-36',
    quarter: 3,
    level: 'C1',
    theme: { ko: '문학·시', en: 'Literature and poetry' },
    title: { ko: '문장을 음미해서 읽기', en: 'Reading a line closely' },
    summary: {
      ko: '짧은 글과 시를 천천히 읽으며 뉘앙스를 짙어 봅니다.',
      en: 'Read a short passage or poem slowly and name the nuance.'
    },
    plan: {
      goals: {
        ko: ['짧은 글을 천천히 읽고 뉘앙스를 짚습니다.', '비유와 상징을 자기 말로 풉니다.', '문장 리듬이 만드는 효과를 말합니다.'],
        en: ['Read a short passage slowly and name the nuance.', 'Unpack metaphor and symbol in your own words.', 'Describe what a rhythm does to a line.']
      },
      grammar: { ko: '도치와 생략 (Never before had ~ · Should you need ~)', en: 'inversion and ellipsis' },
      words: { ko: '문학·비평 어휘 16개', en: 'sixteen words for literature and criticism' },
      pron: { ko: '시를 소리 내어 읽는 법 (쉼과 강세)', en: 'reading poetry aloud: pause and stress' },
      output: { ko: '짧은 시 한 편을 읽고 세 문장 감상', en: 'Three sentences on one short poem' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 37,
    slug: 'week-37',
    quarter: 3,
    level: 'C1',
    theme: { ko: '유머·풍자', en: 'Humour and satire' },
    title: { ko: '웃음의 지점 찾기', en: 'Finding the punchline' },
    summary: {
      ko: '농담이 어디서 웃긴지 영어로 설명할 수 있게 됩니다.',
      en: 'Explain in English where a joke actually lands.'
    },
    plan: {
      goals: {
        ko: ['농담이 어디서 웃긴지 설명합니다.', '풍자와 비꼬는 말투를 알아듣습니다.', '상황에 맞는 농담을 골라 씁니다.'],
        en: ['Explain where a joke lands.', 'Recognise satire and dry humour.', 'Pick a joke that fits the room.']
      },
      grammar: { ko: '과장·축소·반어의 문법 장치', en: 'hyperbole, understatement and irony in grammar' },
      words: { ko: '유머·풍자 어휘 16개', en: 'sixteen words for humour and satire' },
      pron: { ko: '비꼬는 억양과 진짜 감탄의 차이', en: 'the intonation of sarcasm versus real surprise' },
      output: { ko: '내가 좋아하는 농담 하나를 영어로 풀어 말하기', en: 'Explain a joke you like in English' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 38,
    slug: 'week-38',
    quarter: 3,
    level: 'C1',
    theme: { ko: '토론·의견', en: 'Debate and opinion' },
    title: { ko: '반대해도 관계는 지키기', en: 'Disagreeing and staying friends' },
    summary: {
      ko: '동의하지 않는다는 것을 정중하게 말하는 표현을 익힙니다.',
      en: 'Say you disagree without damaging the relationship.'
    },
    plan: {
      goals: {
        ko: ['동의하지 않는다는 것을 정중하게 말합니다.', '상대 논리를 요약해 확인합니다.', '관계를 지키면서 입장을 유지합니다.'],
        en: ['Say you disagree without damaging the relationship.', 'Summarise the other position back to them.', 'Hold your ground and stay friendly.']
      },
      grammar: { ko: '고급 헤지와 명사화 (It could be argued that · the framing of)', en: 'advanced hedging and nominalisation' },
      words: { ko: '토론·의견 어휘 16개', en: 'sixteen words for debate and opinion' },
      pron: { ko: '반대할 때 낮추는 억양', en: 'the lowered intonation of disagreement' },
      output: { ko: '동의하지 않는 두 문장과 그 이유', en: 'Two sentences of disagreement with a reason' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 39,
    slug: 'week-39',
    quarter: 3,
    level: 'C1',
    theme: { ko: '3분기 점검', en: 'Q3 check-up' },
    title: { ko: '26~38주 되짚기', en: 'Reviewing weeks twenty-six to thirty-eight' },
    summary: {
      ko: '3분기의 읽기와 토론 표현을 다시 점검합니다.',
      en: 'Revisit the reading and discussion English of Q3.'
    },
    plan: {
      goals: {
        ko: ['3분기 읽기 표현을 다시 씁니다.', '토론에서 쓴 문장을 스스로 점검합니다.', '약한 독해·문법을 보완합니다.'],
        en: ['Reuse the reading language of Q3.', 'Check the sentences you used in discussion.', 'Patch weak reading and grammar points.']
      },
      grammar: { ko: '3분기 문법 총정리 (간접화법·관계절·분사·도치)', en: 'a recap of Q3 grammar: reported speech, relatives, participles and inversion' },
      words: { ko: '27~38주 누적 어휘 복습', en: 'cumulative vocabulary from weeks twenty-seven to thirty-eight' },
      pron: { ko: '3분기 발음 포인트 다시 듣기', en: 'revisiting the pronunciation points of Q3' },
      output: { ko: '3분기 독해 한 편을 기억으로 다시 요약하기', en: 'Summarise one Q3 reading again from memory' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  },

  /* ── 4분기 · 실전과 마무리 (40~52주) ──────────────────────────────────── */
  {
    week: 40,
    slug: 'week-40',
    quarter: 4,
    level: 'C1',
    theme: { ko: '프레젠테이션', en: 'Presentations' },
    title: { ko: '열 장을 열 문장으로', en: 'Ten slides, ten lines' },
    summary: {
      ko: '슬라이드를 문장으로 옮기고 발표를 여는 표현을 다룹니다.',
      en: 'Turn slides into lines and open a talk with confidence.'
    },
    plan: {
      goals: {
        ko: ['슬라이드를 문장이 아니라 메시지로 바꿉니다.', '발표를 여는 한 문장과 순서 안내를 만듭니다.', '질문을 받고 답을 정리해 마무리합니다.'],
        en: ['Turn slides into messages rather than sentences.', 'Open a talk in one line and signpost the order.', 'Take questions and close with a summary.']
      },
      grammar: { ko: '발표의 흐름 — 분사 구문과 순서 표현 (Having shown ~ · First, then, to sum up)', en: 'participle clauses and signposting for a talk' },
      words: { ko: '발표·슬라이드 어휘 16개', en: 'sixteen words for presentations and slides' },
      pron: { ko: '속도와 쉼으로 만드는 발표 리듬', en: 'pace and pausing in a talk' },
      output: { ko: '열 장 슬라이드를 열 문장으로 줄이기', en: 'Compress ten slides into ten lines' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 41,
    slug: 'week-41',
    quarter: 4,
    level: 'C1',
    theme: { ko: '화상회의 실전', en: 'Running a call' },
    title: { ko: '진행을 맡고 정리하기', en: 'Leading and closing the call' },
    summary: {
      ko: '회의를 진행하고, 결정을 정리하고, 다음 단계를 남깁니다.',
      en: 'Lead the call, record the decisions and leave clear next steps.'
    },
    plan: {
      goals: {
        ko: ['회의를 열고 안건과 시간을 안내합니다.', '결정과 담당자를 그 자리에서 정리합니다.', '다음 단계와 기한을 남기고 닫습니다.'],
        en: ['Open a call and set the agenda and the time.', 'Record decisions and owners on the spot.', 'Close with next steps and dates.']
      },
      grammar: { ko: '진행과 합의의 표현 (Shall we start with ~? · Why do not we ~?)', en: 'facilitation and agreement structures' },
      words: { ko: '회의 진행·결정 어휘 16개', en: 'sixteen words for running and closing a call' },
      pron: { ko: '확인 질문의 억양과 되묻기', en: 'the intonation of checks and clarifications' },
      output: { ko: '30분 회의를 열고 닫는 다섯 문장', en: 'Five lines that open and close a thirty-minute call' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 42,
    slug: 'week-42',
    quarter: 4,
    level: 'C1',
    theme: { ko: '협상 실전', en: 'Negotiating in practice' },
    title: { ko: '가격과 조건 끝까지', en: 'Price, terms and the walk-away' },
    summary: {
      ko: '가격과 조건을 끝까지 조율하는 회화를 연습합니다.',
      en: 'Work through price and terms all the way to your walk-away point.'
    },
    plan: {
      goals: {
        ko: ['가격과 조건을 단계적으로 조율합니다.', '양보에는 반대급부를 분명히 요구합니다.', '합의점과 이탈 조건을 문장으로 남깁니다.'],
        en: ['Work through price and terms step by step.', 'Ask for something in return for every concession.', 'Write down the agreement and the walk-away point.']
      },
      grammar: { ko: '혼합 조건문과 가정의 도치 (Had we known ~, we would have ~)', en: 'mixed conditionals and inverted conditionals' },
      words: { ko: '협상 실전 어휘 16개', en: 'sixteen words for real negotiation' },
      pron: { ko: '숫자와 마감을 또렷하게 강조하기', en: 'stressing numbers and deadlines clearly' },
      output: { ko: '가격·납기·보증을 주고받는 협상 한 판', en: 'One negotiation over price, delivery and warranty' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 43,
    slug: 'week-43',
    quarter: 4,
    level: 'C1',
    theme: { ko: '에세이 쓰기', en: 'Essay writing' },
    title: { ko: '주장과 근거 세우기', en: 'Claim, evidence, conclusion' },
    summary: {
      ko: '한 문단 에세이의 뼈대를 영어로 세우는 연습을 합니다.',
      en: 'Build the skeleton of a one-paragraph essay in English.'
    },
    plan: {
      goals: {
        ko: ['주장과 근거와 결론을 한 문단에 넣습니다.', '연결어로 문장을 잇습니다.', '반대 근거를 한 문장으로 처리합니다.'],
        en: ['Fit claim, evidence and conclusion into one paragraph.', 'Link sentences with clear connectors.', 'Handle a counter-argument in one sentence.']
      },
      grammar: { ko: '담화 표지와 명사화 (However · the framing of · a reduction in)', en: 'discourse markers and nominalisation in essays' },
      words: { ko: '에세이·논증 어휘 16개', en: 'sixteen words for essays and argument' },
      pron: { ko: '쓴 문장을 소리 내어 점검하기', en: 'reading your own sentence aloud to test it' },
      output: { ko: '100단어 한 문단 에세이 한 편', en: 'One hundred words of a single-paragraph essay' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 44,
    slug: 'week-44',
    quarter: 4,
    level: 'C1',
    theme: { ko: '시험 영어: 읽기·언어 사용', en: 'Test English: reading and use of English' },
    title: { ko: '파트별 시간과 빈출 함정', en: 'Time budgets and standard traps' },
    summary: {
      ko: '영어 시험(토익·아이엘츠·오픽 등)에 공통으로 나오는 시간 배분과 빈출 구조를 정리합니다.',
      en: 'Time management and high-frequency structures shared by TOEIC, IELTS and speaking tests.'
    },
    plan: {
      goals: {
        ko: ['파트별 시간 배분을 정합니다.', '자주 나오는 함정을 알아봅니다.', '오답 유형을 스스로 분류합니다.'],
        en: ['Set a time budget for each part.', 'Recognise the standard traps.', 'Sort your wrong answers by type.']
      },
      grammar: { ko: '시험 빈출 구조 (수일치·준동사·전치사)', en: 'high-frequency structures: agreement, verb forms and prepositions' },
      words: { ko: '시험 빈출 어휘 16개', en: 'sixteen high-frequency test words' },
      pron: { ko: '듣기 파트의 숫자·시간 표현 잡아내기', en: 'catching figures and times in the listening part' },
      output: { ko: '나만의 파트별 시간표 한 장 만들기', en: 'Draw up a time budget for each part' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 45,
    slug: 'week-45',
    quarter: 4,
    level: 'C1',
    theme: { ko: '시험 영어: 말하기·쓰기', en: 'Test English: speaking and writing' },
    title: { ko: '15초 안에 답 만들기', en: 'An answer in fifteen seconds' },
    summary: {
      ko: '말하기·쓰기 시험에서 15초 안에 답을 구성하는 틀을 익힙니다.',
      en: 'Use a frame to build a spoken or written answer within fifteen seconds.'
    },
    plan: {
      goals: {
        ko: ['15초 안에 답의 뼈대를 만듭니다.', '시간을 버는 표현으로 시작을 법니다.', '답을 두 문장으로 마무리합니다.'],
        en: ['Build the frame of an answer in fifteen seconds.', 'Buy time at the start without stalling.', 'Close the answer in two sentences.']
      },
      grammar: { ko: '즉답용 문장 틀 (In my view ~ because ~)', en: 'answer frames for quick responses' },
      words: { ko: '말하기·쓰기 시험 어휘 16개', en: 'sixteen words for speaking and writing tests' },
      pron: { ko: '긴장한 목소리 다스리기 (속도·쉼)', en: 'pace and pausing under pressure' },
      output: { ko: '여섯 문항을 15초 준비로 답하기', en: 'Answer six prompts with fifteen seconds of preparation each' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 46,
    slug: 'week-46',
    quarter: 4,
    level: 'C1',
    theme: { ko: '여행 심화', en: 'Travel, deeper' },
    title: { ko: '문제가 생겼을 때', en: 'When the trip goes wrong' },
    summary: {
      ko: '지연과 분실과 환불처럼 여행 중 생기는 문제를 해결하는 표현을 다룹니다.',
      en: 'Handle delays, lost luggage and refunds on the road.'
    },
    plan: {
      goals: {
        ko: ['지연과 결항에 대응해 대안을 요구합니다.', '분실 수하물을 신고하고 추적합니다.', '환불과 보상을 근거와 함께 청구합니다.'],
        en: ['Handle delays and cancellations and ask for an alternative.', 'Report and track lost luggage.', 'Claim a refund with the conditions at hand.']
      },
      grammar: { ko: '항의의 완급 (I would like this resolved by ~ · I must insist that ~)', en: 'the firmness ladder in complaints' },
      words: { ko: '여행 문제 어휘 16개', en: 'sixteen words for travel problems' },
      pron: { ko: '통화에서 숫자와 예약 번호 전하기', en: 'saying numbers and booking codes on the phone' },
      output: { ko: '지연 보상을 요구하는 네 문장 이메일', en: 'A four-line email claiming compensation for a delay' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 47,
    slug: 'week-47',
    quarter: 4,
    level: 'C1',
    theme: { ko: '네트워킹', en: 'Networking' },
    title: { ko: '처음 만난 사람과 3분', en: 'Three minutes with a stranger' },
    summary: {
      ko: '처음 만난 사람과 자연스럽게 대화를 잇는 표현을 익힙니다.',
      en: 'Keep a conversation going with someone you just met.'
    },
    plan: {
      goals: {
        ko: ['처음 만난 사람과 대화를 엽니다.', '직업과 관심사를 짧게 소개하고 질문합니다.', '연결과 후속 연락을 자연스럽게 남깁니다.'],
        en: ['Open a conversation with a stranger.', 'Introduce your work and interests briefly, then ask.', 'Leave a connection and a follow-up.']
      },
      grammar: { ko: '부가의문문과 도치 회답 (right? · so do I · neither did I)', en: 'tag questions and inverted short answers' },
      words: { ko: '네트워킹 어휘 16개', en: 'sixteen words for networking' },
      pron: { ko: '이름과 회사명을 또렷하게 전하기', en: 'saying names and company names clearly' },
      output: { ko: '3분 대화 한 판과 후속 메시지 한 줄', en: 'A three-minute conversation and one follow-up line' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 48,
    slug: 'week-48',
    quarter: 4,
    level: 'C1',
    theme: { ko: '돈과 계약', en: 'Money and contracts' },
    title: { ko: '조건을 정확히 읽기', en: 'Reading the fine print' },
    summary: {
      ko: '계약 조건과 지불 조건을 정확하게 묻고 확인합니다.',
      en: 'Ask about and confirm terms and payment conditions.'
    },
    plan: {
      goals: {
        ko: ['지불 조건과 일정을 정확히 묻습니다.', '계약 조항을 확인하고 되짚습니다.', '예외와 위약 조건을 명확히 합니다.'],
        en: ['Ask exactly about payment terms and dates.', 'Check contract clauses and repeat them back.', 'Pin down exceptions and penalties.']
      },
      grammar: { ko: '격식의 의무와 허용 (shall · be required to · subject to)', en: 'formal obligation and permission: shall, be required to, subject to' },
      words: { ko: '계약·지불 어휘 16개', en: 'sixteen words for contracts and payment' },
      pron: { ko: '조항 번호와 금액 읽기', en: 'reading clause numbers and amounts' },
      output: { ko: '계약 조건을 확인하는 다섯 문장', en: 'Five sentences that confirm the terms' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 49,
    slug: 'week-49',
    quarter: 4,
    level: 'C1',
    theme: { ko: '뉴스 심화', en: 'News, deeper' },
    title: { ko: '사설과 논평 읽기', en: 'Reading editorials' },
    summary: {
      ko: '사설과 논평에서 주장과 근거를 분리해 읽습니다.',
      en: 'Separate argument from evidence in an editorial.'
    },
    plan: {
      goals: {
        ko: ['사설에서 주장과 근거를 분리합니다.', '논평의 전제를 찾아냅니다.', '반대 논평과 나란히 놓고 읽습니다.'],
        en: ['Separate argument from evidence in an editorial.', 'Find the assumptions in a comment piece.', 'Read it against an opposing column.']
      },
      grammar: { ko: '긴 문장 분해 — 수식의 층위와 생략 복원', en: 'unpacking long sentences: layers of modification and ellipsis' },
      words: { ko: '논평·사설 어휘 16개', en: 'sixteen words for editorials and comment' },
      pron: { ko: '긴 문장을 끊어 읽는 법', en: 'chunking long sentences aloud' },
      output: { ko: '사설 한 편의 주장을 세 문장으로 분해', en: 'Break one editorial into three sentences of argument' },
      parts: { ko: '18개 섹션 — 학습목표·어휘·구동사·연어·문법·발음·이디엄·자연스러운 표현·회화·받아쓰기·독해·작문·토론·문화·확인 문제·유머·해설 노트', en: 'eighteen sections: goals, vocabulary, phrasal verbs, collocations, grammar, pronunciation, idioms, natural English, conversation, dictation, reading, writing, discussion, culture, quiz, humour and notes' }
    }
  },
  {
    week: 50,
    slug: 'week-50',
    quarter: 4,
    level: 'C1',
    theme: { ko: '1년 복습', en: 'The year in review' },
    title: { ko: '52주를 한 권으로', en: 'Fifty-two weeks in one pass' },
    summary: {
      ko: '1년 동안 배운 표현을 주제별로 다시 묶어 봅니다.',
      en: 'Gather a year of expressions back into themes.'
    },
    plan: {
      goals: {
        ko: ['1년 표현을 주제별로 다시 묶습니다.', '가장 약한 분기를 골라 보완합니다.', '저장한 단어로 종합 점검합니다.'],
        en: ['Gather a year of expressions back into themes.', 'Pick the weakest quarter and patch it.', 'Run a full check with the words you saved.']
      },
      grammar: { ko: '1년 문법 총정리 (분기별 핵심 항목)', en: 'a year of grammar in twelve points' },
      words: { ko: '1~49주 누적 어휘 복습', en: 'cumulative vocabulary from weeks one to forty-nine' },
      pron: { ko: '1년 발음 포인트 다시 듣기', en: 'revisiting a year of pronunciation points' },
      output: { ko: '내가 자주 틀리는 표현 열 개 정리', en: 'List the ten expressions you get wrong most' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  },
  {
    week: 51,
    slug: 'week-51',
    quarter: 4,
    level: 'C1',
    theme: { ko: '최종 점검', en: 'Final check' },
    title: { ko: '약한 곳만 다시', en: 'Only the weak spots' },
    summary: {
      ko: '1년 중 틀렸던 문제와 저장한 단어로 최종 점검합니다.',
      en: 'Revise with the questions you missed and the words you saved.'
    },
    plan: {
      goals: {
        ko: ['틀렸던 문제만 다시 풉니다.', '저장한 단어로 최종 점검합니다.', '남은 약점을 목록으로 만듭니다.'],
        en: ['Redo only the questions you missed.', 'Run a final check on the words you saved.', 'Turn what is left into a short list.']
      },
      grammar: { ko: '약점 문법만 골라 다시 정리', en: 'only the grammar points you still miss' },
      words: { ko: '단어장에 저장한 표현 다시 보기', en: 'the expressions in your wordbook' },
      pron: { ko: '어려웠던 문장만 다시 듣고 따라 말하기', en: 'replay the sentences that were hardest' },
      output: { ko: '최종 약점 목록 다섯 줄', en: 'A five-line list of what still needs work' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  },
  {
    week: 52,
    slug: 'week-52',
    quarter: 4,
    level: 'C1',
    theme: { ko: '다음 해 계획', en: 'Next year' },
    title: { ko: '영어로 세우는 1년 계획', en: 'A year plan in English' },
    summary: {
      ko: '내년 학습 계획을 영어로 세우며 52주를 마무리합니다.',
      en: 'Write your plan for next year in English and close the fifty-two weeks.'
    },
    plan: {
      goals: {
        ko: ['내년 목표를 영어로 세웁니다.', '기간과 측정 방법을 함께 적습니다.', '52주를 마무리하며 회고합니다.'],
        en: ['Write your goals for next year in English.', 'Attach a period and a way to measure each one.', 'Look back and close the fifty-two weeks.']
      },
      grammar: { ko: '목표 표현 (I aim to, by the end of)', en: 'expressing goals and deadlines' },
      words: { ko: '계획·회고 어휘 16개', en: 'sixteen words for plans and reflection' },
      pron: { ko: '내 계획을 소리 내어 선언하기', en: 'saying your plan out loud' },
      output: { ko: '내년 계획 다섯 문장과 회고 세 문장', en: 'Five sentences for next year and three looking back' },
      parts: { ko: '약 10개 섹션 — 누적 어휘 복습·문법 총정리·오답 점검·받아쓰기·종합 퀴즈', en: 'about ten sections: cumulative vocabulary, a grammar recap, missed questions, dictation and a full quiz' }
    }
  }
];

/* ── 4분기 묶음 ───────────────────────────────────────────────────────────
   플랜 화면에서 주(week)를 4개 묶음으로 보여 줄 때 씁니다. */
var MAGAZINE_QUARTERS = [
  {
    quarter: 1,
    level: 'B1~B2',
    title: { ko: '1분기 · 생활 밀착 영어', en: 'Q1 · Everyday life' },
    lead: {
      ko: '여행·일상·직장처럼 바로 쓰는 상황을 다룹니다.',
      en: 'Situations you meet right away: travel, daily life and work.'
    }
  },
  {
    quarter: 2,
    level: 'B2',
    title: { ko: '2분기 · 일과 협업', en: 'Q2 · Work and collaboration' },
    lead: {
      ko: '업무에서 쓰는 문장과 협업 표현을 넓힙니다.',
      en: 'Widen your work English and the language of working together.'
    }
  },
  {
    quarter: 3,
    level: 'B2~C1',
    title: { ko: '3분기 · 세상과 문화', en: 'Q3 · The world and culture' },
    lead: {
      ko: '읽고 듣고 토론하는 힘을 기릅니다.',
      en: 'Build the strength to read, listen and discuss.'
    }
  },
  {
    quarter: 4,
    level: 'C1',
    title: { ko: '4분기 · 실전과 마무리', en: 'Q4 · Practice and wrap-up' },
    lead: {
      ko: '발표와 시험과 실전 상황으로 1년을 마무리합니다.',
      en: 'Close the year with presentations, tests and real situations.'
    }
  }
];

/* 발행된 주만, week 순으로. magazine.js 와 검증 스크립트가 씁니다. */
var MAGAZINE_ISSUES = MAGAZINE_WEEKS
  .filter(function (w) { return w.sections && w.sections.length; })
  .sort(function (a, b) { return a.week - b.week; });
