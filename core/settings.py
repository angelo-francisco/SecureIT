from pathlib import Path

# from .utils import get_binary_location

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-"

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    # "channels",
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
    "tailwind_config",
    # "django_google_fonts",
    "lucide",
    "django_extensions",
]

AUTH_USER_MODEL = "users.User"


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.auth.middleware.LoginRequiredMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.users.utils.pin_middleware",
]
if DEBUG:
    INSTALLED_APPS += [
        "debug_toolbar",
    ]
    MIDDLEWARE += [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
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
            "builtins": [
                "lucide.templatetags.lucide",
            ],
        },
    },
]

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

USE_I18N = False

USE_TZ = False

STATIC_URL = "static/"
STATICFILES_DIRS = [
    BASE_DIR.joinpath("web", "static"),
]
STATIC_ROOT = BASE_DIR.joinpath("web", "staticfiles")

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR.joinpath("media")

LOGIN_URL = "users:login"
LOGOUT_REDIRECT_URL = "users:logout"

SESSION_COOKIE_AGE = 365 * 24 * 60 * 60  # One year

TAILWIND_APP_NAME = "tailwind_config"
NPM_BIN_PATH = "/usr/bin/npm" # get_binary_location("npm")

# GOOGLE_FONTS = [
#     "Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900",
#     "Noto Sans:ital,wght@0,100..900;1,100..900",
# ]

INTERNAL_IPS = [
    "127.0.0.1",
]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

YOLO_PATH = BASE_DIR / "yolo_models"

DATA_UPLOAD_MAX_MEMORY_SIZE = 3 * 1024 * 1024

FILE_UPLOAD_MAX_MEMORY_SIZE = 3 * 1024 * 1024
