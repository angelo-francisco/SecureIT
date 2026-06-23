from fastapi import APIRouter, Depends

from apps.auth.models import User
from apps.panel.schemas import ConfigurationResponse, ConfigurationUpdate, DashboardResponse
from apps.panel.service import get_configuration, get_dashboard_data, update_configuration
from core.deps import get_current_user, verify_pin

router = APIRouter(tags=["panel"])


@router.get("/panel", response_model=DashboardResponse)
async def dashboard(
    current_user: User = Depends(get_current_user),
):
    return await get_dashboard_data(current_user.id)


@router.get("/settings", response_model=ConfigurationResponse)
async def get_settings(
    current_user: User = Depends(verify_pin),
):
    config = await get_configuration(current_user.id)
    return ConfigurationResponse.model_validate(config)


@router.put("/settings", response_model=ConfigurationResponse)
async def update_settings(
    data: ConfigurationUpdate,
    current_user: User = Depends(verify_pin),
):
    config = await update_configuration(current_user.id, data.model_dump(exclude_unset=True))
    return ConfigurationResponse.model_validate(config)
