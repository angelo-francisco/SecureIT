from tortoise import fields, models
from tortoise_vector.field import VectorField


class Role(models.Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=60)
    description = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "roles"

    def __str__(self) -> str:
        return self.name


class RoleField(models.Model):
    id = fields.IntField(pk=True)
    role = fields.ForeignKeyField("models.Role", related_name="fields")
    label = fields.CharField(max_length=60)
    field_type = fields.CharField(max_length=20)
    required = fields.BooleanField(default=False)
    options = fields.JSONField(null=True)
    sort_order = fields.IntField(default=0)

    class Meta:
        table = "role_fields"

    def __str__(self) -> str:
        return f"{self.role.name}: {self.label}"


class Person(models.Model):
    id = fields.IntField(pk=True)
    first_name = fields.CharField(max_length=30)
    last_name = fields.CharField(max_length=30)
    photo = fields.CharField(max_length=255, null=True)
    added_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    banned = fields.BooleanField(default=False)

    class Meta:
        table = "people"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __str__(self) -> str:
        return self.full_name


class PersonEmbedding(models.Model):
    id = fields.IntField(pk=True)
    person = fields.ForeignKeyField("models.Person", related_name="embeddings")
    embedding = VectorField(vector_size=512)

    class Meta:
        table = "person_embeddings"

    def __str__(self) -> str:
        return f"Embedding({self.person.id})"


class PersonRole(models.Model):
    id = fields.IntField(pk=True)
    person = fields.ForeignKeyField("models.Person", related_name="person_roles")
    role = fields.ForeignKeyField("models.Role", related_name="person_roles")
    field_values = fields.JSONField(null=True)

    class Meta:
        table = "person_roles"

    def __str__(self) -> str:
        return f"{self.person.full_name} - {self.role.name}"
