from apps.cameras.models import Camera
from apps.notifications.service import get_unread_count
from apps.panel.models import Configuration


async def get_or_create_configuration(profile_id: str) -> Configuration:
    config = await Configuration.get_or_none(profile_id=profile_id)
    if not config:
        config = await Configuration.create(profile_id=profile_id)
    return config


async def update_configuration(profile_id: str, data: dict) -> Configuration:
    config = await get_or_create_configuration(profile_id)

    for key, value in data.items():
        if value is not None:
            if key in ("monitoring_start_time", "monitoring_end_time"):
                if not Configuration.is_valid_time(value):
                    raise ValueError(f"Horário inválido: {value}")
                setattr(config, key, value)
            else:
                setattr(config, key, value)

    await config.save()
    return config


async def get_dashboard_data(profile_id: str) -> dict:
    cameras = await Camera.filter(profile_id=profile_id)
    notif_count = await get_unread_count(profile_id)

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
