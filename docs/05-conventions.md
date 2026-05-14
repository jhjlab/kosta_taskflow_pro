# 05 — Conventions

## 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| Python 변수·함수·모듈 | `snake_case` | `get_task`, `due_at`, `task_router` |
| Python 클래스 | `PascalCase` | `TaskCreate`, `UserRead` |
| Python 상수 | `UPPER_SNAKE_CASE` | `ACCESS_TOKEN_EXPIRE_MINUTES` |
| JS/TS 변수·함수 | `camelCase` | `fetchTasks`, `dueAt`, `renderCard` |
| JS/TS 컴포넌트 | `PascalCase` | `TaskCard`, `StatusBadge` |
| JS/TS 파일 (컴포넌트) | `PascalCase.js` | `TaskCard.js` |
| JS/TS 파일 (유틸·훅) | `camelCase.js` | `api.js`, `formatDate.js` |
| HTML id·class | `kebab-case` | `task-list`, `add-task-btn` |
| DB 컬럼·테이블 | `snake_case` | `due_at`, `created_at`, `tasks` |
| 환경 변수 | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `SECRET_KEY` |

**언어 원칙**
- 식별자(변수명·함수명·클래스명·파일명)는 **영어**만 사용한다.
- 주석은 **한국어**로 작성한다. 영어 주석 금지.
- 주석은 WHY(이유)만 기록한다. WHAT(코드 설명)은 쓰지 않는다.

---

## 금지 사항

| 금지 | 이유 | 대안 |
|------|------|------|
| `print()` 디버깅 | 프로덕션 로그 오염, 민감 정보 노출 위험 | `logging` 모듈 사용 (`logger.debug`, `logger.info`) |
| `bare except:` | 모든 예외를 삼켜 원인 추적 불가 | `except SpecificError as e:` 로 예외 한정 |
| 비밀번호·시크릿 하드코딩 | 코드베이스 노출 시 보안 사고 | `.env` 파일 + `os.getenv()` 또는 `settings` 객체 |
| TypeScript `any` 타입 | 타입 안전성 붕괴, 컴파일 에러 미탐지 | 명시적 타입 선언, 미확정 시 `unknown` 후 narrowing |
| CSS `!important` | 우선순위 계층 붕괴, 디버깅 난이도 증가 | 셀렉터 구체성 조정 또는 Tailwind 유틸리티 클래스 순서 변경 |

---

## 테스트

### 도구

- **백엔드**: `pytest` + `httpx.AsyncClient` (FastAPI TestClient 비동기 버전)
- **프론트엔드**: 브라우저 직접 확인 (MVP 단계, 자동화 테스트 제외)

### 테스트 케이스 기준

각 API 엔드포인트에 대해 다음 케이스를 **반드시** 작성한다:

| 케이스 | 설명 |
|--------|------|
| 정상 응답 | 유효한 입력 → 기대 상태 코드 + 응답 바디 확인 |
| 400 Bad Request | 필수 필드 누락, 형식 위반 (due_at 등) |
| 404 Not Found | 존재하지 않는 id 조회·수정·삭제 |

### 파일 구조

```
backend/
└── tests/
    ├── conftest.py       ← DB 세션, 테스트 클라이언트 픽스처
    ├── test_tasks.py     ← CRUD 5개 엔드포인트 테스트
    └── test_auth.py      ← 회원가입·로그인 테스트
```

### 실행

```bash
# backend/ 디렉토리에서
pytest -v
```

---

## Git 커밋 규칙

### 형식

```
<type>: <한국어 요약>
```

### type 목록

| type | 사용 시점 |
|------|-----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작성·수정 |
| `refactor` | 기능·버그 변경 없는 코드 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드·패키지·설정 변경 |

### 예시

```
feat: POST /tasks 엔드포인트 구현
fix: due_at 없는 태스크 PUT 시 500 오류 수정
docs: 02-specs API 응답 예시 보완
test: GET /tasks 400 케이스 추가
chore: requirements.txt httpx 추가
```

### 규칙

- 한 커밋은 한 가지 변경만 담는다.
- 요약은 50자 이내, 명령형으로 작성한다 ("추가함" ❌ → "추가" ✅).
- `.env` 파일은 절대 커밋하지 않는다.
- `main` 브랜치 직접 push 금지.
