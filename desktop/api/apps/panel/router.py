import logging

from fastapi import APIRouter, Depends

from apps.panel.schemas import (
    ConfigurationResponse,
    ConfigurationUpdate,
    DashboardResponse,
)
from apps.panel.service import (
    get_or_create_configuration,
    get_dashboard_data,
    update_configuration,
)
from core.deps import require_profile, Profile

logger = logging.getLogger(__name__)
router = APIRouter(tags=["panel"])


@router.get("/panel", response_model=DashboardResponse)
async def dashboard(
    profile: Profile = Depends(require_profile),
):
    return await get_dashboard_data(profile.profile_id)


@router.get("/settings", response_model=ConfigurationResponse)
async def get_settings(
    profile: Profile = Depends(require_profile),
):
    config = await get_or_create_configuration(profile.profile_id)
    return ConfigurationResponse.model_validate(config)


@router.put("/settings", response_model=ConfigurationResponse)
async def update_settings(
    data: ConfigurationUpdate,
    profile: Profile = Depends(require_profile),
):
    config = await update_configuration(
        profile.profile_id, data.model_dump(exclude_unset=True)
    )
    return ConfigurationResponse.model_validate(config)
