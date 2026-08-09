from apps.cameras.models import Camera
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from apps.audit.service import log_action

DEFAULT_START_TIME = "18:00"
DEFAULT_END_TIME = "07:00"


async def get_or_create_configuration(profile_id: str) -> Configuration:
    config = await Configuration.get_or_none(profile_id=profile_id)
    if not config:
        config = await Configuration.create(
            profile_id=profile_id,
            monitoring_start_time=DEFAULT_START_TIME,
            monitoring_end_time=DEFAULT_END_TIME,
        )
    else:
        changed = False
        if not config.monitoring_start_time:
            config.monitoring_start_time = DEFAULT_START_TIME
            changed = True
        if not config.monitoring_end_time:
            config.monitoring_end_time = DEFAULT_END_TIME
            changed = True
        if changed:
            await config.save()
    return config


async def update_configuration(profile_id: str, data: dict) -> Configuration:
    config = await get_or_create_configuration(profile_id)

    for key, value in data.items():
        if value is None:
            continue
        if key in ("monitoring_start_time", "monitoring_end_time"):
            normalized = Configuration.normalize_time(value)
            if normalized is None:
                raise ValueError(f"Horário inválido: {value}")
            setattr(config, key, normalized)
        else:
            setattr(config, key, value)

    await config.save()
    await log_action("update", "configuration", config.id)
    return config


async def get_dashboard_data(profile_id: str) -> dict:
    cameras = await Camera.filter(profile_id=profile_id)
    notif_count = await Notification.filter(
        profile_id=profile_id, deleted=False
    ).count()

    return {
        "cameras": [
            {
                "id": c.id,
                "name": c.get_name,
                "location": c.location,
                "status": c.status,
                "connection_type": c.connection_type,
            }
            for c in cameras
        ],
        "notifications_count": notif_count,
    }
