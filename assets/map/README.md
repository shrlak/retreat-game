# 여정 지도 (map/)

사명(라운드) 사이에 보여 주는 양피지 지도와, 길을 따라 움직이는 말(마커)입니다. `python3 _src/build_map.py` 로 다시 만듭니다.

| 파일 | 크기 | 용도 |
|---|---|---|
| `journey.svg` | `0 0 600 1300`, slice | 지도 본체. 길 `#mp_route`, 정거장 받침 `#mp_stop1`…`#mp_stop5` (반지름 46, 비어 있음) |
| `route.json` | – | 길의 `d`, 출발점, 정거장 중심과 길이 비율 `t`, 권장 크기 |
| `marker.svg` | `0 0 100 100` | 등불 든 순례자 + 어린 양. **기준점은 발밑 (50, 92)** |
| `stop-done-good.svg` | `0 0 100 100` | 성공한 정거장 위 금빛 밀랍 인장 |
| `stop-done-evil.svg` | `0 0 100 100` | 실패한 정거장 위 보랏빛 밀랍 인장 |
| `stop-current.svg` | `0 0 140 140` | 다음 목적지를 표시하는 금빛 맥동 고리 |

## 좌표 (지도 단위, viewBox 기준)
- 출발 캠프: (300, 1222)
- 정거장 1 우물 (185,1040) t=0.1563 · 2 목자의 들 (420,845) t=0.3817 · 3 강 건너기 (195,640) t=0.6063 · 4 빛의 산 (415,432) t=0.8296 · 5 거룩한 성문 (300,236) t=1
- 각 정거장 중심은 길 위에 정확히 놓여 있습니다(구간 끝점). `t` = 그 지점까지의 길이 / 전체 길이.

## 배치 방법
지도 컨테이너를 `position:relative` 로 두고, `journey.svg` 를 **인라인**(권장: `getPointAtLength` 사용 가능) 하거나 `<img>`로 넣은 뒤, 오버레이를 지도 단위 → 화면 픽셀(`scale = 컨테이너너비 / 600`)로 변환해 절대 위치로 올립니다.
- 마커: 크기 `markerSize`(90) 지도 단위. `left = x − 0.5·size`, `top = y − 0.92·size`.
- 완료 인장: 크기 `badgeSize`(84), 정거장 중심에 가운데 정렬.
- 현재 목적지 고리: 크기 140, 정거장 중심에 가운데 정렬(받침 지름 92보다 크게 둘러쌈).
- 번호·성공/실패 토큰을 직접 올릴 경우에도 정거장 중심 / 반지름 46을 쓰면 됩니다.

## 이동 애니메이션 (모든 기기 싱크)
상태는 **서버 상태에서만** 계산합니다. 애니메이션 타이밍은 로컬이어도, 시작과 끝 위치가 `view.round` / `view.quests` 로 결정되므로 모든 폰이 같은 장면이 됩니다.

```js
const R = await (await fetch('assets/map/route.json')).json();
const path = svgRoot.querySelector('#mp_route');      // 인라인 journey.svg
const L = path.getTotalLength();                       // ≈ R.routeLength
const tAt = i => i === 0 ? 0 : R.stops[i - 1].t;       // 0 = 출발, 1..5 = 정거장

// 완료한 사명 수 n = view.quests 중 결과가 난 개수 (0..5)
function moveMarker(fromIdx, toIdx, ms = 2500) {
  const a = tAt(fromIdx) * L, b = tAt(toIdx) * L, t0 = performance.now();
  const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2; // ease-in-out
  (function step(now) {
    const k = Math.min(1, (now - t0) / ms);
    const p = path.getPointAtLength(a + (b - a) * ease(k));
    placeMarker(p.x, p.y);           // 위 '배치 방법' 공식 사용
    followCamera(p.y);               // 지도를 스크롤/확대해 마커를 화면 중앙 근처에 유지
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}
```
- 화면 진입 시: 마커를 직전 위치(`n−1`)에 두고 `moveMarker(n−1, n)` 재생, 끝나면 정거장 `n`에 `stop-done-good/evil` 을 페이드인, 다음 목적지(`n+1`)에 `stop-current` 표시. 이미 지난 정거장(1…n−1)은 처음부터 인장을 표시.
- 늦게 들어온 폰/새로고침: 애니메이션 없이 바로 `n` 위치에 그립니다(같은 최종 상태).
- `prefers-reduced-motion` 이면 이동을 건너뛰고 바로 최종 위치로.
- 대안: CSS `offset-path: path('<R.route>')` + `offset-distance` 를 `t·100%` 로 전환해도 됩니다. 이때 마커 요소는 지도와 같은 600×1300 좌표계(SVG 안의 `<g>` 또는 같은 비율로 scale 된 레이어) 안에 있어야 합니다.
- 지나온 길을 금빛으로 칠하려면 `#mp_route` 를 복제해 `stroke="#E9B949"`, `stroke-dasharray: L`, `stroke-dashoffset: L − t·L` 로 그리면 됩니다.

## 성능
- 움직임은 transform/opacity 뿐, 필터 없음. `journey.svg` 안 애니메이션 요소 14개, 약 70 KB.
- 지도가 보이지 않을 때는 DOM에서 빼거나 `display:none` 으로 두세요.
