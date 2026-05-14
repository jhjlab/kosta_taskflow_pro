# 03 — Design Decisions

## 아키텍처·기술 결정

> 아래 8가지 결정은 이 프로젝트의 기술적 방향을 고정한다.
> 새 의존성 도입 전 반드시 이 문서에 사유를 먼저 기록해야 한다.

---

### 결정 목록

| # | 결정 항목 | 선택 | 대안 | 근거 | 트레이드오프 |
|---|-----------|------|------|------|-------------|
| 1 | **백엔드 프레임워크** | FastAPI | Django, Express | 비동기 I/O 기본 지원, 자동 OpenAPI 문서, 타입 힌트 기반 유효성 검증 (Pydantic) 으로 빠른 API 개발 가능 | Django에 비해 ORM·Admin·Auth가 내장되지 않아 직접 구성 필요. 팀 내 Python 숙련도 전제 |
| 2 | **프론트엔드** | Vanilla JS + Tailwind CDN | React, Vue | 번들러·빌드 도구 없이 즉시 실행 가능. 의존성 0. 작은 규모에서 React 오버헤드 불필요 | 컴포넌트 재사용·상태 관리가 수동. 규모가 커지면 유지보수 비용 증가 |
| 3 | **데이터베이스** | SQLite → PostgreSQL (SQLAlchemy) | MySQL, MongoDB | 로컬 개발은 SQLite로 빠르게 시작, 프로덕션은 PostgreSQL으로 전환. SQLAlchemy가 두 엔진을 투명하게 추상화 | SQLite는 동시 쓰기 제한. 전환 시 마이그레이션 스크립트 별도 관리 필요 |
| 4 | **스타일링** | Tailwind CSS만 사용 | styled-components, CSS Modules | 유틸리티 클래스로 일관된 디자인 토큰 유지. CSS-in-JS 런타임 오버헤드 없음. `globals.css` 외 별도 CSS 파일 금지 | Tailwind 클래스 문자열이 길어져 가독성 저하 가능. styled-components 방식의 동적 스타일링 불가 |
| 5 | **실시간 데이터** | 폴링 3초 간격 (MVP) | WebSocket, SSE | 구현 복잡도 최소화. MVP 성공 기준 달성에 충분. WebSocket은 확장 단계에서 도입 | 3초 지연 존재. 불필요한 API 호출로 서버 부하 소폭 증가. 탭 비활성화 시에도 폴링 지속 |
| 6 | **프론트 상태 관리** | 모듈 변수 + DOM 직접 갱신 | Redux, Zustand, React Query | 외부 상태 라이브러리 없이 단순한 데이터 흐름 유지. 의존성 추가 없이 예측 가능한 구조 | 규모 확장 시 상태 추적이 어려워짐. 컴포넌트 간 데이터 공유에 수동 이벤트 패턴 필요 |
| 7 | **디자인 시스템** | macOS UI 톤 | Material Design, Ant Design | 친숙하고 고급스러운 UX. 라이브러리 의존 없이 Tailwind 토큰만으로 구현 가능 | 직접 구현이므로 초기 세팅 비용 발생. Material·Ant 대비 접근성(a11y) 컴포넌트 수동 관리 필요 |
| 8 | **테마** | 라이트/다크 토글 (`localStorage`) | CSS `prefers-color-scheme`만 사용 | 사용자가 시스템 설정과 무관하게 직접 선택 가능. 초기값은 `prefers-color-scheme`으로 설정 | `localStorage` 접근 전 깜빡임(FOUC) 방지 처리 필요. SSR 환경에서 초기 렌더 불일치 주의 |

---

## 결정 상세

### 1. 백엔드 — FastAPI

```
Django  — 완성도 높지만 ORM·Admin 포함으로 초기 무거움
Express — Node.js 생태계, 팀 언어 통일성 깨짐
FastAPI — Python 유지, async 기본, Pydantic 유효성 검증 내장 ✅
```

### 2. 프론트엔드 — Vanilla JS + Tailwind CDN

