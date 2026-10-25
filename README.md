# PLAYROOM · 웹 게임 갤러리

게임 이름, 썸네일, 링크를 모아 보여주는 GitHub Pages용 정적 사이트입니다. 검색과 모바일 레이아웃을 지원합니다. 게임은 새 탭에서 열립니다.

공개 사이트: https://choi586.github.io/playroom-game-gallery/

## 게임 추가 및 수정

저장소의 `games.json`을 수정하고 커밋하면 GitHub Pages가 자동 배포합니다. 썸네일은 `assets/`에 올린 후 해당 경로를 지정하세요. 썸네일이 없으면 빈 문자열을 넣어 기본 이미지를 표시합니다. 배열 순서가 화면 순서입니다.

```json
{
  "version": 1,
  "games": [
    {
      "id": "unique-game-id",
      "name": "이름 - 게임 제목",
      "url": "https://example.com/game",
      "thumbnail": "assets/thumbnail.png"
    }
  ]
}
```

공개 사이트에는 관리 버튼이나 편집 화면이 없습니다. 브라우저에 남아 있는 예전 편집본을 읽지 않고 공개된 `games.json`을 불러옵니다.

## 로컬 실행

이 폴더에서 `python3 -m http.server 8000`을 실행하고 http://localhost:8000 을 여세요. 종료는 Ctrl+C입니다.

## 배포

파일과 `assets/` 폴더를 저장소 최상위에 올린 뒤 Settings → Pages에서 `main` 브랜치와 `/(root)`를 배포 대상으로 설정합니다. 별도 빌드는 필요하지 않습니다.
