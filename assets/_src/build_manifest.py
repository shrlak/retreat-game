"""Writes assets/manifest.json and assets/preview.html from the files on disk."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
A = os.path.normpath(os.path.join(HERE, ".."))
BASE = "./assets/"


def has(rel):
    return os.path.exists(os.path.join(A, rel))


def path(rel):
    if not has(rel):
        raise SystemExit(f"missing asset: {rel}")
    return BASE + rel


def listdir(sub, ext=".svg"):
    d = os.path.join(A, sub)
    if not os.path.isdir(d):
        return []
    return sorted(f for f in os.listdir(d) if f.endswith(ext))


ROLES = [
    ("merlin", "good"), ("percival", "good"), ("servant", "good"),
    ("assassin", "evil"), ("morgana", "evil"), ("mordred", "evil"),
    ("oberon", "evil"), ("minion", "evil"),
]

m = {
    "title": "빛의 원정대",
    "version": 1,
    "base": BASE,
    "notes": "All paths are relative to the deployed site root (web/), where assets/ sits next to index.html. No text is baked into any art except the logo lettering.",
    "palette": {
        "gold": "#E9B949", "goldLight": "#F8DC8B", "cream": "#FFF6E5", "parchment": "#F6E7C8",
        "ink": "#4A3426", "amber": "#F4A259", "sky": "#8EC5E8", "pine": "#2F5D50",
        "navy": "#1E2A4A", "navyDark": "#141B33", "navyLight": "#2C3E6B",
        "plum": "#5B3A7A", "plumDark": "#3A2550", "plumLight": "#7E57A6", "lilac": "#B48CE0", "lavender": "#E4D6F5",
        "approve": "#3F9D6B", "reject": "#C8553D",
        "good": "#E9B949", "evil": "#7E57A6",
    },
    "card": {
        "viewBox": "0 0 600 840",
        "artWindow": {"x": 30, "y": 30, "w": 540, "h": 650},
        "namePlate": {"x": 46, "y": 700, "w": 508, "h": 104,
                      "pct": {"left": 7.67, "top": 83.33, "width": 84.67, "height": 12.38},
                      "textColor": {"good": "#4A3426", "evil": "#3A2550"}},
    },
    "roles": {k: {"card": path(f"roles/{k}.svg"), "team": t} for k, t in ROLES},
    "cardBack": path("card-back.svg"),
    "tokens": {
        "success": path("token-success.svg"),
        "fail": path("token-fail.svg"),
        "approve": path("vote-approve.svg"),
        "reject": path("vote-reject.svg"),
        "leader": path("leader.svg"),
        "lady": path("lady.svg"),
    },
    "teams": {"good": path("team-good.svg"), "evil": path("team-evil.svg")},
    "knowledge": {
        "evil": path("knowledge/evil.svg"),
        "merlinCandidate": path("knowledge/merlin-candidate.svg"),
        "unknown": path("knowledge/unknown.svg"),
        "target": path("knowledge/target.svg"),
    },
    "track": {
        "questBoard": {"src": path("track/quest-board.svg"), "viewBox": "0 0 1000 240",
                       "slots": [{"x": x, "y": 125, "r": 70} for x in (120, 310, 500, 690, 880)]},
        "voteTrack": {"src": path("track/vote-track.svg"), "viewBox": "0 0 1000 160",
                      "slots": [{"x": x, "y": 80, "r": 46} for x in (140, 320, 500, 680, 860)]},
        "voteMarker": path("track/vote-marker.svg"),
        "questSlot": path("track/quest-slot.svg"),
        "twoFails": path("track/two-fails.svg"),
    },
    "backgrounds": {
        "home": path("backgrounds/home.svg"),
        "game": path("backgrounds/game.svg"),
        "reveal": path("backgrounds/reveal.svg"),
        "victoryGood": path("backgrounds/victory-good.svg"),
        "victoryEvil": path("backgrounds/victory-evil.svg"),
        "pattern": path("bg-pattern.svg"),
        "patternOverlay": path("bg-pattern-overlay.svg"),
        "css": "background-size: cover; background-position: center",
    },
    "logo": {"full": path("logo.svg"), "light": path("logo-light.svg"), "mark": path("logo-mark.svg")},
    "avatars": [BASE + "avatars/" + f for f in sorted(listdir("avatars"), key=lambda s: int(''.join(c for c in s if c.isdigit()) or 0))],
    "icons": {f[:-4]: BASE + "icons/" + f for f in listdir("icons")},
}

with open(os.path.join(A, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(m, f, ensure_ascii=False, indent=2)

# ---------------------------------------------------------------- preview
names = {"merlin": "선지자", "percival": "파수꾼", "servant": "빛의 일꾼", "assassin": "정탐꾼",
         "morgana": "거짓 선지자", "mordred": "양의 탈을 쓴 늑대", "oberon": "방황하는 자", "minion": "유혹하는 자"}


def rel(p):
    return p.replace(BASE, "./")


cards = "".join(
    f'<figure class="card"><img src="{rel(v["card"])}" alt=""><span class="nm {v["team"]}">{names[k]}</span></figure>'
    for k, v in m["roles"].items()
)
toks = "".join(f'<figure class="tok"><img src="{rel(v)}" alt=""><figcaption>{k}</figcaption></figure>'
               for k, v in {**m["tokens"], **m["teams"], **m["knowledge"]}.items())
bgs = "".join(f'<figure class="bg"><img src="{rel(v)}" alt=""><figcaption>{k}</figcaption></figure>'
              for k, v in m["backgrounds"].items() if k not in ("css", "pattern", "patternOverlay"))
avs = "".join(f'<img class="av" src="{rel(v)}" alt="">' for v in m["avatars"])
ics = "".join(f'<span class="ic" title="{k}"><img src="{rel(v)}" alt=""></span>' for k, v in m["icons"].items())
html = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>빛의 원정대 에셋 미리보기</title><style>
body{{margin:0;background:#1E2A4A url(./bg-pattern.svg);color:#FFF6E5;font-family:system-ui,sans-serif;padding:16px}}
h2{{font-size:16px;margin:28px 0 10px;color:#F8DC8B}}
.row{{display:flex;flex-wrap:wrap;gap:12px}}
.card{{position:relative;margin:0;width:160px}} .card img{{width:100%;display:block;filter:drop-shadow(0 6px 14px #0008)}}
.nm{{position:absolute;left:7.67%;top:83.33%;width:84.67%;height:12.38%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}}
.nm.good{{color:#4A3426}} .nm.evil{{color:#3A2550}}
.tok{{margin:0;width:84px;text-align:center;font-size:11px;opacity:.9}} .tok img{{width:72px;height:72px}}
.bg{{margin:0;width:150px;font-size:11px}} .bg img{{width:150px;height:300px;object-fit:cover;border-radius:12px}}
.av{{width:48px;height:48px}} .ic{{color:#F8DC8B;padding:6px}} .ic img{{width:24px;height:24px;filter:invert(86%) sepia(30%) saturate(600%) hue-rotate(-10deg)}}
.track img{{width:100%;max-width:560px;display:block;margin-bottom:8px}}
</style></head><body>
<img src="./logo.svg" alt="빛의 원정대" style="width:280px;display:block;margin:8px auto">
<h2>역할 카드</h2><div class="row">{cards}<figure class="card"><img src="./card-back.svg" alt=""></figure></div>
<h2>토큰 · 투표 · 팀 · 정보</h2><div class="row">{toks}</div>
<h2>트랙</h2><div class="track"><img src="./track/quest-board.svg" alt=""><img src="./track/vote-track.svg" alt=""></div>
<h2>배경</h2><div class="row">{bgs}</div>
<h2>아바타</h2><div class="row">{avs}</div>
<h2>아이콘</h2><div class="row">{ics}</div>
</body></html>"""
with open(os.path.join(A, "preview.html"), "w", encoding="utf-8") as f:
    f.write(html)
print("manifest.json + preview.html written;", len(m["icons"]), "icons,", len(m["avatars"]), "avatars")