```
React/Vue — 컴포넌트 모델 강력하지만 번들러·Node 환경 필수
Vanilla   — <script type="module"> + fetch API로 충분
          — CDN 한 줄로 Tailwind 적용, 빌드 단계 없음 ✅
```

### 3. 데이터베이스 — SQLite → PostgreSQL

```
개발: SQLite (파일 기반, 설치 불필요)
프로덕션: PostgreSQL (TIMESTAMPTZ, JSONB, 동시성 지원)
전환: DATABASE_URL 환경 변수 교체만으로 가능 (SQLAlchemy 추상화)
```

### 4. CSS — Tailwind 전용

**금지 항목:**
- `styled-components`, `@emotion`, CSS Modules (`.module.css`)
- `<style>` 태그 인라인 스타일 (동적 값 바인딩 제외)

**허용 항목:**
- `globals.css` — CSS 변수 및 기본 reset
- Tailwind 유틸리티 클래스
- `style={{ ... }}` — 동적 값이 필요한 경우에 한해 허용

**디자인 토큰 (Tailwind 클래스 기준):**

| 토큰 | 클래스 | 용도 |
|------|--------|------|
| 모서리 | `rounded-xl` | 카드, 버튼, 모달 |
| 그림자 | `shadow-lg` | 카드, 드롭다운 |
| 반투명 | `backdrop-blur-sm bg-white/80` | 헤더, 카드 배경 |
| 폰트 | `font-sans` (시스템 폰트) | 전체 |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` | 버튼, 아이콘 |

### 5. 실시간 — MVP 폴링

```
MVP:      setInterval(fetchTasks, 3000)
          탭 비활성화 시 중단: document.visibilityState 체크
확장 시:  WebSocket (Socket.IO 또는 네이티브)
          → 도입 전 03-design에 결정 사유 기록 필수
```

### 6. 상태 관리 — 모듈 변수

```javascript
// 패턴 예시
let tasks = [];

async function loadTasks() {
  tasks = await api.get('/tasks');
  renderTaskList();
}

function renderTaskList() {
  // DOM 직접 갱신
}
```

React·Zustand 전환 기준: 동시 구독 컴포넌트가 5개 초과 시 재검토.

### 7. 디자인 시스템 — macOS UI 톤

| 요소 | 규칙 |
|------|------|
| 모서리 반경 | `rounded-xl` (12px) 이상 |
| 그림자 | `shadow-lg`, 낮은 채도 (회색 계열) |
| 카드 배경 | `bg-white/80 backdrop-blur-sm` |
| 폰트 | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| 터치 타깃 | 최소 44×44px |
| 간격 | 4px 그리드 (`gap-4`, `p-4`, `p-6`) |

Material·Ant Design 미도입 이유: 디자인 커스터마이징 제한 + 번들 크기 증가.

### 8. 테마 — 라이트/다크 토글

```javascript
// 초기화 (HTML <head> 최상단 인라인 실행 — FOUC 방지)
const saved = localStorage.getItem('theme');
const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.classList.toggle('dark', (saved ?? preferred) === 'dark');
```

- 토글 버튼 → `localStorage.setItem('theme', next)` → `document.documentElement.classList.toggle('dark')`
- Tailwind `dark:` 변형 클래스로 색상 전환
- SSR 환경: 서버 렌더 시 클래스 불일치 방지를 위해 `suppressHydrationWarning` 사용

---

## 의존성 추가 정책

> **신규 npm 패키지 또는 PyPI 패키지 도입 전 아래 절차를 따른다.**

1. 이 문서(`03-design.md`)에 해당 섹션을 추가한다.
2. 기록 항목: 패키지명 / 도입 사유 / 고려한 대안 / 트레이드오프
3. 기록 없이 `package.json` 또는 `requirements.txt`에 추가하는 것은 금지.
4. 단, 개발 도구 (`@types/*`, `eslint-*`, `ruff` 등) 는 기록 생략 가능.
