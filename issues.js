/* ==========================================================================
   EngMon — 호(issue)와 섹션 데이터
   ==========================================================================

   이 파일이 매거진의 "데이터베이스"입니다. magazine.js가 읽어 페이지를 그립니다.
   빌드 도구도 서버도 필요 없습니다.

   (JSON이 아니라 .js인 이유: file:// 로 index를 열어도 fetch가 막히지 않도록.
    데이터만 바꿀 때는 이 파일만 수정하면 됩니다.)

   ── 새 호 추가하기 ────────────────────────────────────────────────────────
   MAGAZINE_ISSUES 배열의 **맨 앞**에 객체를 하나 더 넣으세요. 가장 앞의 호가
   magazine.html에 표시됩니다(keyword: issues[0]).

   ── 섹션에서 쓸 수 있는 필드 ───────────────────────────────────────────────
   id          필수. 앵커/진행률 저장에 쓰이는 고유 문자열 (영문/하이픈)
   kind        vocabulary | grammar | idioms | natural | conversation |
               discussion | culture | quiz | humor | note   (표시용 분류)
   level       A2 | B1 | B2 | C1
   title       { ko, en }  섹션 제목
   intro       { ko, en }  한 줄 도입 (선택)
   body        { ko: [...문단], en: [...문단] }   (선택)
   items       [ { en, ko, note } ]  어휘/표현 → 자동으로 "단어장에 저장" 버튼이 붙습니다
   bullets     [ { ko, en } ]        저장 버튼 없는 목록 (해설 노트용)
   dialogue    [ { who, en, ko } ]   대화문
   questions   [ { ko, en } ]        토론 질문
   quiz        [ { q:{ko,en}, options:[...], answer:0, explain:{ko,en} } ]

   오디오는 별도 파일이 필요 없습니다. items/dialogue/body의 **영어 필드**를 모아
   브라우저 음성합성(speechSynthesis)으로 읽습니다.
   ========================================================================== */

