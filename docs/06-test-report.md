# TaskflowPro — Playwright E2E 테스트 보고서

## 1. 개요

| 항목 | 내용 |
|------|------|
| 테스트 일시 | 2026-05-14 |
| 테스트 도구 | Playwright (Chromium headless) |
| 대상 서비스 | Frontend: http://localhost:3000 / Backend: http://localhost:8000 |
| 스펙 파일 | `tests/specs/taskflow.spec.ts` |
| 총 케이스 수 | 11개 × 2 프로젝트 = 22건 |
| **최종 결과** | **✅ 22/22 PASS** |

---

## 2. 테스트 환경

| 구분 | 내용 |
|------|------|
| OS | Windows 10 Pro 10.0.19045 |
| 브라우저 | Chromium (Playwright 내장) |
| Desktop 뷰포트 | 1280 × 800 px |
| Mobile 뷰포트 | 360 × 780 px (deviceScaleFactor: 2) |
| Backend | FastAPI + SQLite (uvicorn) |
| Frontend | Vanilla JS + Tailwind CDN (Python http.server) |

---

## 3. 테스트 결과 요약

| TC | 테스트명 | Desktop | Mobile-360 | 소요 시간 |
|----|---------|---------|-----------|---------|
| TC-01 | 회원가입 후 앱 화면 진입 | ✅ PASS | ✅ PASS | ~2.7s |
| TC-02 | 로그인 / 로그아웃 | ✅ PASS | ✅ PASS | ~2.5s |
| TC-03 | 태스크 추가 (CRUD-Create) | ✅ PASS | ✅ PASS | ~2.5s |
| TC-04 | 태스크 목록 조회 (CRUD-Read) | ✅ PASS | ✅ PASS | ~2.4s |
| TC-05 | 태스크 수정 모달 (CRUD-Update) | ✅ PASS | ✅ PASS | ~3.1s |
| TC-06 | 태스크 삭제 확인 플로우 (CRUD-Delete) | ✅ PASS | ✅ PASS | ~3.7s |
| TC-07 | 빈 제목 제출 시 오류 표시 | ✅ PASS | ✅ PASS | ~2.5s |
| TC-08 | 테마 토글 및 localStorage 유지 | ✅ PASS | ✅ PASS | ~2.7s |
| TC-09 | 새로고침 후 태스크 목록 유지 | ✅ PASS | ✅ PASS | ~4.5s |
| TC-10 | API 응답 시간 200ms 이내 | ✅ PASS | ✅ PASS | ~2.3s |
| TC-11 | 360px 레이아웃 — 가로 스크롤 없음 | ✅ PASS | ✅ PASS | ~2.5s |

전체 실행 시간: Desktop **31.7s** / Mobile-360 **32.8s**

---

## 4. 케이스별 상세 결과 및 증적

### TC-01 — 회원가입 후 앱 화면 진입

**검증 항목:** 이메일/비밀번호 입력 → 회원가입 버튼 클릭 → `#app-screen` 전환

| 단계 | 스크린샷 |
|------|---------|
| ① 초기 인증 화면 | `results/tc01-01-auth-init.png` |
| ② 회원가입 폼 입력 완료 | `results/tc01-02-register-filled.png` |
| ③ 앱 화면 진입 성공 | `results/tc01-03-app-screen.png` |

---

### TC-02 — 로그인 / 로그아웃

**검증 항목:** 자격증명 입력 → 로그인 → `#app-screen` 확인 → 로그아웃 → `#auth-screen` 복귀

| 단계 | 스크린샷 |
|------|---------|
| ① 로그인 후 앱 화면 | `results/tc02-01-logged-in.png` |
| ② 로그아웃 후 인증 화면 | `results/tc02-02-logged-out.png` |

---

### TC-03 — 태스크 추가 (CRUD-Create)

**검증 항목:** 제목·마감일·상태 입력 → 추가 → 카드 표시 → 상태 배지 `진행 중` + `D-N HH:MM` 표시

| 단계 | 스크린샷 |
|------|---------|
| ① 추가 폼 입력 완료 | `results/tc03-01-add-form.png` |
| ② 태스크 카드 생성 확인 | `results/tc03-02-task-added.png` |

---

### TC-04 — 태스크 목록 조회 (CRUD-Read)

**검증 항목:** 로그인 후 `#task-list [data-id]` 카드 1개 이상 렌더링

| 단계 | 스크린샷 |
|------|---------|
| ① 목록 화면 | `results/tc04-01-task-list.png` |

---

### TC-05 — 태스크 수정 모달 (CRUD-Update)

**검증 항목:** 카드 클릭 → 수정 모달 오픈 → 제목/상태 변경 → 저장 → 카드 갱신

| 단계 | 스크린샷 |
|------|---------|
| ① 수정 모달 오픈 | `results/tc05-01-modal-open.png` |
| ② 모달 내용 수정 완료 | `results/tc05-02-modal-filled.png` |
| ③ 저장 후 카드 갱신 (`완료` 배지) | `results/tc05-03-task-updated.png` |

---

### TC-06 — 태스크 삭제 확인 플로우 (CRUD-Delete)

**검증 항목:** 휴지통 클릭 → 인라인 확인 표시 → 취소 → 재시도 → 삭제 확정 → 목록 수 감소

