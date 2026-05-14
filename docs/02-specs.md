# 02 — Technical Specs

## 기술 스택

| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|-----------|
| Frontend | Next.js (App Router) | 16.x | SSR + 파일 기반 라우팅, React 생태계 |
| Styling | Tailwind CSS | 4.x | 유틸리티 퍼스트, 빠른 프로토타이핑 |
| Backend | FastAPI | 0.115.x | 비동기 지원, 자동 OpenAPI 문서 |
| ORM | SQLAlchemy (async) | 2.x | Python 표준, Alembic 마이그레이션 연동 |
| Migration | Alembic | 1.14.x | SQLAlchemy 공식 마이그레이션 도구 |
| Database | PostgreSQL | 16.x | 관계형, JSONB 확장 가능, 프로덕션 표준 |
| Auth | JWT (python-jose) | — | Stateless, 간단한 구현 |
| Containerization | Docker + Compose | — | 로컬 환경 일치, 배포 준비 |

---

## 시스템 아키텍처

```
Browser
  │
  ▼
Next.js (localhost:3000)
  │  fetch /api/v1/*
  ▼
FastAPI (localhost:8000)
  │  SQLAlchemy async
  ▼
PostgreSQL (localhost:5432)
```

- Next.js는 순수 프론트엔드 역할. 직접 DB에 접근하지 않는다.
- FastAPI가 모든 비즈니스 로직과 DB 접근을 담당한다.
- CORS는 FastAPI에서 `http://localhost:3000`만 허용.

---

## 데이터 모델

### users

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, AUTO |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(100) | NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### tasks

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, AUTO |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NULL |
| status | ENUM | `todo` / `in_progress` / `done`, DEFAULT `todo` |
| due_at | TIMESTAMPTZ (UTC) | NULL |
| owner_id | INTEGER | FK → users.id |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now(), 수정 시 자동 갱신 |

---

## 유효성 검증

| 조건 | 응답 |
|------|------|
| `title` 누락 또는 빈 문자열 | `400 Bad Request` |
| `status` 허용값 외 문자열 | `400 Bad Request` |
| `due_at` ISO 8601 형식 위반 | `400 Bad Request` |
| 존재하지 않는 `id` 조회·수정·삭제 | `404 Not Found` |

**`due_at` 허용 형식 예시**

```
2026-05-12T18:00:00Z        ← UTC (권장)
2026-05-12T18:00:00+09:00   ← 타임존 오프셋 포함
```

> 저장은 항상 UTC로 정규화한다. 화면 표시는 브라우저 로컬 시간 기준.

---

## REST API

### Base URL
```
http://localhost:8000/api/v1
```

### 인증 엔드포인트

| Method | Path | 설명 | 상태 코드 |
|--------|------|------|:---------:|
| `POST` | `/auth/register` | 회원가입 | 201 |
| `POST` | `/auth/login` | 로그인 → JWT 반환 | 200 |

### 태스크 엔드포인트

| Method | Path | 설명 | 상태 코드 | 인증 |
|--------|------|------|:---------:|:----:|
| `POST` | `/tasks` | 태스크 생성 | 201 | ✅ |
| `GET` | `/tasks` | 태스크 목록 | 200 | ✅ |
| `GET` | `/tasks/{id}` | 태스크 단건 조회 | 200 | ✅ |
| `PUT` | `/tasks/{id}` | 태스크 수정 (부분 수정 허용) | 200 | ✅ |
| `DELETE` | `/tasks/{id}` | 태스크 삭제 | 204 | ✅ |

> `PUT`은 전달된 필드만 덮어쓴다 (PATCH 의미론과 동일하게 동작).

### 요청/응답 예시

**태스크 생성 `POST /tasks`**
```json
{
  "title": "API 연동 테스트",
  "description": "FastAPI ↔ Next.js fetch 확인",
  "status": "todo",
  "due_at": "2026-05-20T09:00:00Z"
}
```

응답 `201`
```json
{
  "id": 1,
  "title": "API 연동 테스트",
  "status": "todo",
  "due_at": "2026-05-20T09:00:00Z",
  "created_at": "2026-05-14T10:00:00Z",
  "updated_at": "2026-05-14T10:00:00Z"
}
```

**태스크 목록 `GET /tasks`** — `description` 제외

```json
[
  {
    "id": 1,
    "title": "API 연동 테스트",
    "status": "todo",
    "due_at": "2026-05-20T09:00:00Z",
    "created_at": "2026-05-14T10:00:00Z",
    "updated_at": "2026-05-14T10:00:00Z"
  }
]
```

**태스크 단건 `GET /tasks/{id}`** — `description` 포함

```json
{
  "id": 1,
  "title": "API 연동 테스트",
  "description": "FastAPI ↔ Next.js fetch 확인",
  "status": "todo",
  "due_at": "2026-05-20T09:00:00Z",
  "created_at": "2026-05-14T10:00:00Z",
  "updated_at": "2026-05-14T10:00:00Z"
}
```

---

## 화면 명세 (CRUD 4종)

### 추가 — 태스크 생성 폼

- 위치: 목록 상단 고정 버튼 클릭 시 폼 영역 펼침 (또는 모달)
- 필드:
  - `title` — 텍스트 입력, 필수
  - `due_at` — datetime-local 입력, 선택 (예: `2026-05-12 18:00`)
  - `status` — 셀렉트 (`todo` / `in_progress` / `done`), 기본 `todo`
- 제출 성공 시 폼 초기화 + 목록에 즉시 추가

### 목록 — 태스크 카드

- 각 태스크를 카드로 표시
- 카드 내 표시 요소:
  - `title`
  - `status` 배지 (색상 구분)
  - 마감 카운트다운: **`D-N HH:MM`** 형식 (예: `D-3 18:00`)
    - 오늘이면 `D-0`, 지난 경우 `D+N`
    - `due_at` 없으면 표시 안 함

### 수정 — 모달

- 카드 클릭 시 수정 모달 열림
- 폼 필드: `title` / `description` / `due_at` / `status`
- 저장 → `PUT /tasks/{id}` 호출 → 카드 즉시 갱신
- 취소 / 모달 바깥 클릭 → 닫기

### 삭제 — 확인 후 삭제

- 카드 내 휴지통 아이콘 클릭 → 인라인 또는 모달 확인 메시지 표시
- 확인 → `DELETE /tasks/{id}` 호출 → 목록에서 즉시 제거
- 취소 → 원래 상태 복원

---

## 환경 변수

### backend/.env

| 변수 | 예시값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pw@localhost:5432/taskflowpro` | DB 연결 문자열 |
| `SECRET_KEY` | `change-in-production` | JWT 서명 키 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 토큰 유효 시간 (분) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | 허용 오리진 |

### frontend/.env.local

| 변수 | 예시값 | 설명 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI 베이스 URL |
