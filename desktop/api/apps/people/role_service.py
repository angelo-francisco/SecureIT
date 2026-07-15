from core.exceptions import NotFound, ValidationError_
from apps.people.models import PersonRole, Role, RoleField


async def list_roles(user_id: int) -> list[Role]:
    return (
        await Role.filter(user_id=user_id).prefetch_related("fields").order_by("name")
    )


async def get_role(role_id: int, user_id: int) -> Role:
    role = await Role.get_or_none(id=role_id, user_id=user_id).prefetch_related(
        "fields"
    )
    if not role:
        raise NotFound("Cargo não encontrado")
    return role


async def create_role(
    user_id: int, name: str, description: str | None = None, fields: list | None = None
) -> Role:
    if not name:
        raise ValidationError_("O nome do cargo é obrigatório")

    role = await Role.create(user_id=user_id, name=name, description=description)

    if fields:
        for i, f in enumerate(fields):
            await RoleField.create(
                role=role,
                label=f["label"],
                field_type=f.get("field_type", "text"),
                required=f.get("required", False),
                options=f.get("options"),
                sort_order=f.get("sort_order", i),
            )

    return await get_role(role.id, user_id)


async def update_role(
    role_id: int, user_id: int, name: str | None = None, description: str | None = None
) -> Role:
    role = await get_role(role_id, user_id)
    if name is not None:
        role.name = name
    if description is not None:
        role.description = description
    await role.save()
    return await get_role(role_id, user_id)


async def delete_role(role_id: int, user_id: int) -> None:
    role = await get_role(role_id, user_id)
    is_any_role_associated = await PersonRole.filter(role_id=role_id).exists()
    if is_any_role_associated:
        raise ValidationError_("Cargo em uso. Remova o cargo das pessoas primeiro.")
    await role.delete()
