# PLAYROOM · 웹 게임 갤러리

별도 빌드나 서버 프로그램 없이 GitHub Pages에 올리는 HTML/CSS/JavaScript 사이트입니다. 제공된 Gemini 공유 링크 1개는 예시이며, 게임 내용이나 접근 가능 여부는 검증하지 않았습니다. 실제 게임 링크로 교체해 사용하세요.

## 1. 내 컴퓨터에서 실행

`index.html`을 더블클릭하면 브라우저 보안 정책으로 JSON을 읽지 못할 수 있습니다. 이 폴더에서 터미널을 열어 다음을 실행합니다(별도 Python 설치 필요).

```sh
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다. 종료는 터미널에서 Ctrl+C입니다. Python이 없다면 편집기의 정적 사이트 미리보기 기능을 사용하거나 GitHub Pages로 바로 배포하세요.

## 2. 게임 편집

1. 오른쪽 위 **관리 모드**를 누릅니다.
2. **게임 추가**에서 게임 이름, `https://` 또는 `http://` 링크, 썸네일 파일을 설정합니다. 썸네일은 선택 사항입니다.
3. 카드의 **편집 / 삭제 / ↑ 위로 / ↓ 아래로** 버튼으로 수정합니다. 검색을 비우면 전체 순서를 확인하기 쉽습니다.
4. **JSON 내보내기**로 `games.json`을 다운로드합니다.
5. 사이트 폴더의 기존 `games.json`을 다운로드한 파일로 교체한 뒤 GitHub에 올립니다.

썸네일은 3MB 이하 PNG/JPG/WebP/GIF를 지원하며 JSON 안에 이미지 데이터로 저장됩니다. 업로드한 GIF는 그대로 유지됩니다. 파일 크기를 줄이려면 가로 800px 안팎의 압축된 WebP/JPG를 권장합니다. 많은 이미지를 넣으면 브라우저 저장 한도에 도달할 수 있습니다. 저장 실패 안내가 나오면 페이지를 닫기 전에 JSON을 내보내세요. 가져오기는 파일당 30MB, 게임 300개까지 지원합니다.

**JSON 가져오기**는 현재 목록 전체를 교체합니다. 교체 전 확인 창이 뜨며, 백업해 둔 JSON으로 복원할 수 있습니다. **공개 목록으로 되돌리기**는 브라우저 편집본을 버리고 페이지를 열 때 읽은 공개 목록으로 복구합니다. 최근 배포본을 읽으려면 페이지를 새로고침한 후 실행하세요.

## 3. GitHub Pages 배포

1. GitHub에서 새 저장소를 만듭니다. 무료 계정이라면 공개(Public) 저장소를 사용하세요.
2. **Add file → Upload files**로 아래 항목을 저장소 최상위에 올리고 커밋합니다. ZIP 파일 자체를 올리지 마세요.
   - `index.html`
   - `style.css`
   - `app.js`
   - `games.json`
   - `assets/` 폴더
   - `.nojekyll` (선택)
3. **Settings → Pages → Build and deployment**에서 **Deploy from a branch**를 선택합니다.
4. Branch는 `main`, 폴더는 `/(root)`를 선택하고 **Save**를 누릅니다.
5. 배포가 끝나면 Pages 화면에 표시된 사이트 주소를 엽니다. 일반적으로 `https://계정명.github.io/저장소명/`입니다.

위 메뉴 이름은 GitHub UI에 따라 달라질 수 있습니다. GitHub 공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

목록을 업데이트할 때는 내보낸 `games.json`으로 저장소의 기존 파일을 교체하고 커밋하면 됩니다. 업로드한 썸네일은 JSON에 포함되므로 따로 올릴 필요가 없습니다. 배포 후 기존 관리자 브라우저에서는 편집본이 우선 표시됩니다. 새로고침 후 **공개 목록으로 되돌리기**, 또는 시크릿 창에서 배포 결과를 확인하세요.

## 4. 저장 방식과 관리 모드의 의미

- 공개 목록: 저장소의 `games.json`. 모든 방문자가 읽습니다.
- 편집본: 현재 사이트 주소의 브라우저 `localStorage`. 이 브라우저에만 남습니다. 시크릿 모드 종료, 사이트 데이터 삭제, 기기 변경 시 사라질 수 있습니다.
- 공개 반영: JSON 내보내기 → 저장소 파일 교체 → 커밋/Pages 배포.

**관리 모드는 누구나 열 수 있는 로컬 편집 도구입니다. 인증이나 접근 제어가 아닙니다.** 다른 방문자의 편집은 해당 방문자의 브라우저에만 저장되며 실제 공개 목록을 변경하지 못합니다. 공개 목록을 수정하는 권한은 GitHub 저장소 권한으로 관리합니다. 비밀번호나 GitHub 토큰을 HTML/JS/JSON에 넣지 마세요. 이 사이트는 GitHub API나 토큰을 사용하지 않습니다. JSON과 이미지는 공개 파일이므로 개인정보나 비밀 자료를 넣지 마세요.

## 5. 파일 구조와 직접 수정

```text
game-gallery/
├── index.html
├── style.css
├── app.js
├── games.json
├── .nojekyll
├── README.md
└── assets/
    ├── placeholder.svg
    └── cover-*.svg
```

데이터 예시:

```json
{
  "version": 1,
  "games": [
    {
      "id": "my-game-1",
      "name": "나의 게임",
      "url": "https://example.com/game",
      "thumbnail": "assets/my-thumbnail.webp"
    }
  ]
}
```

`id`는 비어 있지 않은 고유 문자열이어야 하고, 배열 순서가 카드 순서입니다. 직접 편집할 때 썸네일은 `assets/` 아래 상대 경로, HTTP(S) 이미지 주소, 지원하는 이미지의 base64 데이터, 또는 빈 문자열을 사용할 수 있습니다. 직접 추가한 `assets/` 이미지는 저장소에도 올려야 합니다. 관리자 업로드는 외부 SVG를 받지 않으며 제공된 SVG는 기본 디자인용 파일입니다.

게임은 새 탭으로 열립니다. 외부 서비스의 로그인·공유 권한·링크 만료는 해당 서비스에서 설정해야 합니다. Google Fonts를 읽지 못해도 시스템 글꼴로 표시됩니다. 모바일 레이아웃, 키보드 조작, 검색, 오류 썸네일 대체 표시를 지원합니다.
