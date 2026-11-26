"""Expansion art: twin side-switcher role cards (Lancelot-type), allegiance-switch
cards and the Excalibur-type token (drawn as a golden key, never a weapon)."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *  # noqa

A = os.path.normpath(os.path.join(HERE, ".."))


def write(rel, s):
    p = os.path.join(A, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


def medallion(cx, cy, r, good, p):
    """Two-faced pendant: sun half and moon half."""
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r+4}" fill="#7A4D16"/>'
        f'<path d="M{cx},{cy-r} A{r},{r} 0 0,0 {cx},{cy+r}Z" fill="#F6C453"/>'
        f'<path d="M{cx},{cy-r} A{r},{r} 0 0,1 {cx},{cy+r}Z" fill="#7E57A6"/>'
        f'<circle cx="{cx-r*0.45:.1f}" cy="{cy}" r="{r*0.28:.1f}" fill="#FFF0BE"/>'
        f'<circle cx="{cx+r*0.45:.1f}" cy="{cy}" r="{r*0.3:.1f}" fill="#F3E9C6"/>'
        f'<circle cx="{cx+r*0.56:.1f}" cy="{cy-r*0.08:.1f}" r="{r*0.25:.1f}" fill="#7E57A6"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{"#FFF4D2" if good else "#EFE4FB"}" stroke-width="2" opacity=".7"/>'
    )


def twin(good):
    p = "rlg_" if good else "rle_"
    if good:
        sky = [(0, "#8CBFE3"), (0.5, "#FFE2AE"), (1, "#F6A469")]
        robe, robe2, trim, hair, face = "#F3F0FA", "#D8D0E8", "#E9B949", "#3B2A22", "kind"
        glow, cloak = "#FFF7D6", "#5E9ECF"
        hills_ = [("M30,520 Q140,470 260,500 Q380,455 480,488 Q540,470 570,478 V680 H30Z", "#E8B88E", 1),
                  ("M30,590 Q170,548 310,575 Q450,550 570,568 V680 H30Z", "#8FBF84", 1)]
    else:
        sky = [(0, "#1E1838"), (0.5, "#4B2E6B"), (1, "#B07AA8")]
        robe, robe2, trim, hair, face = "#3A2550", "#26173A", "#B48CE0", "#3B2A22", "sly"
        glow, cloak = "#C9A6F0", "#5B3A7A"
        hills_ = [("M30,520 Q140,470 260,500 Q380,455 480,488 Q540,470 570,478 V680 H30Z", "#3C3060", 1),
                  ("M30,590 Q170,548 310,575 Q450,550 570,568 V680 H30Z", "#2C2448", 1)]
    defs = (lin(p + "sky", sky) + glow_def(p + "gl", glow, 0.95)
            + lin(p + "mir", [(0, "#FFFFFF", 0.0), (0.5, "#FFFFFF", 0.22), (1, "#FFFFFF", 0.0)], 0, 0, 1, 0))
    sc = [f'<rect x="30" y="30" width="540" height="650" fill="url(#{p}sky)"/>']
    sc.append(stars(51 if good else 52, 22, 40, 50, 560, 300, "#FFF6D8", 1.0, 2.4, 0.2))
    if good:
        sc.append(rays(300, 300, 14, 60, 420, 4, "#FFF6D2", 0.3))
        sc.append(dove(140, 150, 0.9))
    else:
        sc.append('<circle cx="450" cy="140" r="46" fill="#F3E9C6" opacity=".95"/><circle cx="470" cy="128" r="40" fill="#2A1D45"/>')
    sc.append(f'<circle cx="300" cy="330" r="250" fill="url(#{p}gl)" class="glow"/>')
    sc.append(hills(hills_))
    # the faint mirrored "other self" behind: same silhouette, opposite colour
    ghost_col = "#7E57A6" if good else "#F6C453"
    gb, gh, _ = figure(300, 690, 1.24, ghost_col, ghost_col, ghost_col, ghost_col, "short", "kind",
                       arms=[("L", 196, 520), ("R", 404, 520)])
    sc.append(f'<g opacity=".22" transform="translate(28,-10)">{gb}{gh}</g>')
    # cloak and figure
    sc.append(f'<path d="M222,470 Q170,560 160,700 L440,700 Q430,560 378,470Z" fill="{cloak}"/>')
    body, hands, (hx, hy) = figure(300, 690, 1.12, robe, robe2, P["skin2"], hair, "short", face,
                                   arms=[("L", 238, 540), ("R", 362, 540)], trim=trim)
    sc.append(body)
    # pendant on a chain, held up in both hands
    sc.append(f'<path d="M270,452 Q300,500 330,452" fill="none" stroke="{trim}" stroke-width="3"/>')
    sc.append(f'<path d="M238,540 Q300,520 362,540" fill="none" stroke="{trim}" stroke-width="3" opacity=".8"/>')
    sc.append(f'<g transform="translate(300,560)"><g class="bob">{medallion(0, 0, 34, good, p)}</g></g>')
    sc.append(hands)
    sc.append(sparkle_star(258, 520, 8, "#FFFFFF", "tw"))
    sc.append(sparkle_star(346, 600, 6, "#FFFFFF", "tw2"))
    if not good:
        sc.append(sparkle_star(120, 200, 9, "#E4D6F5", "tw3"))
    write(f"roles/{'lancelotGood' if good else 'lancelotEvil'}.svg",
          card(p, "good" if good else "evil", "".join(sc), defs))


def switch_card(change):
    """Loyalty deck card (engine LOYALTY_DECK), 600x840. change=False: none, True: switch."""
    p = "swc_" if change else "sws_"
    defs = (lin(p + "bg", [(0, "#22325C"), (1, "#141B33")])
            + lin(p + "fr", [(0, "#FBE3A0"), (0.5, "#C9973E"), (1, "#7A4D16")], 0, 0, 1, 1)
            + glow_def(p + "gl", "#FFE3A0" if not change else "#E4D6F5", 0.9)
            + lin(p + "pa", [(0, "#FFF8EA"), (1, "#EBD6AE")])
            + f'<clipPath id="{p}cl"><rect x="30" y="30" width="540" height="780" rx="26"/></clipPath>')
    b = [f'<rect width="600" height="840" rx="36" fill="url(#{p}fr)"/>',
         f'<rect x="30" y="30" width="540" height="780" rx="26" fill="url(#{p}bg)"/>',
         f'<g clip-path="url(#{p}cl)">',
         stars(61 if change else 62, 30, 40, 40, 560, 800, "#FFF6D8", 0.8, 2.0, 0.12),
         f'<circle cx="300" cy="420" r="260" fill="url(#{p}gl)" class="glow"/>', "</g>",
         f'<rect x="44" y="44" width="512" height="752" rx="20" fill="none" stroke="#F8DC8B" stroke-width="2" opacity=".6"/>']
    if not change:
        # unrolled scroll with a sealed olive branch: "stay as you are"
        b.append(f'<rect x="150" y="300" width="300" height="240" rx="10" fill="url(#{p}pa)" stroke="#B9832A" stroke-width="4"/>')
        b.append('<rect x="128" y="288" width="30" height="264" rx="15" fill="#E3C58C" stroke="#B9832A" stroke-width="4"/>'
                 '<rect x="442" y="288" width="30" height="264" rx="15" fill="#E3C58C" stroke="#B9832A" stroke-width="4"/>')
        b.append('<path d="M190,350 H410 M190,380 H380 M190,410 H400" stroke="#C9973E" stroke-width="4" stroke-linecap="round" opacity=".45"/>')
        # olive branch
        b.append('<path d="M210,500 Q300,450 400,470" fill="none" stroke="#6B4A2E" stroke-width="5" stroke-linecap="round"/>')
        for i, (lx, ly, a) in enumerate([(240, 486, -40), (270, 470, 30), (300, 466, -35), (330, 462, 25), (360, 462, -30), (385, 466, 30)]):
            b.append(f'<ellipse cx="{lx}" cy="{ly}" rx="16" ry="6" fill="#6E9A5E" transform="rotate({a} {lx} {ly})"/>')
        b.append('<circle cx="300" cy="540" r="30" fill="#C8553D"/><circle cx="300" cy="540" r="20" fill="#A8432E"/>'
                 '<path d="M290,540 l7,7 l14,-16" fill="none" stroke="#FFE3C8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
        b.append(dove(300, 230, 1.3))
    else:
        # two-faced coin spinning between two curved arrows: "sides switch"
        b.append('<g transform="translate(300,420)"><g class="spin">'
                 '<path d="M-170,-40 A175,175 0 0,1 120,-130" fill="none" stroke="#F8DC8B" stroke-width="14" stroke-linecap="round"/>'
                 '<path d="M104,-162 L150,-118 L92,-100Z" fill="#F8DC8B"/>'
                 '<path d="M170,40 A175,175 0 0,1 -120,130" fill="none" stroke="#B48CE0" stroke-width="14" stroke-linecap="round"/>'
                 '<path d="M-104,162 L-150,118 L-92,100Z" fill="#B48CE0"/></g></g>')
        b.append(medallion(300, 420, 96, True, p))
        b.append(sparkle_star(230, 330, 12, "#FFFFFF", "tw"))
        b.append(sparkle_star(380, 520, 10, "#FFFFFF", "tw2"))
        b.append(sparkle_star(390, 320, 8, "#E4D6F5", "tw3"))
    b.append(f'<circle cx="300" cy="40" r="14" fill="#7A4D16"/><circle cx="300" cy="40" r="9" fill="#F6C453"/>')
    write(f"loyalty/{'switch' if change else 'none'}.svg", svg(600, 840, "".join(b), defs))


def key_token():
    """Excalibur-type token: a golden key that can 'turn' one played card."""
    p = "xk_"
    defs = (rad(p + "bg", [(0, "#2C8C8C"), (0.7, "#1E4E5C"), (1, "#142A3A")])
            + lin(p + "rim", [(0, "#FBE3A0"), (0.5, "#E2A945"), (1, "#8A5A1C")], 0, 0, 1, 1)
            + lin(p + "key", [(0, "#FFF0BE"), (0.45, "#F6C453"), (1, "#B9832A")], 0, 0, 1, 1)
            + glow_def(p + "gl", "#FFF1C4", 0.8))
    beads = "".join(f'<circle cx="{100+86*__import__("math").cos(i*0.3927):.1f}" cy="{100+86*__import__("math").sin(i*0.3927):.1f}" r="2.6"/>' for i in range(16))
    b = [f'<circle cx="100" cy="100" r="96" fill="url(#{p}rim)"/>',
         f'<circle cx="100" cy="100" r="80" fill="url(#{p}bg)"/>',
         f'<g fill="#FFF4D2" opacity=".9">{beads}</g>',
         f'<circle cx="100" cy="100" r="70" fill="url(#{p}gl)" class="glow"/>',
         '<g transform="translate(100,100)"><g class="spin">' + rays(0, 0, 12, 40, 76, 6, "#FFF1C4", 0.35) + '</g></g>',
         # key, diagonal
         '<g transform="rotate(-38 100 100)">'
         f'<circle cx="100" cy="58" r="24" fill="url(#{p}key)" stroke="#8A5A1C" stroke-width="3"/>'
         '<circle cx="100" cy="58" r="10" fill="#1E4E5C"/>'
         f'<rect x="93" y="78" width="14" height="78" rx="6" fill="url(#{p}key)" stroke="#8A5A1C" stroke-width="3"/>'
         f'<path d="M107,128 h16 v10 h-8 v8 h-8 Z M107,144 h12 v10 h-12Z" fill="url(#{p}key)" stroke="#8A5A1C" stroke-width="3" stroke-linejoin="round"/>'
         '<path d="M84,90 Q100,84 116,90" stroke="#8A5A1C" stroke-width="3" fill="none"/></g>',
         sparkle_star(140, 62, 9, "#FFFFFF", "tw"),
         sparkle_star(62, 134, 6, "#FFFFFF", "tw2")]
    write("excalibur.svg", svg(200, 200, "".join(b), defs))


if __name__ == "__main__":
    twin(True)
    twin(False)
    switch_card(False)
    switch_card(True)
    key_token()
    print("expansion art written")
