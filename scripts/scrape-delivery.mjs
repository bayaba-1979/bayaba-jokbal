// scrape-delivery.mjs
// 배달의민족 / 요기요 / 쿠팡이츠 — 매장 메뉴·가격 파싱 (Playwright)
//
// ⚠️ 중요 제약 (정직한 안내):
//   배민·요기요·쿠팡이츠는 '사장님 계정' 로그인 + 본인인증(OTP/캡차)이 필수라
//   자동 로그인·파싱·수정은 사장님 세션(브라우저 프로필)이 있어야 동작합니다.
//   이 스크립트는 (1) 세션 재사용 (2) 대상 페이지 스크린샷/DOM 덤프 (3) 메뉴 추출까지
//   골격을 제공합니다. 로그인은 최초 1회 사장님이 직접 수행한 뒤 profile을 재사용하세요.
//
// 사용법:
//   node scripts/scrape-delivery.mjs baemin   # 사장님 세션으로 배민 페이지 열기
//   node scripts/scrape-delivery.mjs shot https://...  # 특정 URL 스크린샷

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const PROFILE_DIR = path.resolve('data/.pw-profile'); // 사장님 세션 저장 (gitignore 대상)

const PLATFORMS = {
  baemin:       { name: '배달의민족', url: 'https://baemin.com/' },
  yogiyo:       { name: '요기요',       url: 'https://www.yogiyo.co.kr/' },
  coupang_eats: { name: '쿠팡이츠',     url: 'https://www.coupangeats.com/' },
  naver_place:  { name: '네이버 플레이스', url: 'https://place.naver.com/' },
};

async function launch() {
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,          // 사장님 로그인 화면을 직접 봐야 하므로 headed (서버에선 Xvfb 사용)
    viewport: { width: 1280, height: 900 },
    locale: 'ko-KR',
  });
}

function dump(page, label, data) {
  const dir = path.resolve('data/scrape');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${label}-${Date.now()}.json`);
  fs.writeFileSync(f, JSON.stringify(data, null, 2));
  console.log(`[dump] ${f}`);
}

async function main() {
  const [, , cmd, arg] = process.argv;
  const browser = await launch();
  const page = browser.contexts()[0].pages()[0] ?? await browser.newPage();

  if (cmd === 'shot' && arg) {
    await page.goto(arg, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    const dir = path.resolve('data/scrape');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, `shot-${Date.now()}.png`), fullPage: false });
    const title = await page.title();
    dump(page, 'shot', { url: arg, title, text: (await page.textContent('body'))?.slice(0, 4000) });
    console.log(`[title] ${title}`);
  } else {
    const plat = PLATFORMS[cmd] ?? PLATFORMS.baemin;
    console.log(`[open] ${plat.name} → ${plat.url}`);
    await page.goto(plat.url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    // 사장님 로그인은 여기서 수동 진행 → 세션은 PROFILE_DIR에 영구 저장됨
    await page.waitForTimeout(60_000); // 60초 동안 사장님이 로그인/메뉴판 진입
    const data = {
      platform: plat.name,
      url: page.url(),
      title: await page.title(),
      bodyText: (await page.textContent('body'))?.slice(0, 12000),
    };
    dump(page, cmd || 'page', data);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
