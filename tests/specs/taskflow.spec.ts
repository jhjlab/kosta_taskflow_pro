import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API  = 'http://localhost:8000/api/v1';

// 테스트 실행마다 고유 계정 생성
const EMAIL = `pw_${Date.now()}@test.com`;
const PASS  = 'password123';

// ── 헬퍼 ──────────────────────────────────────────────
async function register(page: Page) {
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');

  // 회원가입 탭 전환
  await page.locator('#tab-register').click();
  await expect(page.locator('#register-form')).toBeVisible();

  await page.locator('#reg-email').fill(EMAIL);
  await page.locator('#reg-password').fill(PASS);

  // onclick 속성으로 정확히 제출 버튼 지정
  await Promise.all([
    page.locator('#app-screen').waitFor({ state: 'visible', timeout: 10000 }),
    page.locator('button[onclick="handleRegister()"]').click(),
  ]);
}

async function login(page: Page) {
  // 테스트 사용자가 DB에 없을 수 있으므로 API로 사전 등록 (이미 있으면 무시)
  await page.request.post(`${API}/auth/register`, {
    data: { email: EMAIL, password: PASS },
    failOnStatusCode: false,
  });

  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');

  // 토큰 제거 후 인증 화면 확인
  await page.evaluate(() => localStorage.removeItem('taskflow_token'));
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 5000 });

  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#login-password').fill(PASS);

  await Promise.all([
    page.locator('#app-screen').waitFor({ state: 'visible', timeout: 10000 }),
    page.locator('button[onclick="handleLogin()"]').click(),
  ]);
}

async function ensureTask(page: Page, title: string): Promise<void> {
  await page.locator('button[onclick="toggleAddForm()"]').click();
  await expect(page.locator('#add-form-body')).toBeVisible();
  await page.locator('#add-title').fill(title);
  await page.locator('button[onclick="handleAddTask()"]').click();
  await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 5000 });
}

// ── TC-01 회원가입 ─────────────────────────────────────
test('TC-01 회원가입 후 앱 화면 진입', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({ path: 'results/tc01-01-auth-init.png' });

  await page.locator('#tab-register').click();
  await expect(page.locator('#register-form')).toBeVisible();

  await page.locator('#reg-email').fill(EMAIL);
  await page.locator('#reg-password').fill(PASS);
  await page.screenshot({ path: 'results/tc01-02-register-filled.png' });

  await Promise.all([
    page.locator('#app-screen').waitFor({ state: 'visible', timeout: 10000 }),
    page.locator('button[onclick="handleRegister()"]').click(),
  ]);

  await expect(page.locator('#app-screen')).toBeVisible();
  await page.screenshot({ path: 'results/tc01-03-app-screen.png' });
});

// ── TC-02 로그인 / 로그아웃 ────────────────────────────
test('TC-02 로그인 / 로그아웃', async ({ page }) => {
  await login(page);
  await page.screenshot({ path: 'results/tc02-01-logged-in.png' });

  await page.locator('button:has-text("로그아웃")').click();
  await expect(page.locator('#auth-screen')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'results/tc02-02-logged-out.png' });
});

// ── TC-03 태스크 추가 (CRUD-Create) ────────────────────
test('TC-03 태스크 추가', async ({ page }) => {
  await login(page);

  await page.locator('button[onclick="toggleAddForm()"]').click();
  await expect(page.locator('#add-form-body')).toBeVisible();

  await page.locator('#add-title').fill('Playwright 테스트 태스크');
  await page.locator('#add-due').fill('2026-12-31T18:00');
  await page.locator('#add-status').selectOption('in_progress');
  await page.screenshot({ path: 'results/tc03-01-add-form.png' });

  await page.locator('button[onclick="handleAddTask()"]').click();
  await expect(page.locator('text=Playwright 테스트 태스크')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'results/tc03-02-task-added.png' });

  // 배지 + D-N 마감 표시 확인 (option 태그가 아닌 task-list 내 span 타겟)
  await expect(page.locator('#task-list span').filter({ hasText: '진행 중' }).first()).toBeVisible();
  await expect(page.locator('#task-list').locator('text=/D-\\d+/')).toBeVisible();
});

// ── TC-04 태스크 목록 조회 (CRUD-Read) ─────────────────
test('TC-04 태스크 목록 조회', async ({ page }) => {
  await login(page);
  await ensureTask(page, 'TC-04 목록 조회 태스크');

  const count = await page.locator('#task-list [data-id]').count();
  expect(count).toBeGreaterThanOrEqual(1);
  await page.screenshot({ path: 'results/tc04-01-task-list.png' });
});

