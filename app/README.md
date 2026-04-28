# VaultKeeper Electron App

VaultKeeper 클라이언트 데스크톱 앱. Electron 메인 프로세스가 [`htmluibuild`](../htmluibuild) 의 빌드된 React UI 를 로드하고, 로컬 Kopia 서버 바이너리를 서브프로세스로 띄워 백업/복구를 수행합니다.

> **상위 빌드 흐름:** 일반적으로 직접 이 디렉토리에서 빌드하지 않고, 프로젝트 루트의 [`scripts/build-distributions.sh`](../../scripts/build-distributions.sh) 가 htmlui → kopia 바이너리 → Electron 패키징 전체를 한 번에 수행합니다 (env-aware: prod/dev/stg/local).

## 패키지 식별자

`package.json` 의 `build` 섹션 — 환경별 빌드 시 [build-distributions.sh](../../scripts/build-distributions.sh) 가 productName / appId / output 을 sed 패치 (자세한 정책: [230.design-version-management.md](../../docs/vaultkeeper/230.design-version-management.md)):

| 환경 | productName | appId | output |
|------|-------------|-------|--------|
| prod | `VaultKeeper` | `com.bsquarelab.vaultkeeper` | `../dist/vaultkeeper-ui` |
| dev | `VaultKeeper-dev` | `com.bsquarelab.vaultkeeper.dev` | `../dist/vaultkeeper-ui-dev` |
| stg | `VaultKeeper-stg` | `com.bsquarelab.vaultkeeper.stg` | `../dist/vaultkeeper-ui-stg` |
| local | `VaultKeeper-local` | `com.bsquarelab.vaultkeeper.local` | `../dist/vaultkeeper-ui-local` |

## 데이터 폴더 (macOS)

`productName` 과 `app.getName().toLowerCase()` 기반으로 환경별 분리됨:

| 경로 | 결정 | 환경 분리 |
|------|------|---------|
| `~/Library/Application Support/vaultkeeper(-env)/` | [public/config.js](public/config.js) `getName().toLowerCase()` | ✅ env 별 |
| `~/Library/Application Support/VaultKeeper(-env)/` | Electron 기본 userData (productName) | ✅ |
| `~/Library/Caches/VaultKeeper(-env)/` | Electron 기본 cache | ✅ |
| `~/Library/Logs/VaultKeeper(-env)/` | Electron 기본 logs | ✅ |
| `~/Library/Preferences/com.bsquarelab.vaultkeeper(.env).plist` | macOS NSUserDefaults (appId) | ✅ |

데이터 초기화: [`scripts/vaultkeeper-initialize.sh`](../../scripts/vaultkeeper-initialize.sh) `dev|stg|prod` 파라미터.

## 개발 모드 실행

dev 빌드 없이 Electron 만 직접 띄워 메인 프로세스 코드를 즉시 검증:

```bash
npm install
npm run dev          # = electron .
# 또는
npm start            # = electron .
```

> **선행:** [build-distributions.sh](../../scripts/build-distributions.sh) Step 2 의 Kopia 바이너리가 `../dist/kopia_{darwin_universal,windows_amd64,linux_*}/` 에 있어야 Electron 이 정상 부팅 (없으면 `failed to load content` 루프).

## 빌드

대부분의 경우 루트의 build-distributions.sh 사용을 권장. 단독 사용 시:

```bash
npm install
npm run build-electron               # 호스트 OS 기준
npm run build-electron-windows       # Windows 크로스 빌드
npm run build-electron-linux         # Linux 크로스 빌드
npm run build-electron-dir           # 패키징 없이 dir 출력 (디버깅)
```

> **주의:** 단독 빌드는 package.json 을 그대로 사용하므로 productName 등이 prod 기준으로 고정됩니다. env-aware 빌드는 build-distributions.sh 만이 sed 패치로 처리.

## 자동 업데이트

`build.publish` 의 `url` 은 빌드 타임 placeholder `__VAULTKEEPER_UPDATE_URL__` 로 보존됨. build-distributions.sh 가 환경에 맞는 backend URL (htmlui `.env` 의 `VITE_VAULTKEEPER_BACKEND_URL` 기반) 을 sed 로 주입:

```
publish.url = ${VITE_VAULTKEEPER_BACKEND_URL}/distributions/electron-update
```

electron-updater 가 이 URL 의 `latest-{platform}.yml` feed 를 폴링 → backend 가 API Key 인증으로 응답 → 버전 비교 → 새 버전 다운로드. 자세한 흐름: [260.design-distributions.md](../../docs/vaultkeeper/260.design-distributions.md) 의 "클라이언트 자동 업데이트".

## 코드 서명 / 노타라이즈

| OS | 위치 |
|----|------|
| macOS | [notarize.mjs](notarize.mjs) (Apple notarytool, `electron-builder` afterSign 훅) |
| Windows | [sign.mjs](sign.mjs) (Authenticode, `signtoolOptions.sign`) |
| Linux | [vaultkeeper-ui.apparmor](vaultkeeper-ui.apparmor) (AppImage/deb/rpm appArmorProfile) |

비-prod 환경은 build-distributions.sh 가 apparmor 사본 (`vaultkeeper-ui-{env}.apparmor`) 을 동적 생성.

## 테스트

```bash
npm run e2e          # Playwright E2E
```

## 주요 파일

- [public/electron.js](public/electron.js) — 메인 프로세스 (창 생성, autoUpdater, IPC, kopia 서브프로세스 spawn)
- [public/config.js](public/config.js) — 설정 디렉토리 결정 로직 (env-aware)
- [public/preload.js](public/preload.js) — renderer ↔ main IPC 브리지
- [package.json](package.json) — electron-builder 설정 (productName/appId/publish/extraResources 등)