var MAGAZINE_ISSUES = [
  {
    number: 1,
    slug: 'issue-01',
    date: '2026-10',
    status: 'draft', /* draft | published */
    level: 'B1',
    minutes: 25,
    theme: { ko: '여행 영어', en: 'Travel English' },
    title: {
      ko: '공항에서 호텔까지, 여행 영어 한 호',
      en: 'From airport to hotel — one issue of travel English'
    },
    summary: {
      ko: '여행에서 실제로 쓰는 표현만 모았습니다. 테마 어휘 6개, 문법 1가지, 이디엄 4개, 대화 2장, 토론 질문 5개, 확인 문제 3개.',
      en: 'Only the expressions you actually use on a trip: six theme words, one grammar point, four idioms, two dialogues, five discussion questions and three quiz items.'
    },

    sections: [
      /* ── 1. 테마 어휘 ─────────────────────────────────────────────── */
      {
        id: 'theme-words',
        kind: 'vocabulary',
        level: 'A2',
        title: { ko: '테마 어휘 — 여행 필수 6단어', en: 'Theme words — six you need for travel' },
        intro: {
          ko: '이 6개만 손에 익히면 여행 중 대부분의 상황을 문장으로 만들 수 있습니다.',
          en: 'Get these six into your hands and you can build most travel sentences.'
        },
        items: [
          { en: 'itinerary', ko: '여행 일정표', note: '복수형 itineraries · "Do you have the itinerary?"' },
          { en: 'boarding pass', ko: '탑승권', note: '"Could I see your boarding pass?"' },
          { en: 'layover', ko: '경유(대기 시간)', note: '"I have a three-hour layover in Tokyo."' },
          { en: 'check-in', ko: '체크인 · 수속', note: '명사와 동사로 둘 다 씁니다' },
          { en: 'customs', ko: '세관', note: '항상 복수 취급 · "go through customs"' },
          { en: 'departure', ko: '출발', note: '반대말은 arrival' }
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
          ko: [
            '"가본 적 있다"처럼 **지금까지의 경험**을 말할 때는 현재완료(have + p.p.)를 씁니다. 언제였는지는 중요하지 않습니다.',
            '반대로 **언제였는지**를 말하면 그 순간이 기준이 되므로 과거시제를 씁니다. 두 문장을 나란히 비교해 보세요.'
          ],
          en: [
            'Use the present perfect (have + past participle) for experience up to now. When it happened is not the point.',
            'The moment you say when, the past simple takes over. Compare the two sentences side by side.'
          ]
        },
        quote: {
          ko: '경험에는 시점이 없고, 시점을 말하면 경험이 사라집니다.',
          en: 'Experience has no date. Say the date and the experience becomes an event.'
        },
        items: [
          { en: 'I have been to Japan twice.', ko: '나는 일본에 두 번 가본 적이 있다.', note: '경험 → 현재완료' },
          { en: 'I went to Japan in 2024.', ko: '나는 2024년에 일본에 갔다.', note: '시점을 말하면 → 과거시제' },
          { en: 'Have you ever been abroad?', ko: '해외에 가본 적 있나요?', note: 'ever = 지금까지 한 번이라도' },
          { en: 'I have never flown alone.', ko: '나는 혼자 비행기를 타본 적이 없다.', note: 'never = 한 번도' }
        ]
      },

      /* ── 3. 이디엄 ────────────────────────────────────────────────── */
      {
        id: 'idioms',
        kind: 'idioms',
        level: 'B1',
        title: { ko: '이디엄 — 이동과 여행의 4가지', en: 'Idioms — four for travel and moving around' },
        intro: {
          ko: '직역하면 뜻이 통하지 않습니다. 통째로 외우는 편이 빠릅니다.',
          en: 'Word-for-word translation will not help. Learn these as single chunks.'
        },
        quote: {
          ko: '이디엄은 단어가 아니라 덩어리로 외웁니다. 직역은 도움이 안 됩니다.',
          en: 'Idioms are chunks, not words. Translating them one by one will not help.'
        },
        items: [
          { en: 'catch a flight', ko: '비행기를 타다 (시간 맞춰)', note: 'catch → caught · "I have to catch a flight at six."' },
          { en: 'hit the road', ko: '길을 나서다', note: '"Let us hit the road before the traffic builds up."' },
          { en: 'travel light', ko: '짐을 가볍게 하다', note: '"Travel light and you will move faster."' },
          { en: 'off the beaten track', ko: '(유명하지 않은) 외진 곳의', note: '"We stayed somewhere off the beaten track."' }
        ]
      },

      /* ── 4. 자연스러운 표현 (대화) ───────────────────────────────── */
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
          { en: 'I am here on holiday.', ko: '휴가로 왔습니다.', note: 'on business = 출장으로' },
          { en: 'Here is my booking.', ko: '예약 확인서 여기 있습니다.', note: 'booking = reservation' }
        ]
      },

      /* ── 5. 회화 (호텔 체크인) ───────────────────────────────────── */
      {
        id: 'conversation',
        kind: 'conversation',
        level: 'B1',
        title: { ko: '회화 — 호텔 체크인', en: 'Conversation — checking in at a hotel' },
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
          { en: 'for three nights', ko: '3박으로', note: '숙박은 nights, 날짜는 days — 섞으면 어색합니다' },
          { en: 'for incidentals', ko: '(부대비용) 담보용으로', note: '체크인에서 자주 듣는 표현입니다' },
          { en: 'Could I get a late checkout?', ko: '늦게 체크아웃할 수 있을까요?', note: 'Could I get ~ = 정중한 요청' }
        ]
      },

      /* ── 6. 그룹 토론 ─────────────────────────────────────────────── */
      {
        id: 'group-talk',
        kind: 'discussion',
        level: 'B1',
        title: { ko: '그룹 토크 — 여행에 대한 5가지 질문', en: 'Group talk — five questions about travel' },
        intro: {
          ko: '혼자서도 소리 내어 답해 보세요. 30초씩 말하면 충분합니다.',
          en: 'Answer out loud, even alone. Thirty seconds each is plenty.'
        },
        questions: [
          { ko: '여행에서 가장 기억에 남는 순간은 언제였나요?', en: 'What is the most memorable moment of your travels?' },
          { ko: '계획형 여행자입니까, 즉흥형 여행자입니까?', en: 'Are you a planner or a spontaneous traveller?' },
          { ko: '짐을 쌀 때 절대 빼놓지 않는 것은 무엇인가요?', en: 'What do you never leave out when you pack?' },
          { ko: '다시 가고 싶은 도시가 있나요? 이유도 말해 보세요.', en: 'Is there a city you would go back to? Why?' },
          { ko: '여행 중에 생긴 문제를 어떻게 해결했나요?', en: 'How did you solve a problem that came up on a trip?' }
        ]
      },

      /* ── 7. 문화 ──────────────────────────────────────────────────── */
      {
        id: 'culture',
        kind: 'culture',
        level: 'B1',
        title: { ko: '문화 — 팁 문화가 낯선 사람들을 위해', en: 'Culture — travelling where tipping is unfamiliar' },
        body: {
          ko: [
            '한국에서 온 여행자에게 가장 헷갈리는 것 중 하나가 팁입니다. 팁을 주는 나라에서는 **서비스에 대한 대가**이지 친절의 표시가 아닙니다.',
            '반대로 팁이 필요 없는 나라에서는 억지로 주면 오히려 어색해집니다. 현금을 조금 준비해 두고, 계산대에서 조용히 물어보는 편이 가장 안전합니다.'
          ],
          en: [
            'Tipping is one of the easiest things to get wrong. Where it is expected, it is part of the price of service, not a sign of friendliness.',
            'Where it is not expected, offering it can be awkward. Carry a little cash and quietly ask at the counter — that is the safest route.'
          ]
        },
        quote: {
          ko: '팁은 친절의 표시가 아니라 값의 일부입니다.',
          en: 'A tip is part of the price, not a sign of friendliness.'
        },
        items: [
          { en: 'Is the tip included?', ko: '팁이 포함되어 있나요?', note: '계산서에 붙은 tip included를 먼저 확인하세요' },
          { en: 'Keep the change.', ko: '거스름돈은 가지세요.', note: '팁을 줄 때 쓰는 짧은 문장입니다' },
          { en: 'No tip, thanks.', ko: '팁은 괜찮습니다.', note: '팁이 불필요한 곳에서' }
        ]
      },

      /* ── 8. 확인 문제 ─────────────────────────────────────────────── */
      {
        id: 'quiz',
        kind: 'quiz',
        level: 'B1',
        title: { ko: '확인 문제 — 3문항', en: 'Quiz — three questions' },
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
              ko: 'travel light이 정답입니다. hit the road는 "길을 나서다"입니다.',
              en: 'travel light is the one. hit the road means to set off.'
            }
          }
        ]
      },

      /* ── 9. 유머 ──────────────────────────────────────────────────── */
      {
        id: 'humor',
        kind: 'humor',
        level: 'A2',
        title: { ko: '유머 — 공항에서 생긴 일', en: 'Humour — a small airport joke' },
        body: {
          ko: [
            '**A:** "Did you pack your bags yourself?"  **B:** "Yes, and then I packed them again at the airport."',
            '농담의 핵심은 과거시제입니다. 짐을 두 번 쌌다는 사실 자체보다, 심사관의 질문을 그대로 되받아 쓰는 구조에서 웃음이 나옵니다.'
          ],
          en: [
            '**A:** "Did you pack your bags yourself?"  **B:** "Yes, and then I unpacked them at security and packed them again."',
            'The joke turns on the simple past. The point is not repacking, but answering the exact question you were asked.'
          ]
        },
        items: [
          { en: 'Did you pack your bags yourself?', ko: '짐은 직접 싸셨습니까?', note: '보안 질문에서 그대로 나오는 문장입니다' },
          { en: 'I packed them again at security.', ko: '보안 검색대에서 다시 쌌어요.', note: 'at security = 보안 검색대에서' }
        ]
      },

      /* ── 10. 해설 노트 ────────────────────────────────────────────── */
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
          { ko: '**현재완료 vs 과거** — "가본 적 있다"는 have p.p., "갔다"는 과거. 시점이 나오면 과거시제로 넘어갑니다.', en: '**Present perfect vs past** — experience takes have p.p.; naming the time switches to the past simple.' },
          { ko: '**숙박은 nights** — "3박"을 three days로 옮기면 기간이 흐려집니다.', en: '**Nights for stays** — three days blurs the length of a hotel stay.' },
          { ko: '**Could I get ~** — 요청의 기본형입니다. Can I보다 안전하고 Would you보다 쉽습니다.', en: '**Could I get ~** — the safest all-round request pattern.' },
          { ko: '**답은 문장으로** — 심사·체크인에서 한 단어 답변은 되묻는 질문을 부릅니다.', en: '**Answer in sentences** — one-word replies get you asked again.' }
        ]
      }
    ]
  }
];
