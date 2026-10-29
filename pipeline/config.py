"""Настройки канала: темы, доноры, голос, аватар, фирменные цвета."""

# Англоязычные хештеги, где ищем свежие залетевшие рилсы.
HASHTAGS = [
    "aiagents", "aiautomation", "agenticai", "claudecode",
    "n8n", "aiworkflow", "businessautomation", "multiagent",
]

# Каналы, на которые стоит смотреть (англоязычные, тема ИИ-агентов и автоматизации).
DONOR_ACCOUNTS = [
    "sebastianhardy_", "virex.explains", "rollins.io", "elliotxai",
    "j.t.rivard", "itsmodernmillie", "nicolelunan",
]

# Ролик берём в работу, только если в подписи есть хотя бы одно из слов.
TOPIC_KEYWORDS = [
    "agent", "automat", "workflow", "claude", "n8n", "make.com", "zapier",
    "gpt", "llm", "bot", "ai ",
]

# Голос: ElevenLabs v3 через fal — самый живой, «человеческий» вариант.
# Lily — молодой приятный женский голос. Образцы других: assets/voice_samples/.
VOICE = {
    "model": "fal-ai/elevenlabs/tts/eleven-v3",
    "voice": "Lily",
    "stability": 0.5,
}
# Ускорение готовой озвучки без изменения тембра (у ElevenLabs потолок ~1.2).
VOICE_TEMPO = 1.5

AVATAR_IMAGE = "assets/avatar/avatar_2d.png"
# Анимация рисованного аватара по картинке и звуку (рот двигается под речь).
LIPSYNC_MODEL = "veed/fabric-1.0"

# Курс для перевода валюты в рубли (проверяй перед публикацией).
RATES_RUB = {"USD": 82, "EUR": 95}
