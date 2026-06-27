from core.exceptions import NotFound, ValidationError_
from apps.people.models import Role, RoleField


async def list_roles(user_id: int) -> list[Role]:
    return await Role.filter(user_id=user_id).prefetch_related("fields").order_by("name")


async def get_role(role_id: int, user_id: int) -> Role:
    role = await Role.get_or_none(id=role_id, user_id=user_id).prefetch_related("fields")
    if not role:
        raise NotFound("Cargo não encontrado")
    return role


async def create_role(user_id: int, name: str, description: str | None = None, fields: list | None = None) -> Role:
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


async def update_role(role_id: int, user_id: int, name: str | None = None, description: str | None = None) -> Role:
    role = await get_role(role_id, user_id)
    if name is not None:
        role.name = name
    if description is not None:
        role.description = description
    await role.save()
    return await get_role(role_id, user_id)


async def delete_role(role_id: int, user_id: int) -> None:
    role = await get_role(role_id, user_id)
    await role.delete()


async def create_role_field(role_id: int, user_id: int, data: dict) -> RoleField:
    role = await get_role(role_id, user_id)
    field = await RoleField.create(
        role=role,
        label=data["label"],
        field_type=data.get("field_type", "text"),
        required=data.get("required", False),
        options=data.get("options"),
        sort_order=data.get("sort_order", 0),
    )
    return field


async def update_role_field(field_id: int, user_id: int, data: dict) -> RoleField:
    field = await RoleField.get_or_none(id=field_id).prefetch_related("role")
    if not field or field.role.user_id != user_id:
        raise NotFound("Campo não encontrado")

    if "label" in data:
        field.label = data["label"]
    if "field_type" in data:
        if data["field_type"] not in {"text", "number", "select", "boolean", "date"}:
            raise ValidationError_("Tipo de campo inválido")
        field.field_type = data["field_type"]
    if "required" in data:
        field.required = data["required"]
    if "options" in data:
        field.options = data["options"]
    if "sort_order" in data:
        field.sort_order = data["sort_order"]

    await field.save()
    return field


async def delete_role_field(field_id: int, user_id: int) -> None:
    field = await RoleField.get_or_none(id=field_id).prefetch_related("role")
    if not field or field.role.user_id != user_id:
        raise NotFound("Campo não encontrado")
    await field.delete()
