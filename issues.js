/* ==========================================================================
   EngMon — 호(issue)와 섹션 데이터
   ==========================================================================

   이 파일이 매거진의 "데이터베이스"입니다. magazine.js가 읽어 페이지를 그립니다.
   빌드 도구도 서버도 필요 없습니다.

   (JSON이 아니라 .js인 이유: file:// 로 index를 열어도 fetch가 막히지 않도록.
    데이터만 바꿀 때는 이 파일만 수정하면 됩니다.)

   ── 새 호 추가하기 ────────────────────────────────────────────────────────
   MAGAZINE_ISSUES 배열의 **맨 앞**에 객체를 하나 더 넣으세요. 배열 순서가
   그대로 "최신 호 → 지난 호" 순서가 되고, 표지의 호 선택기에 모두 나옵니다.

   ── 섹션에서 쓸 수 있는 필드 ───────────────────────────────────────────────
   id          필수. 앵커/진행률 저장에 쓰이는 고유 문자열 (영문/하이픈)
   kind        vocabulary | phrasal | collocation | grammar | pronunciation |
               idioms | slang | natural | conversation | listening | reading |
               writing | discussion | culture | quiz | humor | note
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

var MAGAZINE_ISSUES = [
  /* ══ 4호 — 시사·뉴스 영어 ═════════════════════════════════════════════ */
  {
    number: 4,
    slug: 'issue-04',
    date: '2026-10',
    status: 'published',
    level: 'B2',
    minutes: 45,
    theme: { ko: '시사·뉴스 영어', en: 'News and current affairs' },
    title: {
      ko: '영어 뉴스, 첫 문단부터 읽기',
      en: 'Reading English news from the first paragraph'
    },
    summary: {
      ko: '뉴스 문장은 짧고 정보가 빽빽합니다. 뉴스 어휘 8개, 구동사 6개, 연어 6개, 수동태와 헤드라인 문법, 발음 5개, 이디엄 6개, 인터뷰 표현, 회화 1장, 받아쓰기 4문장, 기사 독해와 요약 쓰기, 토론 질문 6개, 확인 문제 6개.',
      en: 'News sentences are short and dense. Eight news words, six phrasal verbs, six collocations, the passive and headline grammar, five pronunciation points, six idioms, interview language, one conversation, four dictation lines, a full article with a summary task, six discussion questions and six quiz items.'
    },

    sections: [
      /* 1. 뉴스 어휘 */
      {
        id: 'news-words',
        kind: 'vocabulary',
        level: 'B2',
        title: { ko: '뉴스 어휘 — 기사에서 매일 나오는 8단어', en: 'News words — eight that appear daily' },
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
          { en: 'verify', ko: '사실 여부를 확인하다', meaning: 'to check that something is true', example: 'We could not verify the number.', note: '뉴스에서 가장 중요한 동사입니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'news-phrasal',
        kind: 'phrasal',
        level: 'B2',
        title: { ko: '구동사 — 보도 문장을 짧게 만드는 6개', en: 'Phrasal verbs — six that tighten a report' },
        items: [
          { en: 'put out', ko: '발표하다, 내놓다', meaning: 'to publish or release something', example: 'The office put out a short statement.', note: '발표문에는 put out a statement를 씁니다' },
          { en: 'break down', ko: '하나씩 풀어 설명하다', meaning: 'to explain something in parts', example: 'Let us break down the numbers.', note: '고장 나다는 뜻도 있으니 문맥을 보세요' },
          { en: 'follow up on', ko: '계속 취재하다', meaning: 'to keep reporting on something', example: 'We will follow up on that complaint.', note: 'follow up with 사람, follow up on 사건입니다' },
          { en: 'tone down', ko: '표현을 누그러뜨리다', meaning: 'to make something less strong', example: 'They toned down the headline.', note: '수정 보도에서 자주 쓰입니다' },
          { en: 'back up', ko: '근거로 뒷받침하다', meaning: 'to support with evidence', example: 'The claim was not backed up by data.', note: '수동태로도 자주 씁니다' },
          { en: 'call out', ko: '공개적으로 지적하다', meaning: 'to criticise openly', example: 'Several papers called out the decision.', note: '직접 인용보다 논평 기사에 많습니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'news-collocation',
        kind: 'collocation',
        level: 'B2',
        title: { ko: '연어 — 기사에서 통째로 굳은 6쌍', en: 'Collocations — six fixed pairs in news writing' },
        items: [
          { en: 'run a story', ko: '기사를 싣다', meaning: 'to publish an article', example: 'Three outlets ran the same story.', note: 'publish보다 가볍게 씁니다' },
          { en: 'break the news', ko: '소식을 처음 전하다', meaning: 'to tell someone news for the first time', example: 'The family was told before the news broke.', note: '나쁜 소식에도, 좋은 소식에도 씁니다' },
          { en: 'cite a source', ko: '출처를 밝히다', meaning: 'to name where information came from', example: 'The article cited two unnamed sources.', note: 'quote는 말을 그대로 옮기는 것입니다' },
          { en: 'take a stance', ko: '입장을 분명히 하다', meaning: 'to state a clear position', example: 'The paper took a stance on the bill.', note: '사설에서 자주 쓰입니다' },
          { en: 'stay on top of', ko: '계속 파악하고 있다', meaning: 'to keep following a situation', example: 'We are staying on top of the story.', note: '취재 상황을 설명할 때 씁니다' },
          { en: 'fact-check', ko: '사실 여부를 검증하다', meaning: 'to check the facts of a claim', example: 'The claim was fact-checked within an hour.', note: '동사와 명사로 모두 씁니다' }
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
            'Headlines then drop whatever can be guessed. Auxiliary verbs, articles and the verb **be** disappear, so **City opens new library** stands for the full sentence below.'
          ],
          ko: [
            '수동태는 누가 했는지보다 **무엇이 일어났는지**에 초점을 둡니다. 행위자가 불분명하거나 뻔하거나 중요하지 않을 때 씁니다.',
            '헤드라인에서는 유추할 수 있는 것을 모두 생략합니다. 조동사, 관사, be동사가 사라져서 **City opens new library** 같은 형태가 됩니다.'
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
          { en: 'Minister denies report', ko: '장관이 보도를 부인했습니다.', note: '현재시제는 헤드라인에서 과거를 대신합니다', meaning: 'present tense standing for the past' }
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
          { en: 'The minister says the plan will work.', ko: '장관은 계획이 통할 것이라고 말합니다.', note: 'says는 "세즈"가 아니라 "səz"로 약해집니다.' }
        ],
        bullets: [
          { en: 'Numbers and names carry the stress; everything between them is reduced.', ko: '숫자와 이름에 강세가 실리고 그 사이는 모두 약해집니다.' },
          { en: 'Reported speech keeps a flat, steady rhythm on purpose.', ko: '인용 문장은 일부러 평평하고 일정한 리듬으로 읽습니다.' }
        ]
      },

      /* 6. 이디엄 */
      {
        id: 'news-idioms',
        kind: 'idioms',
        level: 'B2',
        title: { ko: '이디엄 — 뉴스룸에서 쓰는 6개', en: 'Idioms — six from the newsroom' },
        items: [
          { en: 'break a story', ko: '단독으로 처음 보도하다', meaning: 'to publish news before anyone else', example: 'The local paper broke the story.', note: 'break the news와 뜻이 다릅니다' },
          { en: 'hot off the press', ko: '갓 나온', meaning: 'very recently published', example: 'Here is the report, hot off the press.', note: '신문에서 시작한 표현입니다' },
          { en: 'get wind of', ko: '(소문을) 듣게 되다', meaning: 'to hear about something indirectly', example: 'Reporters got wind of the meeting.', note: '공식 발표가 아니라 흘러들어온 정보입니다' },
          { en: 'off the record', ko: '비공개로', meaning: 'not to be published', example: 'He spoke off the record.', note: 'on the record는 인용해도 된다는 뜻입니다' },
          { en: 'on the record', ko: '공개 발언으로', meaning: 'allowed to be published', example: 'Nothing was said on the record.', note: '인터뷰에서 반드시 확인해야 할 구분입니다' },
          { en: 'spin a story', ko: '유리하게 포장하다', meaning: 'to present events in a favourable way', example: 'Both sides spun the story their way.', note: 'spin은 명사로도 씁니다' }
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
          { en: 'Is that because the review is still open?', ko: '검토가 진행 중이기 때문입니까?', meaning: 'is that the reason', example: 'Is that because of the delay?', note: '이유를 되짚는 질문입니다' }
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
          { en: 'The trial is meant to answer it.', ko: '그걸 확인하려는 시험 운행입니다.', meaning: 'the purpose of the trial', example: 'The pilot is meant to test demand.', note: 'be meant to + 동사원형이 핵심입니다' }
        ]
      },

      /* 9. 듣기·받아쓰기 */
      {
        id: 'news-listening',
        kind: 'listening',
        level: 'B2',
        title: { ko: '듣기·받아쓰기 — 보도 문장 4개', en: 'Listening and dictation — four report sentences' },
        intro: {
          ko: '숫자와 날짜가 들어간 문장입니다. 숫자를 놓치지 않는 것이 목표입니다.',
          en: 'These carry numbers and dates. The goal is not to lose the figures.'
        },
        dictation: [
          { en: 'The report was published on Tuesday morning.', ko: '보고서는 화요일 아침에 공개되었습니다.' },
          { en: 'Officials said the review would take about six weeks.', ko: '당국은 검토에 약 6주가 걸릴 것이라고 밝혔습니다.' },
          { en: 'The figure is up by four percent on last year.', ko: '수치는 작년보다 4퍼센트 올랐습니다.' },
          { en: 'A decision is expected before the end of the month.', ko: '결정은 이달 말 전에 나올 것으로 보입니다.' },
          { en: 'The company has not responded to our questions.', ko: '회사는 우리 질문에 답하지 않았습니다.' }
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
        questions: [
          { ko: '첫 문단에 들어 있는 사실 세 가지를 찾아보세요.', en: 'List three facts from the first paragraph.' },
          { ko: '반대하는 쪽의 주장은 무엇이고, 매체는 어떻게 다루었나요?', en: 'What is the objection, and how does the article handle it?' }
        ]
      },

      /* 11. 쓰기 */
      {
        id: 'news-writing',
        kind: 'writing',
        level: 'B2',
        title: { ko: '쓰기 — 기사 세 줄 요약', en: 'Writing — a three-line news summary' },
        intro: {
          ko: '뉴스 요약은 영어로 사고를 정리하는 가장 빠른 훈련입니다.',
          en: 'Summarising news is the fastest training for thinking in English.'
        },
        bullets: [
          { en: 'Line 1 — what happened, in the passive if the actor does not matter.', ko: '1줄 — 무슨 일이 있었는지. 행위자가 중요하지 않으면 수동태로.' },
          { en: 'Line 2 — the number, date or figure that anchors the story.', ko: '2줄 — 숫자·날짜·수치처럼 기사를 붙잡아 주는 정보.' },
          { en: 'Line 3 — who disagrees, and what happens next.', ko: '3줄 — 반대하는 쪽과 앞으로의 일정.' }
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
        title: { ko: '토론 — 뉴스와 미디어에 대한 6가지 질문', en: 'Discussion — six questions on news and media' },
        questions: [
          { ko: '영어 뉴스를 읽을 때 가장 먼저 막히는 부분은 어디인가요?', en: 'Where do you get stuck first when you read English news?' },
          { ko: '헤드라인만 보고 내용을 짐작한 적이 있나요?', en: 'Have you ever judged a story from the headline alone?' },
          { ko: '출처를 확인하는 습관이 있나요?', en: 'Do you check where a story came from?' },
          { ko: '같은 사건을 다르게 보도한 기사를 비교해 본 적이 있나요?', en: 'Have you compared two reports of the same event?' },
          { ko: '뉴스를 영어로 요약하는 습관을 들이려면 어떻게 해야 할까요?', en: 'How could you build a habit of summarising news in English?' },
          { ko: '짧은 영상 뉴스와 기사 중 어느 쪽이 학습에 더 도움이 되나요?', en: 'Which helps you learn more, short video news or written articles?' }
        ]
      },
      /* 13. 수치 표현 */
      {
        id: 'news-figures',
        kind: 'vocabulary',
        level: 'B2',
        title: { ko: '수치 표현 — 그래프를 문장으로 옮기는 6개', en: 'Figures — six ways to put a chart into words' },
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
          { en: 'on par with', ko: '~와 비슷한 수준인', meaning: 'at the same level as', example: 'Output is now on par with last year.', note: 'compare with는 비교한다는 뜻입니다' }
        ]
      },

      /* 14. 확인 문제 */
      {
        id: 'news-quiz',
        kind: 'quiz',
        level: 'B2',
        title: { ko: '확인 문제 — 6문항', en: 'Quiz — six questions' },
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
          { en: '**Do not translate every word** — skim with the numbers and names first.', ko: '**모든 단어를 옮기지 마세요** — 숫자와 이름만 먼저 훑고 내용을 잡으세요.' }
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
            'That is why the same event can read very differently in two outlets without either one lying. What changes is which fact goes first, which verb carries the sentence, and whose voice is quoted. Reading two reports of one event is the fastest way to see it.'
          ],
          ko: [
            '영어권 뉴스는 **보도**와 **의견**을 우리가 기대하는 것보다 엄격하게 나놓습니다. 기자는 입장을 취하지 않고, 입장은 사설면에 둡니다.',
            '그래서 둘 다 거짓말하지 않아도 같은 사건이 전혀 다른 글로 읽힙니다. 어떤 사실을 앞에 두는지, 어떤 동사를 쓰는지, 누구 말을 인용하는지가 달라지기 때문입니다. 같은 사건의 두 기사를 비교해 읽는 것이 가장 빠른 방법입니다.'
          ]
        },
        items: [
          { en: 'according to', ko: '~에 따르면', meaning: 'as stated by', example: 'According to the review, demand is rising.', note: '출처를 문장 안에 밝히는 기본 표현입니다' },
          { en: 'declined to comment', ko: '논평을 거부했다', meaning: 'refused to give a statement', example: 'The company declined to comment.', note: '보도에서 가장 자주 보이는 문장입니다' },
          { en: 'reportedly', ko: '보도에 따르면', meaning: 'according to reports', example: 'The plan is reportedly under review.', note: '확인되지 않은 내용에 붙입니다' },
          { en: 'a spokesperson said', ko: '대변인이 말했다', meaning: 'the official voice of an organisation', example: 'A spokesperson said the office was reviewing it.', note: '개인 이름 대신 직함으로 밝힐 때 씁니다' }
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

  /* ══ 3호 — 일상 회화 ═════════════════════════════════════════════════ */
  {
    number: 3,
    slug: 'issue-03',
    date: '2026-09',
    status: 'published',
    level: 'B1',
    minutes: 45,
    theme: { ko: '일상 회화', en: 'Everyday conversation' },
    title: {
      ko: '매일 쓰는 말투로 말하기',
      en: 'Speak like you actually do every day'
    },
    summary: {
      ko: '교과서 영어와 진짜 회화의 간격을 좁힙니다. 일상 어휘 8개, 구동사 6개, 연어 6개, 축약 발음 5개, 슬랭 6개, 이디엄 6개, 대화 3장, 받아쓰기 4문장, 독해 1편, 작문 템플릿, 토론 질문 6개, 확인 문제 6개.',
      en: 'Closing the gap between textbook English and real conversation: eight everyday words, six phrasal verbs, six collocations, five reductions, six slang items, six idioms, three dialogues, four dictation lines, one reading passage, a writing template, six discussion questions and six quiz items.'
    },

    sections: [
      /* 1. 일상 어휘 */
      {
        id: 'daily-words',
        kind: 'vocabulary',
        level: 'A2',
        title: { ko: '일상 어휘 — 하루에 한 번은 쓰는 8단어', en: 'Everyday words — eight you use daily' },
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
          { en: 'wind down', ko: '긴장을 풀다, 마무리하다', meaning: 'to relax after something busy', example: 'I wind down with a short walk.', note: '하루를 마감하며 쉬는 시간에 씁니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'daily-phrasal',
        kind: 'phrasal',
        level: 'B1',
        title: { ko: '구동사 — 뜻이 통째로 달라지는 6개', en: 'Phrasal verbs — six that change meaning completely' },
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
          { en: 'come up with', ko: '생각해 내다', meaning: 'to think of an idea or plan', example: 'She came up with a great name.', note: '아이디어·해결책에 씁니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'daily-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 같이 다니는 단어 짝 6개', en: 'Collocations — six word partnerships' },
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
          { en: 'make sense', ko: '말이 되다', meaning: 'to be logical or clear', example: 'That makes sense now.', note: 'Does that make sense? 는 설명 뒤 확인 표현입니다' }
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
            '**used to + 동사원형** is about a past habit that is no longer true. It never appears in the present tense.',
            '**be used to + 명사/-ing** means you are familiar with something. The **to** here is a preposition, so a noun or an -ing form follows.',
            '**get used to** is the process of becoming familiar. It is the one you need when you move somewhere new.'
          ],
          ko: [
            '**used to + 동사원형**은 지금은 더 이상 아닌 과거의 습관입니다. 현재시제로는 쓸 수 없습니다.',
            '**be used to + 명사/-ing**는 어떤 것에 익숙하다는 뜻입니다. 여기서 to는 전치사라서 명사나 -ing가 옵니다.',
            '**get used to**는 익숙해지는 과정입니다. 새 환경에 적응할 때 쓰는 표현입니다.'
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
          { en: 'Did you use to cycle here?', ko: '예전에 여기서 자전거를 타곤 했나요?', note: '의문문은 did + use to (d가 사라집니다)', meaning: 'question form of used to' }
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
          ko: '들은 대로 적으면 틀리고, 적힌 대로 들으면 안 들립니다. 줄어드는 규칙 다섯 가지만 익히세요.',
          en: 'Write what you hear and you are wrong. Expect what is written and you hear nothing. Learn five reductions.'
        },
        items: [
          { en: 'What do you want?', ko: '뭐 원해요?', note: '실제로는 "와러유 원트"처럼 들립니다. do you가 붙어 /dʒə/가 됩니다.' },
          { en: 'I am going to call you.', ko: '전화할게요.', note: 'going to는 "고나"에 가깝게 줄어듭니다.' },
          { en: 'Let me see.', ko: '어디 보자.', note: 'Let me는 "레미"처럼 붙습니다.' },
          { en: 'Give me a second.', ko: '잠깐만요.', note: 'Give me는 "김미"가 됩니다.' },
          { en: 'Do you know him?', ko: '그 사람 알아요?', note: 'Do you는 "듀" 또는 "주"로 줄어듭니다.' }
        ],
        bullets: [
          { en: 'Function words shrink. Content words stay clear.', ko: '기능어(do, you, to, me)는 줄고, 내용어(want, call, second)는 또렷하게 남습니다.' },
          { en: 'Stress the last content word in the sentence.', ko: '문장에서 마지막 내용어에 강세를 두면 훨씬 자연스럽게 들립니다.' }
        ]
      },

      /* 6. 슬랭 */
      {
        id: 'daily-slang',
        kind: 'slang',
        level: 'B1',
        title: { ko: '슬랭 — 알아두면 편한 6가지', en: 'Slang — six you should recognise' },
        intro: {
          ko: '먼저 알아듣는 것이 목표입니다. 격식 있는 자리에서는 쓰지 않는 편이 안전합니다.',
          en: 'Recognition comes first. In formal settings it is safer not to use these yourself.'
        },
        items: [
          { en: 'No worries.', ko: '괜찮아요.', meaning: 'that is fine, do not apologise', example: 'No worries, it happens.', note: '영국·호주에서 특히 자주 들립니다' },
          { en: 'My bad.', ko: '내 잘못이야.', meaning: 'I made a mistake', example: 'My bad, I sent the old file.', note: '가벼운 사과로만 씁니다' },
          { en: 'Fair enough.', ko: '그럴 만하네요.', meaning: 'that is reasonable', example: 'Fair enough, we can wait.', note: '상대 주장을 인정할 때 씁니다' },
          { en: 'That works.', ko: '좋아요, 그렇게 하죠.', meaning: 'that is acceptable to me', example: 'Tuesday at three? That works.', note: '일정을 확정할 때 자주 씁니다' },
          { en: 'I am down.', ko: '나도 할래.', meaning: 'I want to join', example: 'A movie tonight? I am down.', note: '제안에 동의하는 캐주얼한 표현입니다' },
          { en: 'No big deal.', ko: '별거 아니에요.', meaning: 'it is not important', example: 'No big deal, we can redo it.', note: '감사의 말에 대한 답으로도 씁니다' }
        ]
      },

      /* 7. 이디엄 */
      {
        id: 'daily-idioms',
        kind: 'idioms',
        level: 'B1',
        title: { ko: '이디엄 — 일상에서 자주 나오는 6개', en: 'Idioms — six that come up all the time' },
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
          { en: 'out of the blue', ko: '갑자기, 난데없이', meaning: 'unexpectedly', example: 'She called me out of the blue.', note: '예상 못 한 일에 씁니다' }
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
          { en: 'I will text you the address.', ko: '주소는 문자로 보낼게.', meaning: 'I will send it by message', example: 'I will text you the details.', note: 'will은 즉석 결정에 씁니다' }
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
          { en: 'What about you?', ko: '너는 어때?', meaning: 'and you', example: 'I am fine. What about you?', note: '질문을 되돌려 줄 때 씁니다' }
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
          { en: 'That is all, thanks.', ko: '그게 전부예요, 감사합니다.', meaning: 'nothing more, thank you', example: 'That is all for now, thanks.', note: '주문을 마무리하는 표현입니다' }
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
          { en: 'I will bring the drinks if you bring the snacks.', ko: '내가 음료 가져갈 테니 너는 간식을 가져와.' }
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
        questions: [
          { ko: '이 글에서 성공을 가른 것은 무엇이라고 말하나요?', en: 'What does the passage say separates people who improve?' },
          { ko: '저자는 왜 시간의 양보다 행동이 중요하다고 하나요?', en: 'Why does the writer value the action over the amount of time?' }
        ]
      },

      /* 13. 쓰기 */
      {
        id: 'daily-writing',
        kind: 'writing',
        level: 'B1',
        title: { ko: '쓰기 — 하루 3문장 일기', en: 'Writing — a three-sentence journal' },
        intro: {
          ko: '길게 쓸 필요 없습니다. 세 문장이면 충분하고, 매일이 어렵지 않습니다.',
          en: 'Length is not the point. Three sentences are enough, and they are repeatable.'
        },
        bullets: [
          { en: 'Sentence 1 — what happened, in the past tense.', ko: '1문장 — 오늘 있었던 일, 과거시제로.' },
          { en: 'Sentence 2 — how you felt, with one adjective.', ko: '2문장 — 어땠는지, 형용사 하나로.' },
          { en: 'Sentence 3 — what you will do next, with will or going to.', ko: '3문장 — 다음에 할 일, will이나 be going to로.' }
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
            'That is why the answer matters less than the follow-up. You are expected to give a short answer, then hand the question back. Answering fully and stopping is what makes a conversation feel cold.'
          ],
          ko: [
            '스몰토크는 정보를 얻으려는 대화가 아닙니다. 대부분의 영어권 직장에서 본론을 꺼내기 전에 **나는 적이 아니다**라고 알리는 신호입니다.',
            '그래서 대답의 내용보다 되묻는지가 중요합니다. 짧게 답하고 질문을 되돌려 주는 것이 예의입니다. 길게 답하고 끝내면 대화가 차갑게 느껴집니다.'
          ]
        },
        items: [
          { en: 'How is your week going?', ko: '이번 주 어때요?', note: 'How are you보다 대답하기 쉽고 자연스럽습니다' },
          { en: 'Have you got any plans for the weekend?', ko: '주말에 계획 있어요?', note: '영국식 Have you got, 미국식 Do you have' },
          { en: 'I know what you mean.', ko: '무슨 말인지 알겠어요.', note: '맞장구의 기본입니다' },
          { en: 'Anyway, how about you?', ko: '그나저나, 당신은 어때요?', note: 'Anyway로 화제를 넘기면 어색하지 않습니다' }
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
        title: { ko: '토론 — 6가지 질문', en: 'Discussion — six questions' },
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
          { ko: '영어로 말할 때 자신감을 높이는 방법은 무엇일까요?', en: 'What actually raises your confidence when you speak?' }
        ]
      },

      /* 16. 확인 문제 */
      {
        id: 'daily-quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 6문항', en: 'Quiz — six questions' },
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
          { en: '**Slang is for listening first** — understand it, then decide whether to use it.', ko: '**슬랭은 듣기가 먼저입니다** — 알아듣고 나서 쓸지 결정하세요.' }
        ]
      }
    ]
  },

  /* ══ 2호 — 직장 영어 ═════════════════════════════════════════════════ */
  {
    number: 2,
    slug: 'issue-02',
    date: '2026-08',
    status: 'published',
    level: 'B1',
    minutes: 40,
    theme: { ko: '직장 영어', en: 'English at work' },
    title: {
      ko: '회의와 이메일에서 통하는 문장',
      en: 'Sentences that work in meetings and email'
    },
    summary: {
      ko: '돌려 말하지 않고도 정중하게 말하는 법. 업무 어휘 7개, 구동사 6개, 연어 6개, 정중 표현 문법, 비즈니스 이디엄 5개, 회의 대화 2장, 이메일 작문, 받아쓰기 4문장, 확인 문제 6개.',
      en: 'Being polite without being vague: seven work words, six phrasal verbs, six collocations, a grammar point on polite forms, five business idioms, two meetings, one email template, four dictation lines and six quiz items.'
    },

    sections: [
      /* 1. 업무 어휘 */
      {
        id: 'work-words',
        kind: 'vocabulary',
        level: 'B1',
        title: { ko: '업무 어휘 — 회의에서 매일 나오는 7단어', en: 'Work words — seven that come up daily' },
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
          { en: 'alignment', ko: '방향 일치', meaning: 'agreement on the plan', example: 'We need alignment before we start.', note: 'We are aligned라고도 합니다' }
        ]
      },

      /* 2. 구동사 */
      {
        id: 'work-phrasal',
        kind: 'phrasal',
        level: 'B1',
        title: { ko: '구동사 — 이메일을 짧게 만드는 6개', en: 'Phrasal verbs — six that shorten your email' },
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
          { en: 'take over', ko: '넘겨받다', meaning: 'to take responsibility for something', example: 'Mina will take over the client account.', note: 'hand over는 넘겨주는 쪽입니다' }
        ]
      },

      /* 3. 연어 */
      {
        id: 'work-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 문서에서 틀리기 쉬운 6쌍', en: 'Collocations — six pairs that go wrong in writing' },
        items: [
          { en: 'meet a deadline', ko: '마감을 지키다', meaning: 'to finish on time', example: 'We met the deadline by two hours.', note: 'keep a deadline보다 meet을 씁니다' },
          { en: 'raise a concern', ko: '우려를 제기하다', meaning: 'to mention a worry', example: 'I would like to raise a concern about cost.', note: 'say a concern은 어색합니다' },
          { en: 'set up a meeting', ko: '회의를 잡다', meaning: 'to arrange a meeting', example: 'Can you set up a meeting for Monday?', note: 'arrange a meeting도 좋습니다' },
          { en: 'take minutes', ko: '회의록을 작성하다', meaning: 'to write the meeting notes', example: 'Who is taking minutes today?', note: 'minutes는 항상 복수입니다' },
          { en: 'give an update', ko: '현황을 알리다', meaning: 'to report the current state', example: 'Let me give a quick update.', note: 'update on + 대상 형태로도 씁니다' },
          { en: 'meet expectations', ko: '기대에 부응하다', meaning: 'to be as good as expected', example: 'The result met our expectations.', note: 'live up to expectations도 같은 뜻입니다' }
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
            'The most useful pattern for work is **Could you + 동사원형**. It is polite enough for a client and short enough for a chat message.'
          ],
          ko: [
            '**can**에서 **would you mind** 쪽으로 갈수록 부탁이 부드러워집니다. 다만 부드러움이 항상 좋은 것은 아닙니다. 가까운 동료에게 지나치게 격식 있는 문장은 오히려 거리를 만듭니다.',
            '업무에서 가장 요긴한 형태는 **Could you + 동사원형**입니다. 고객에게도 충분히 정중하고, 메신저에 쓰기에도 짧습니다.'
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
          { en: 'Let me know if that works for you.', ko: '괜찮으신지 알려 주세요.', note: '부탁을 닫는 문장으로 좋습니다' }
        ],
        quote: {
          ko: '정중함은 길이가 아니라 조동사로 만듭니다. Could you 하나면 충분합니다.',
          en: 'Politeness comes from the modal, not the length. Could you is usually enough.'
        }
      },

      /* 5. 이디엄 */
      {
        id: 'work-idioms',
        kind: 'idioms',
        level: 'B2',
        title: { ko: '비즈니스 이디엄 — 회의에서 들리는 5개', en: 'Business idioms — five you hear in meetings' },
        items: [
          { en: 'touch base', ko: '짧게 상황을 공유하다', meaning: 'to make brief contact', example: 'Let us touch base on Friday.', note: '길게 논의하지 않고 확인만 하는 느낌입니다' },
          { en: 'ballpark figure', ko: '대략적인 수치', meaning: 'a rough estimate', example: 'Can you give me a ballpark figure?', note: '정확한 값이 아니어도 된다는 신호입니다' },
          { en: 'on the same page', ko: '같은 이해를 가진', meaning: 'sharing the same understanding', example: 'Let us make sure we are on the same page.', note: '회의 마무리에 자주 씁니다' },
          { en: 'move the needle', ko: '실질적인 변화를 만들다', meaning: 'to make a real difference', example: 'This feature will not move the needle.', note: '성과가 크지 않다는 뜻으로도 씁니다' },
          { en: 'in the loop', ko: '정보를 공유받는', meaning: 'informed about something', example: 'Please keep me in the loop.', note: 'out of the loop은 반대 상황입니다' }
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
          { en: 'Could we run a smaller version first?', ko: '작은 버전으로 먼저 해 보면 어떨까요?', note: '제안은 Could we + 동사원형으로 부드럽게' }
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
          { en: 'Let us review internally first.', ko: '우리끼리 먼저 검토하죠.', note: 'Let us는 함께 하자는 제안입니다' }
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
          { en: 'Line 5 — Thanks, and your name.', ko: '5줄 — 맺음말과 이름.' }
        ],
        items: [
          { en: 'Following our call, I have attached the summary.', ko: '통화에 이어 요약을 첨부했습니다.', note: '첫 줄 — 대화를 이어받는 표현입니다' },
          { en: 'Could you confirm the numbers by Thursday?', ko: '목요일까지 수치를 확인해 주시겠어요?', note: '둘째 줄 — 요청은 하나만' },
          { en: 'Let me know if you need anything from me.', ko: '제가 도울 일이 있으면 알려 주세요.', note: '넷째 줄 — 상대 부담을 낮춥니다' },
          { en: 'Happy to adjust if the timing does not suit.', ko: '일정이 맞지 않으면 조정하겠습니다.', note: '거절당할 여지를 미리 열어 두는 문장입니다' }
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
        title: { ko: '듣기·받아쓰기 — 업무 문장 4개', en: 'Listening and dictation — four work sentences' },
        intro: {
          ko: '실제 회의에서 그대로 나오는 문장입니다. 들리는 대로 적어 보세요.',
          en: 'These come up word for word in real meetings. Write what you hear.'
        },
        dictation: [
          { en: 'Just to confirm, the deadline is next Wednesday.', ko: '확인차 말씀드리면, 마감은 다음 주 수요일입니다.' },
          { en: 'I will send the updated file this afternoon.', ko: '오늘 오후에 수정된 파일을 보내겠습니다.' },
          { en: 'Sorry, could you repeat the last part?', ko: '죄송하지만 마지막 부분을 다시 말씀해 주시겠어요?' },
          { en: 'Let us set up a short call to go over the details.', ko: '세부 내용을 볼 짧은 통화를 잡죠.' }
        ],
        items: [
          { en: 'Just to confirm, ...', ko: '확인차 말씀드리면', note: '통화·메일 모두에서 재확인할 때 씁니다' },
          { en: 'Could you repeat the last part?', ko: '마지막 부분을 다시 말해 주시겠어요?', note: '못 들었을 때 가장 안전한 문장입니다' },
          { en: 'go over the details', ko: '세부 내용을 훑다', note: 'review보다 회화적입니다' }
        ]
      },

      /* 10. 토론 */
      {
        id: 'work-discussion',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '토론 — 일과 영어에 대한 5가지 질문', en: 'Discussion — five questions about work and English' },
        questions: [
          { ko: '영어 회의에서 가장 말하기 어려운 순간은 언제인가요?', en: 'When is speaking up hardest for you in an English meeting?' },
          { ko: '정중함과 솔직함 중 어느 쪽이 더 어렵나요?', en: 'Which is harder for you, being polite or being direct?' },
          { ko: '이메일을 영어로 쓸 때 시간이 가장 오래 걸리는 부분은 어디인가요?', en: 'Which part of writing an English email takes you longest?' },
          { ko: '모르는 단어가 나왔을 때 어떻게 넘기나요?', en: 'How do you move past a word you do not know?' },
          { ko: '업무 영어를 늘리는 현실적인 방법은 무엇일까요?', en: 'What is a realistic way to grow your work English?' }
        ]
      },

      /* 11. 확인 문제 */
      {
        id: 'work-quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 6문항', en: 'Quiz — six questions' },
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
            options: ['인사말', '요청 한 가지', '첨부 안내', '서명'],
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
          }
        ]
      },

      /* 12. 해설 노트 */
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
          { en: '**Ask again politely** — Could you repeat the last part? is always acceptable.', ko: '**다시 묻는 것은 실례가 아닙니다** — 마지막 부분을 다시 말해 달라고 해도 됩니다.' }
        ]
      }
    ]
  },

  /* ══ 1호 — 여행 영어 ═════════════════════════════════════════════════ */
  {
    number: 1,
    slug: 'issue-01',
    date: '2026-07',
    status: 'published',
    level: 'B1',
    minutes: 40,
    theme: { ko: '여행 영어', en: 'Travel English' },
    title: {
      ko: '공항에서 호텔까지, 여행 영어 한 호',
      en: 'From airport to hotel — one issue of travel English'
    },
    summary: {
      ko: '여행에서 실제로 쓰는 표현만 모았습니다. 테마 어휘 8개, 문법 1가지, 구동사 6개, 연어 6개, 발음 5개, 이디엄 6개, 대화 3장, 받아쓰기 4문장, 토론 질문 6개, 확인 문제 6개.',
      en: 'Only the expressions you actually use on a trip: eight theme words, one grammar point, six phrasal verbs, six collocations, five pronunciation points, six idioms, three dialogues, four dictation lines, six discussion questions and six quiz items.'
    },

    sections: [
      /* ── 1. 테마 어휘 ─────────────────────────────────────────────── */
      {
        id: 'theme-words',
        kind: 'vocabulary',
        level: 'A2',
        title: { ko: '테마 어휘 — 여행 필수 8단어', en: 'Theme words — eight you need for travel' },
        intro: {
          ko: '이 여덟 개만 손에 익히면 여행 중 대부분의 상황을 문장으로 만들 수 있습니다.',
          en: 'Get these eight into your hands and you can build most travel sentences.'
        },
        items: [
          { en: 'itinerary', ko: '여행 일정표', meaning: 'a plan of a journey', example: 'Do you have the itinerary?', note: '복수형은 itineraries입니다' },
          { en: 'boarding pass', ko: '탑승권', meaning: 'the card that lets you board', example: 'Could I see your boarding pass?', note: '모바일 탑승권은 mobile boarding pass입니다' },
          { en: 'layover', ko: '경유 대기', meaning: 'a wait between flights', example: 'I have a three-hour layover in Tokyo.', note: 'stopover는 하루 이상 머무는 경유입니다' },
          { en: 'check-in', ko: '체크인, 수속', meaning: 'the process of registering', example: 'Online check-in opens tomorrow.', note: '명사와 동사로 모두 씁니다' },
          { en: 'customs', ko: '세관', meaning: 'the place that inspects goods', example: 'We went through customs quickly.', note: '항상 복수로 씁니다' },
          { en: 'departure', ko: '출발', meaning: 'the act of leaving', example: 'The departure gate changed to 42.', note: '반대말은 arrival입니다' },
          { en: 'aisle seat', ko: '통로 좌석', meaning: 'a seat next to the walkway', example: 'An aisle seat, please.', note: 'aisle은 s를 소리 내지 않습니다' },
          { en: 'carry-on', ko: '기내 수하물', meaning: 'a bag you take on board', example: 'This is my carry-on only.', note: 'checked baggage는 부치는 짐입니다' }
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
            'The moment you say when, the past simple takes over. Compare the two sentences side by side.'
          ],
          ko: [
            '지금까지의 경험을 말할 때는 현재완료(have + p.p.)를 씁니다. 언제였는지는 중요하지 않습니다.',
            '언제였는지를 말하는 순간 기준이 그 시점이 되므로 과거시제를 씁니다. 두 문장을 나란히 비교해 보세요.'
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
          { en: 'I have never flown alone.', ko: '나는 혼자 비행기를 타본 적이 없다.', note: 'never는 한 번도', meaning: 'not once in my life' }
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
        title: { ko: '구동사 — 공항과 호텔에서 6개', en: 'Phrasal verbs — six for airports and hotels' },
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
          { en: 'look forward to', ko: '기대하다', meaning: 'to wait for something happily', example: 'I am looking forward to the trip.', note: 'to 뒤에 명사나 -ing가 옵니다' }
        ]
      },

      /* ── 4. 연어 ─────────────────────────────────────────────────── */
      {
        id: 'travel-collocation',
        kind: 'collocation',
        level: 'B1',
        title: { ko: '연어 — 여행에서 틀리기 쉬운 6쌍', en: 'Collocations — six pairs travellers get wrong' },
        items: [
          { en: 'catch a flight', ko: '비행기를 타다', meaning: 'to be in time for a flight', example: 'I have to catch a flight at six.', note: 'take a flight도 쓰지만 catch가 시간 맞춰 탄다는 뉘앙스입니다' },
          { en: 'book a room', ko: '방을 예약하다', meaning: 'to reserve a room', example: 'I booked a room for three nights.', note: 'reserve a room도 맞습니다' },
          { en: 'miss a connection', ko: '환승을 놓치다', meaning: 'to be too late for the next flight', example: 'We missed the connection in Doha.', note: '연결편은 connection입니다' },
          { en: 'get a refund', ko: '환불받다', meaning: 'to receive your money back', example: 'Can I get a refund for this ticket?', note: '환불은 refund, 교환은 exchange입니다' },
          { en: 'pay in cash', ko: '현금으로 내다', meaning: 'to pay with notes and coins', example: 'Do you take cards, or should I pay in cash?', note: 'by card, in cash로 전치사가 다릅니다' },
          { en: 'make a reservation', ko: '예약하다', meaning: 'to arrange in advance', example: 'I made a reservation under Kim.', note: '식당에서는 reservation, 숙소에서는 booking도 씁니다' }
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
          { en: 'The flight has been delayed by an hour.', ko: '항공편이 한 시간 지연되었습니다.', note: 'has been delayed는 수동태 현재완료입니다.' }
        ],
        bullets: [
          { en: 'Numbers, gates and times are stressed. Everything else is fast.', ko: '숫자·게이트·시간만 또렷합니다. 나머지는 빠르게 지나갑니다.' },
          { en: 'Listen for the verb first: boarding, delayed, cancelled.', ko: '동사부터 들으세요. boarding, delayed, cancelled 중 무엇인지가 핵심입니다.' }
        ]
      },

      /* ── 6. 이디엄 ────────────────────────────────────────────────── */
      {
        id: 'idioms',
        kind: 'idioms',
        level: 'B1',
        title: { ko: '이디엄 — 이동과 여행의 6가지', en: 'Idioms — six for travel and moving around' },
        intro: {
          ko: '직역하면 뜻이 통하지 않습니다. 통째로 외우는 편이 빠릅니다.',
          en: 'Word-for-word translation will not help. Learn these as single chunks.'
        },
        items: [
          { en: 'catch a flight', ko: '비행기를 타다 (시간 맞춰)', meaning: 'to be in time for a flight', example: 'I have to catch a flight at six.', note: 'catch는 시간에 맞춘다는 느낌입니다' },
          { en: 'hit the road', ko: '길을 나서다', meaning: 'to start driving or travelling', example: 'Let us hit the road before the traffic builds up.', note: '아침 출발을 재촉할 때 씁니다' },
          { en: 'travel light', ko: '짐을 가볍게 하다', meaning: 'to take very little luggage', example: 'Travel light and you will move faster.', note: '짐을 줄이라는 조언으로 자주 들립니다' },
          { en: 'off the beaten track', ko: '외진 곳의', meaning: 'away from the usual tourist places', example: 'We stayed somewhere off the beaten track.', note: 'beaten track은 사람들이 다니는 길입니다' },
          { en: 'in the middle of nowhere', ko: '외딴 곳에', meaning: 'far from any town', example: 'The hotel was in the middle of nowhere.', note: '불평과 감탄 두 가지로 모두 씁니다' },
          { en: 'live out of a suitcase', ko: '여행 다니며 지내다', meaning: 'to travel constantly', example: 'I have been living out of a suitcase all month.', note: '출장이 잦은 사람에게 씁니다' }
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
          { en: 'I am travelling with a friend.', ko: '친구와 함께 여행 중입니다.', meaning: 'someone is travelling with me', example: 'I am travelling with my sister.', note: '여행 동반자를 밝히면 추가 질문이 줄어듭니다' }
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
          { en: 'Is breakfast included?', ko: '조식이 포함되어 있나요?', meaning: 'does the price cover breakfast', example: 'Is breakfast included in the rate?', note: 'rate는 1박 요금입니다' }
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
          { en: 'Keep the change.', ko: '거스름돈은 가지세요.', meaning: 'you can keep the rest', example: 'Twenty is fine, keep the change.', note: '팁을 줄 때 쓰는 가장 짧은 문장입니다' }
        ]
      },

      /* ── 10. 듣기·받아쓰기 ───────────────────────────────────────── */
      {
        id: 'travel-listening',
        kind: 'listening',
        level: 'B1',
        title: { ko: '듣기·받아쓰기 — 여행 문장 4개', en: 'Listening and dictation — four travel sentences' },
        intro: {
          ko: '공항과 호텔에서 그대로 나오는 문장입니다. 들리는 대로 적어 보세요.',
          en: 'You will hear these word for word. Type what you hear.'
        },
        dictation: [
          { en: 'Your flight has been delayed by about forty minutes.', ko: '항공편이 약 40분 지연되었습니다.' },
          { en: 'Could I see your passport and boarding pass, please?', ko: '여권과 탑승권을 보여 주시겠어요?' },
          { en: 'I would like to change my seat if possible.', ko: '가능하면 좌석을 바꾸고 싶습니다.' },
          { en: 'Is there a shuttle from the airport to the hotel?', ko: '공항에서 호텔로 가는 셔틀이 있나요?' }
        ],
        items: [
          { en: 'delayed by about forty minutes', ko: '약 40분 지연', meaning: 'late by roughly forty minutes', example: 'The flight was delayed by two hours.', note: 'delay 뒤에는 by가 옵니다' },
          { en: 'I would like to change my seat.', ko: '좌석을 바꾸고 싶습니다.', meaning: 'I want to change my seat, politely', example: 'I would like to change my room.', note: 'I want보다 정중한 기본형입니다' },
          { en: 'Is there a shuttle?', ko: '셔틀이 있나요?', meaning: 'does a shuttle service exist', example: 'Is there a bus to the city?', note: 'Is there + 명사 패턴입니다' }
        ]
      },

      /* ── 11. 토론 ────────────────────────────────────────────────── */
      {
        id: 'group-talk',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '그룹 토크 — 여행에 대한 6가지 질문', en: 'Group talk — six questions about travel' },
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
          { ko: '혼자 여행과 함께 여행 중 어느 쪽을 선호하나요?', en: 'Do you prefer travelling alone or with others?' }
        ]
      },

      /* ── 12. 문화 ────────────────────────────────────────────────── */
      {
        id: 'culture',
        kind: 'culture',
        level: 'B1',
        title: { ko: '문화 — 팁 문화가 낯선 사람들을 위해', en: 'Culture — travelling where tipping is unfamiliar' },
        body: {
          en: [
            'Tipping is one of the easiest things to get wrong. Where it is expected, it is part of the price of service, not a sign of friendliness.',
            'Where it is not expected, offering it can be awkward. Carry a little cash and quietly ask at the counter — that is the safest route.'
          ],
          ko: [
            '한국에서 온 여행자에게 가장 헷갈리는 것 중 하나가 팁입니다. 팁을 주는 나라에서는 서비스에 대한 대가이지 친절의 표시가 아닙니다.',
            '반대로 팁이 필요 없는 나라에서는 억지로 주면 오히려 어색해집니다. 현금을 조금 준비해 두고 계산대에서 조용히 물어보는 편이 가장 안전합니다.'
          ]
        },
        items: [
          { en: 'Is the tip included?', ko: '팁이 포함되어 있나요?', meaning: 'does the bill already include service', example: 'Is the tip included in the total?', note: '계산서의 service included를 먼저 확인하세요' },
          { en: 'Keep the change.', ko: '거스름돈은 가지세요.', meaning: 'you may keep the rest', example: 'That is twelve, keep the change.', note: '팁을 줄 때 쓰는 짧은 문장입니다' },
          { en: 'No tip, thanks.', ko: '팁은 괜찮습니다.', meaning: 'I will not add a tip', example: 'No tip, thanks, the total is fine.', note: '팁이 불필요한 곳에서' }
        ],
        quote: {
          ko: '팁은 친절의 표시가 아니라 값의 일부입니다.',
          en: 'A tip is part of the price, not a sign of friendliness.'
        }
      },

      /* ── 13. 확인 문제 ───────────────────────────────────────────── */
      {
        id: 'quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 6문항', en: 'Quiz — six questions' },
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
          }
        ]
      },

      /* ── 14. 유머 ────────────────────────────────────────────────── */
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
          { en: 'I packed them again at security.', ko: '보안 검색대에서 다시 쌌습니다.', meaning: 'the bag was repacked later', example: 'They packed them again at security.', note: 'at security는 보안 검색대에서라는 뜻입니다' }
        ],
        quote: {
          ko: '농담은 시제를 정확히 쓸 때 더 재미있어집니다.',
          en: 'A joke lands harder when the tense is exact.'
        }
      },

      /* ── 15. 해설 노트 ───────────────────────────────────────────── */
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
          { en: '**Aisle is silent** — the s is not pronounced at all.', ko: '**aisle의 s는 묵음** — 소리 내지 않습니다.' }
        ]
      }
    ]
  }
];
