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

## 용어 메모

전력 케이블 분야의 `활락`은 경사지 케이블이 온도 변화에 따른 신축으로 아래쪽으로 미끄러지는 현상을 뜻합니다. 영문 페이지에서는 이를 `transmission-cable slippage assessment`로 표기합니다.

검토 근거:

- [한국전력 전력 용어집 — 미끄러짐(활락)](https://k-knowledge.kr/srch/read.jsp?id=268075254)
- [대한민국 공개특허 KR20200041574A — 활락방지 케이블 받침대 및 시공방법](https://patents.google.com/patent/KR20200041574A/ko)
- [Jicable 2015 — vertical cable slippage under thermal load cycles](https://www.jicable.org/TOUT_JICABLE/2015/2015-D3-8.pdf)

`CNAME`은 `greennetpower.com`으로 유지해야 합니다.
