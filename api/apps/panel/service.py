from apps.cameras.models import Camera
from apps.notifications.service import get_unread_count
from apps.panel.models import Configuration


async def get_or_create_configuration(user_id: int) -> Configuration:
    config = await Configuration.get_or_none(user_id=user_id)
    if not config:
        config = await Configuration.create(user_id=user_id)
    return config


async def update_configuration(user_id: int, data: dict) -> Configuration:
    config = await get_or_create_configuration(user_id)

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


async def get_dashboard_data(user_id: int) -> dict:
    cameras = await Camera.filter(user_id=user_id)
    notif_count = await get_unread_count(user_id)

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