// ── TC-05 태스크 수정 (CRUD-Update) ────────────────────
test('TC-05 태스크 수정 모달', async ({ page }) => {
  await login(page);
  await ensureTask(page, '수정 대상 태스크');

  // 첫 번째 카드의 card-normal 영역 클릭 → 모달
  await page.locator('#task-list [data-id]').first()
    .locator('.card-normal > button').first().click();
  await expect(page.locator('#modal-overlay')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: 'results/tc05-01-modal-open.png' });

  await page.locator('#edit-title').fill('Playwright 수정된 태스크');
  await page.locator('#edit-status').selectOption('done');
  await page.screenshot({ path: 'results/tc05-02-modal-filled.png' });

  await page.locator('button[onclick="handleUpdateTask()"]').click();
  await expect(page.locator('#modal-overlay')).toBeHidden({ timeout: 5000 });
  await expect(page.locator('text=Playwright 수정된 태스크')).toBeVisible();
  await expect(page.locator('#task-list span').filter({ hasText: '완료' }).first()).toBeVisible();
  await page.screenshot({ path: 'results/tc05-03-task-updated.png' });
});

// ── TC-06 태스크 삭제 (CRUD-Delete) ────────────────────
test('TC-06 태스크 삭제 확인 플로우', async ({ page }) => {
  await login(page);
  await ensureTask(page, '삭제 대상 태스크');
  await page.waitForTimeout(300);

  const before = await page.locator('#task-list [data-id]').count();

  // 마지막 카드 휴지통 클릭 (스코프를 마지막 카드로 한정해 strict mode 회피)
  await page.locator('#task-list [data-id]').last()
    .locator('button[title="삭제"]').click();
  await expect(page.locator('#task-list [data-id]').last().locator('text=정말 삭제할까요?')).toBeVisible();
  await page.screenshot({ path: 'results/tc06-01-delete-confirm.png' });

  // 취소 테스트
  await page.locator('#task-list [data-id]').last()
    .locator('button[onclick^="cancelDelete"]').click();
  await expect(page.locator('#task-list [data-id]').last().locator('text=정말 삭제할까요?')).toBeHidden();

  // 다시 삭제
  await page.locator('#task-list [data-id]').last()
    .locator('button[title="삭제"]').click();
  await page.locator('#task-list [data-id]').last()
    .locator('button[onclick^="handleDeleteTask"]').click();
  await page.waitForTimeout(800);

  const after = await page.locator('#task-list [data-id]').count();
  expect(after).toBe(before - 1);
  await page.screenshot({ path: 'results/tc06-02-task-deleted.png' });
});

// ── TC-07 빈 제목 유효성 검증 ──────────────────────────
test('TC-07 빈 제목 제출 시 오류 표시', async ({ page }) => {
  await login(page);

  await page.locator('button[onclick="toggleAddForm()"]').click();
  await expect(page.locator('#add-form-body')).toBeVisible();
  // 제목 비운 채로 제출
  await page.locator('button[onclick="handleAddTask()"]').click();

  await expect(page.locator('#add-error')).toBeVisible();
  await expect(page.locator('#add-error')).toContainText('제목');
  await page.screenshot({ path: 'results/tc07-01-empty-title-error.png' });
});

// ── TC-08 라이트/다크 테마 + localStorage 유지 ────────
test('TC-08 테마 토글 및 localStorage 유지', async ({ page }) => {
  await login(page);
  await page.screenshot({ path: 'results/tc08-01-light.png' });

  // 다크 전환
  await page.locator('button[onclick="toggleTheme()"]').click();
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  );
  expect(isDark).toBe(true);
  await page.screenshot({ path: 'results/tc08-02-dark.png' });

  // 새로고침 후 다크 유지
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);
  const stillDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  );
  expect(stillDark).toBe(true);
  await page.screenshot({ path: 'results/tc08-03-dark-after-reload.png' });

  // 라이트로 복원
  await page.locator('button[onclick="toggleTheme()"]').click();
});

// ── TC-09 새로고침 후 태스크 목록 유지 ─────────────────
test('TC-09 새로고침 후 태스크 목록 유지', async ({ page }) => {
  await login(page);
  await page.waitForTimeout(800);

  const before = await page.locator('#task-list [data-id]').count();
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  const after = await page.locator('#task-list [data-id]').count();
  expect(after).toBe(before);
  await page.screenshot({ path: 'results/tc09-01-after-reload.png' });
});

// ── TC-10 API 응답 시간 200ms ──────────────────────────
test('TC-10 API 응답 시간 200ms 이내', async ({ page }) => {
  await login(page);

  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now();
    const status = await page.evaluate(async (apiBase) => {
      const token = localStorage.getItem('taskflow_token');
      const r = await fetch(`${apiBase}/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return r.status;
    }, API);
    times.push(Date.now() - t0);
    expect(status).toBe(200);
  }

  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const max = Math.max(...times);
  console.log(`  avg=${avg}ms  max=${max}ms  [${times.join(', ')}ms]`);
  expect(avg).toBeLessThan(200);
  await page.screenshot({ path: 'results/tc10-01-api-timing.png' });
});

// ── TC-11 360px 반응형 — 가로 스크롤 없음 ─────────────
test('TC-11 360px 레이아웃 — 가로 스크롤 없음', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await login(page);
  await page.screenshot({ path: 'results/tc11-01-360px-login.png' });

  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientW = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollW).toBeLessThanOrEqual(clientW + 2);

  await ensureTask(page, '360px 테스트 태스크');
  await page.screenshot({ path: 'results/tc11-02-360px-with-task.png' });

  const scrollW2 = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW2).toBeLessThanOrEqual(clientW + 2);
});
