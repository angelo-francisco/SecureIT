from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-"

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "daphne",
    "channels",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.users",
    "apps.panel",
    "apps.cameras",
    "apps.people",
    "apps.notifications",
    "tailwind",
<<<<<<< HEAD
    "tailwind_config",
    "django_browser_reload",
=======
    "django_browser_reload",
    "theme"
>>>>>>> 4dae35bfd4c307c3faca3ab5286d811665591929
]

AUTH_USER_MODEL = "users.User"


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.auth.middleware.LoginRequiredMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.users.utils.pin_middleware",
<<<<<<< HEAD
    "django_browser_reload.middleware.BrowserReloadMiddleware"
=======
    "django_browser_reload.middleware.BrowserReloadMiddleware",
>>>>>>> 4dae35bfd4c307c3faca3ab5286d811665591929
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "web" / "pages"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
          ],
        },
    },
]
# Alterados de wsgi para asgi
# Assim servimos websockets

ASGI_APPLICATION = "core.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "pt-PT"

TIME_ZONE = "Africa/Luanda"

USE_I18N = True

USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [
    BASE_DIR.joinpath("web", "static"),
]
STATIC_ROOT = BASE_DIR.joinpath("web", "staticfiles")

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR.joinpath("media")

# configurações de login/logout (adicionadas)
LOGIN_URL = "users:login"
LOGOUT_REDIRECT_URL = "users:logout"

# Extendendo o tempo do cookie para evitar logout automático
SESSION_COOKIE_AGE = 365 * 24 * 60 * 60  # 1 ano

# Django-Tailwind Config.
TAILWIND_APP_NAME = "tailwind_config"
NPM_BIN_PATH = "/usr/bin/npm"
