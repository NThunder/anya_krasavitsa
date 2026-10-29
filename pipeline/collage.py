"""Аватар в стиле коллажа шаблона: растровые точки (как у мегафона), толще контур,
белая обводка-наклейка с рваным краем и тень. Лицо (кожу) не трогаем —
поверх него рисуются рот и моргание.

Используется при рендере (pipeline.render). Возвращает геометрию лица со сдвигом на поля.
"""
import numpy as np
from PIL import Image, ImageFilter

PAD = 40  # поля под белую обводку


def halftone(h, w, spacing=9, angle=45):
    """Расстояние до центра ближайшей точки растра (в долях шага) для каждой точки картинки."""
    y, x = np.mgrid[0:h, 0:w].astype(float)
    a = np.deg2rad(angle)
    u, v = x * np.cos(a) + y * np.sin(a), -x * np.sin(a) + y * np.cos(a)
    du, dv = (u % spacing) / spacing - 0.5, (v % spacing) / spacing - 0.5
    return np.sqrt(du ** 2 + dv ** 2)


def comic_avatar(src, dst, face, tol=22, soft=28):
    im = np.array(Image.open(src).convert("RGB")).astype(float)
    h, w, _ = im.shape
    bg = im[:12, :12].reshape(-1, 3).mean(0)
    alpha = np.clip((np.sqrt(((im - bg) ** 2).sum(2)) - tol) / soft, 0, 1)

    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    skin = (lum > 150) & (r > g) & (g > b) & (r - b > 40)
    dark = lum < 45  # кофта и контуры
    hair = ~skin & ~dark & (r > b) & (lum < 150)

    d = halftone(h, w)
    # Волосы: тёмные точки, крупнее в тени.
    hair_dot = hair & (d < 0.18 + 0.32 * (1 - lum / 160))
    im[hair_dot] *= 0.72
    # Кофта: светлые сине-серые точки, как печать на ткани.
    knit = dark & (d < 0.3) & (lum > 12)
    im[knit] = im[knit] * 0.25 + np.array([78, 84, 136]) * 0.75
    # Тени на коже (шея, под волосами) — розово-коричневые точки, кроме области рта и глаз.
    yy, xx = np.mgrid[0:h, 0:w]
    m, (e1, e2) = face["mouth"], face["eyes"][:2]
    keep_face = ((abs(xx - (m["left"][0] + m["right"][0]) / 2) < 75) & (yy > m["top"] - 30) & (yy < m["bottom"] + 40)) | \
                ((xx > e1["cx"] - 60) & (xx < e2["cx"] + 60) & (abs(yy - e1["cy"]) < 45))
    shade = skin & (lum < 182) & ~keep_face & (d < 0.28)
    im[shade] *= np.array([0.86, 0.78, 0.76])

    # Контур потолще: где рядом есть почти чёрный пиксель, темним.
    base = Image.fromarray(im.clip(0, 255).astype("uint8"))
    thick = np.array(base.filter(ImageFilter.MinFilter(3))).astype(float)
    tl = 0.299 * thick[..., 0] + 0.587 * thick[..., 1] + 0.114 * thick[..., 2]
    im = np.where((tl < 35)[..., None] & ~skin[..., None], thick, im)

    # Поля под обводку.
    rgba = np.dstack([im.clip(0, 255), alpha * 255]).astype("uint8")
    fig = Image.new("RGBA", (w + 2 * PAD, h + 2 * PAD))
    fig.paste(Image.fromarray(rgba, "RGBA"), (PAD, PAD))

    # Белая наклейка с рваным краем: раздутая маска + шум по краю.
    a = fig.getchannel("A")
    for _ in range(3):
        a = a.filter(ImageFilter.MaxFilter(9))
    noise = Image.fromarray((np.random.default_rng(7).random((fig.height // 18 + 1, fig.width // 18 + 1)) * 255)
                            .astype("uint8")).resize(fig.size, Image.BICUBIC)
    edge = np.array(a.filter(ImageFilter.GaussianBlur(6))).astype(float) - (np.array(noise).astype(float) - 128) * 0.45
    sticker = Image.fromarray(((edge > 128) * 255).astype("uint8"))

    shadow = Image.new("RGBA", fig.size, (12, 14, 40, 0))
    shadow.putalpha(sticker.filter(ImageFilter.GaussianBlur(8)).point(lambda v: int(v * 0.45)))
    out = Image.new("RGBA", fig.size)
    out.alpha_composite(shadow, (6, 10))
    white = Image.new("RGBA", fig.size, (250, 247, 240, 0))
    white.putalpha(sticker)
    out.alpha_composite(white)
    out.alpha_composite(fig)
    out.save(dst)

    # Геометрия лица сдвигается на поля.
    f = {**face, "size": [w + 2 * PAD, h + 2 * PAD]}
    m = face["mouth"]
    f["mouth"] = {"left": [m["left"][0] + PAD, m["left"][1] + PAD], "right": [m["right"][0] + PAD, m["right"][1] + PAD],
                  "top": m["top"] + PAD, "bottom": m["bottom"] + PAD}
    f["eyes"] = [{**e, "cx": e["cx"] + PAD, "cy": e["cy"] + PAD} for e in face["eyes"]]
    return f