| 단계 | 스크린샷 |
|------|---------|
| ① 삭제 확인 UI 표시 | `results/tc06-01-delete-confirm.png` |
| ② 삭제 완료 후 목록 | `results/tc06-02-task-deleted.png` |

---

### TC-07 — 빈 제목 제출 시 오류 표시

**검증 항목:** 제목 미입력 상태로 추가 제출 → `#add-error`에 '제목' 문자 포함 메시지 표시

| 단계 | 스크린샷 |
|------|---------|
| ① 빈 제목 오류 | `results/tc07-01-empty-title-error.png` |

---

### TC-08 — 테마 토글 및 localStorage 유지

**검증 항목:** 라이트 → 다크 전환(`dark` 클래스 확인) → 새로고침 후 다크 유지

| 단계 | 스크린샷 |
|------|---------|
| ① 라이트 모드 | `results/tc08-01-light.png` |
| ② 다크 모드 전환 | `results/tc08-02-dark.png` |
| ③ 새로고침 후 다크 유지 | `results/tc08-03-dark-after-reload.png` |

---

### TC-09 — 새로고침 후 태스크 목록 유지

**검증 항목:** 페이지 리로드 전후 `[data-id]` 카드 수 동일

| 단계 | 스크린샷 |
|------|---------|
| ① 새로고침 후 목록 | `results/tc09-01-after-reload.png` |

---

### TC-10 — API 응답 시간 200ms 이내

**검증 항목:** `GET /api/v1/tasks/` 5회 반복 → 평균 200ms 미만

| 프로젝트 | avg | max | 측정값 (5회) |
|---------|-----|-----|------------|
| Desktop | **43ms** | 123ms | 32, 12, 123, 24, 23 ms |
| Mobile-360 | **37ms** | 135ms | 16, 12, 9, 135, 15 ms |

> 성공 기준: 평균 < 200ms ✅ (실측 평균 43ms, 기준 대비 **4.7배 여유**)

| 단계 | 스크린샷 |
|------|---------|
| ① API 타이밍 측정 화면 | `results/tc10-01-api-timing.png` |

---

### TC-11 — 360px 레이아웃 — 가로 스크롤 없음

**검증 항목:** 뷰포트 360px에서 `scrollWidth <= clientWidth + 2` (태스크 추가 전·후)

| 단계 | 스크린샷 |
|------|---------|
| ① 360px 로그인 화면 | `results/tc11-01-360px-login.png` |
| ② 태스크 추가 후 360px | `results/tc11-02-360px-with-task.png` |

---

## 5. 성공 기준 대비 검증 결과

| 성공 기준 (docs/01-product.md) | 결과 |
|-------------------------------|------|
| API 평균 응답 200ms 이내 | ✅ 43ms (Desktop) / 37ms (Mobile) |
| 360px 가로 스크롤 없음 | ✅ TC-11 PASS (desktop·mobile 모두) |
| 새로고침 후 태스크 목록 유지 | ✅ TC-09 PASS |
| CRUD 4종 화면 동작 | ✅ TC-03~06 PASS |
| 테마 토글 및 localStorage 유지 | ✅ TC-08 PASS |

---

## 6. 테스트 과정에서 발견된 이슈 및 조치

| 이슈 | 원인 | 조치 |
|------|------|------|
| 버튼 선택자 충돌 | `button:has-text("회원가입")` 이 탭·제출 버튼 모두 매칭 | `button[onclick="handleRegister()"]` 등 onclick 속성으로 변경 |
| `진행 중` 배지 선택 오류 | `text=진행 중` 이 숨겨진 `<option>` 태그에 매칭 | `#task-list span` 으로 스코프 한정 |
| TC-04~11 로그인 실패 | 독립 실행 시 해당 이메일이 DB에 미등록 | `login()` 헬퍼에 API 사전 등록 추가 (`failOnStatusCode: false`) |
| TC-06 strict mode 위반 | `text=정말 삭제할까요?` 가 복수 카드에 매칭 | 마지막 카드로 로케이터 스코프 한정 |
| TC-06 삭제 버튼 충돌 | `button:has-text("삭제")` 가 카드 제목 내 '삭제' 텍스트도 매칭 | `button[onclick^="handleDeleteTask"]` 으로 변경 |

---

## 7. 스크린샷 파일 목록

```
tests/results/
├── tc01-01-auth-init.png
├── tc01-02-register-filled.png
├── tc01-03-app-screen.png
├── tc02-01-logged-in.png
├── tc02-02-logged-out.png
├── tc03-01-add-form.png
├── tc03-02-task-added.png
├── tc04-01-task-list.png
├── tc05-01-modal-open.png
├── tc05-02-modal-filled.png
├── tc05-03-task-updated.png
├── tc06-01-delete-confirm.png
├── tc06-02-task-deleted.png
├── tc07-01-empty-title-error.png
├── tc08-01-light.png
├── tc08-02-dark.png
├── tc08-03-dark-after-reload.png
├── tc09-01-after-reload.png
├── tc10-01-api-timing.png
├── tc11-01-360px-login.png
└── tc11-02-360px-with-task.png
```

*총 21장*
