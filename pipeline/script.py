"""Шаг 3. Черновик сценария на русском по ролику-донору (LLM через fal).

    python -m pipeline.script agent-team

Берёт reels/<slug>/source/meta.json (расшифровка донора) и пишет reels/<slug>/script.json.
Черновик обязательно вычитать: проверить факты, цифры и подобрать демо (pipeline/demos/).
"""
import json
import sys

from .common import REELS, llm_json
from .config import RATES_RUB

VISUALS = """Типы визуала (поле visual.type) — каждый уже нарисован в video/src/scenes.tsx:
- avatar — говорит аватар (ТОЛЬКО для 1–2 реплик хука)
- swarm {count, label, sub} — большое число и сетка точек (много ботов, людей, задач)
- roles {title, highlight: [индексы]} — 6 карточек ролей агентов, подсветка нужных
- question {text} — крупный вопрос
- flow {message, question} — записки идут главному агенту, он пишет владельцу «да/нет»
- night {time, label} — работа круглосуточно
- chapter {kicker, title, icon} — переход к новой части
- demo_run {phase: running|done, highlight} — живой запуск команды агентов (данные из demo.json)
- phone — сообщение главного агента на телефоне (из demo.json)
- statement {left, right} — сравнение «было/стало»
- cta {title, sub} — призыв сохранить/подписаться"""

SYSTEM = f"""Ты сценарист рилсов про ИИ-агентов и автоматизацию бизнеса для русскоязычной аудитории.
Правила:
- Полноценный цельный обзор темы, 5 частей: hook (вступление-хук, 2 реплики, говорит аватар),
  setup (завязка), climax (кульминация), resolution (развязка: показываем пример/демо), conclusion (заключение + призыв).
- Понятно любому человеку: никаких терминов и англицизмов; если без слова не обойтись — объясни его простыми словами.
- Короткие разговорные фразы, по 6–15 слов. Всего 13–16 реплик, 140–170 слов (≈60 секунд).
- Числа пиши словами (так их правильно прочитает озвучка).
- Любые деньги переводи в рубли (курс: 1$ = {RATES_RUB['USD']} ₽, 1€ = {RATES_RUB['EUR']} ₽), округляй.
- Не используй глаголы прошедшего времени от первого лица («я сделал/сделала»).
- Каждая реплика связана со своей картинкой.
{VISUALS}
Верни только JSON."""


def main(slug):
    reel = REELS / slug
    meta = json.loads((reel / "source" / "meta.json").read_text(encoding="utf-8"))
    prompt = f"""Ролик-донор (@{meta['ownerUsername']}, {meta.get('videoPlayCount')} просмотров).
Подпись: {meta.get('caption')}
Расшифровка: {meta.get('transcript')}

Перескажи идею для русскоязычной аудитории и адаптируй под бизнес. Формат ответа:
{{"slug": "{slug}", "title": "...", "source": "{meta['url']}",
  "caption": "подпись к посту с 5–7 хештегами на русском",
  "lines": [{{"id": "hook1", "act": "hook", "text": "...", "visual": {{"type": "avatar"}}}}, ...]}}"""
    script = llm_json(prompt, system=SYSTEM)
    out = reel / "script.json"
    out.write_text(json.dumps(script, ensure_ascii=False, indent=1), encoding="utf-8")
    for l in script["lines"]:
        print(f"[{l['act']:<10}] {l['text']}  ({l['visual']['type']})")
    print(f"\nЧерновик: {out} — вычитай перед озвучкой.")


if __name__ == "__main__":
    main(sys.argv[1])
