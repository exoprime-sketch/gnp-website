# Green Net Power website

Green Net Power의 한국어·영어 정적 웹사이트입니다.

## URL 구조

- `/` — 한국어
- `/en/` — English

두 페이지는 `src/site.template.html`의 공통 마크업과 다음 언어 파일에서 생성됩니다.

- `src/locales/ko.json`
- `src/locales/en.json`

새 언어를 추가할 때는 해당 JSON 파일을 추가하고 `scripts/build.mjs`의 페이지 목록에 출력 경로를 등록합니다. 사용자 노출 문구를 생성된 HTML에 직접 수정하지 않습니다.

## 로컬 검증

```text
npm run build
npm run check
```

빌드 결과인 `index.html`과 `en/index.html`도 저장소에 포함됩니다. 이 방식은 기존 GitHub Pages의 루트 정적 배포와 custom domain을 그대로 유지합니다.

## 콘텐츠 검토

`src/locales/en.json`의 `TODO_CONTENT_REVIEW`에는 원문 의미 확인이 필요한 항목이 기록되어 있습니다. 현재 공개 영문 문구는 확인되지 않은 의미를 추가하지 않도록 중립적으로 작성했습니다.

`CNAME`은 `greennetpower.com`으로 유지해야 합니다.
