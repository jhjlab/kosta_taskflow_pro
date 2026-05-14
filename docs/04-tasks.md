# 04 — Tasks

## 진행 규칙

> - **순서대로만** 진행한다. 이전 단계 검증 통과 전 다음 단계 시작 금지.
> - **병렬 작업 금지.** 한 번에 한 단계씩.
> - **단계별 검증 필수.** 검증 방법 열의 조건을 충족해야 완료로 간주.
> - 확장 단계(팀·Kanban·채팅 등)는 이 문서에 포함하지 않는다.

---

## Phase 1 — 설계 ✅ 완료

> 목표: CLAUDE.md 및 docs/ 6종 문서 작성 완료

| # | 단계 | 작업 내용 | 검증 방법 | 상태 |
|---|------|-----------|-----------|:----:|
| 1-01 | CLAUDE.md 작성 | 프로젝트 개요, 개발 원칙, 디렉토리 설명 기록 | 파일 존재 확인 | ✅ |
| 1-02 | 00-overview.md 작성 | 기술 스택, 아키텍처 다이어그램, 로컬 실행 방법 | 파일 존재 확인 | ✅ |
| 1-03 | 01-product.md 작성 | 목표, 페르소나, MVP 범위, 성공 기준 | 내용 리뷰 완료 | ✅ |
| 1-04 | 02-specs.md 작성 | Task 모델, REST API 5개, 유효성 검증, 화면 명세 | 내용 리뷰 완료 | ✅ |
| 1-05 | 03-design.md 작성 | 8가지 기술 결정 표, 의존성 추가 정책 | 내용 리뷰 완료 | ✅ |
| 1-06 | 04-tasks.md 작성 | Phase별 체크리스트, 검증 방법 | 이 파일 | ✅ |
| 1-07 | 05-conventions.md 작성 | 브랜치 전략, 커밋 컨벤션, 코딩 스타일 | 파일 존재 확인 | ✅ |
| 1-08 | 디렉토리 구조 확인 | backend/, frontend/, docs/ 경로 일치 여부 | `ls` 또는 tree 출력으로 확인 | ✅ |
| 1-09 | Git 초기화 및 첫 커밋 | `.gitignore` 포함, `git log` 1건 이상 | `git log --oneline` 1줄 이상 | ✅ |
| 1-10 | 설계 전체 리뷰 | docs/ 6종 내용 일관성 확인 (모델명·필드명 통일) | 모델명 `due_at` 전 문서 통일 | ✅ |

---

## Phase 2 — 백엔드

> 목표: FastAPI CRUD API 5개 구현 → Swagger UI(`/docs`)에서 전체 동작 확인

| # | 단계 | 작업 내용 | 검증 방법 | 상태 |
|---|------|-----------|-----------|:----:|
| 2-01 | Docker Compose 실행 | `docker compose up -d` → PostgreSQL 컨테이너 기동 | `docker compose ps` 상태 `running` | 🔲 |
| 2-02 | Task 모델 정의 | `app/models/task.py` — `due_at`, `updated_at` 자동 갱신 포함 | Python import 오류 없음 | 🔲 |
| 2-03 | Alembic 마이그레이션 생성 | `alembic revision --autogenerate -m "create tasks"` | `migrations/versions/` 파일 생성 확인 | 🔲 |
| 2-04 | 마이그레이션 적용 | `alembic upgrade head` | `alembic current` = `head` | 🔲 |
| 2-05 | Task 스키마 정의 | `TaskCreate`, `TaskListItem`(description 제외), `TaskRead`(description 포함), `TaskUpdate` | Pydantic 임포트 오류 없음 | 🔲 |
| 2-06 | `POST /tasks` 구현 | title 필수, status 기본 todo, due_at ISO 8601 검증 | Swagger → 201 응답, DB 레코드 확인 | 🔲 |
| 2-07 | `GET /tasks` 구현 | 목록 반환, description 제외 | Swagger → 200, 응답에 description 키 없음 | 🔲 |
| 2-08 | `GET /tasks/{id}` 구현 | 단건 반환, description 포함, 없는 id → 404 | Swagger → 200(있는 id), 404(없는 id) | 🔲 |
| 2-09 | `PUT /tasks/{id}` 구현 | 전달된 필드만 수정, updated_at 자동 갱신 | Swagger → 200, 미전달 필드 유지 확인 | 🔲 |
| 2-10 | `DELETE /tasks/{id}` 구현 | 삭제 후 204, 없는 id → 404 | Swagger → 204(있는 id), 404(없는 id) | 🔲 |

---

## Phase 3 — 프론트엔드

> 목표: HTML + Vanilla JS + Tailwind CDN으로 메인 화면 구현 → API 연결 → git push

| # | 단계 | 작업 내용 | 검증 방법 | 상태 |
|---|------|-----------|-----------|:----:|
| 3-01 | HTML 기본 구조 | `index.html` — Tailwind CDN, 시스템 폰트, 다크모드 스크립트 (`<head>` 최상단) | 브라우저에서 빈 페이지 정상 렌더 | 🔲 |
| 3-02 | 라이트/다크 테마 | 토글 버튼, `localStorage('theme')`, `prefers-color-scheme` 초기값 | 토글 후 새로고침 → 테마 유지 | 🔲 |
| 3-03 | API 클라이언트 | `js/api.js` — `fetch` 래퍼, Base URL, 에러 처리 | 콘솔에서 `api.get('/tasks')` 호출 → 응답 배열 확인 | 🔲 |
| 3-04 | 태스크 목록 렌더링 | 카드 UI — status 배지, D-N HH:MM 마감 표시, macOS 스타일 | 화면에 카드 목록 정상 출력, 360px에서 1열 | 🔲 |
| 3-05 | 태스크 추가 폼 | title / due_at / status 입력, `POST /tasks` 호출, 성공 후 목록 즉시 갱신 | 폼 제출 → 카드 추가 확인, 빈 title 제출 → 오류 표시 | 🔲 |
| 3-06 | 태스크 수정 모달 | 카드 클릭 → 모달 오픈, `PUT /tasks/{id}` 호출, 저장 후 카드 즉시 갱신 | 수정 저장 → 카드 값 변경 확인 | 🔲 |
| 3-07 | 태스크 삭제 | 휴지통 아이콘 → 확인 → `DELETE /tasks/{id}`, 목록 즉시 제거 | 삭제 후 카드 사라짐, 취소 시 유지 확인 | 🔲 |
| 3-08 | 최종 확인 및 push | 360px 레이아웃, API 200ms, 테마 토글, CRUD 4종 동작 전체 재확인 후 `git push` | 성공 기준 5개 (`02-specs.md`) 모두 충족 | 🔲 |

---

## 상태 범례

| 아이콘 | 의미 |
|--------|------|
| ✅ | 완료 — 검증 통과 |
| 🔵 | 진행 중 |
| 🔲 | 대기 |
| ⛔ | 블로킹 — 해결 전 진행 불가 |
