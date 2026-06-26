from fastapi import APIRouter, Request

from apps.panel.schemas import ConfigurationResponse, ConfigurationUpdate, DashboardResponse
from apps.panel.service import get_configuration, get_dashboard_data, update_configuration

router = APIRouter(tags=["panel"])


@router.get("/panel", response_model=DashboardResponse)
async def dashboard(
    request: Request,
):
    return await get_dashboard_data(request.state.user.id)


@router.get("/settings", response_model=ConfigurationResponse)
async def get_settings(
    request: Request,
):
    config = await get_configuration(request.state.user.id)
    return ConfigurationResponse.model_validate(config)


@router.put("/settings", response_model=ConfigurationResponse)
async def update_settings(
    request: Request,
    data: ConfigurationUpdate,
):
    config = await update_configuration(request.state.user.id, data.model_dump(exclude_unset=True))
    return ConfigurationResponse.model_validate(config)
