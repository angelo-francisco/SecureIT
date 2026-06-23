from tortoise import fields, models


class Person(models.Model):
    id = fields.IntField(pk=True)
    first_name = fields.CharField(max_length=30)
    last_name = fields.CharField(max_length=30)
    type = fields.CharField(max_length=1)
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


class Home(models.Model):
    id = fields.IntField(pk=True)
    number = fields.IntField()
    street = fields.CharField(max_length=30)

    class Meta:
        table = "homes"

    def __str__(self) -> str:
        return f"I{self.number}"


class Visitor(models.Model):
    id = fields.IntField(pk=True)
    person = fields.OneToOneField("models.Person", related_name="visitor")
    type = fields.CharField(max_length=3)

    class Meta:
        table = "visitors"

    def __str__(self) -> str:
        return str(self.person)


class Visit(models.Model):
    id = fields.IntField(pk=True)
    visitor = fields.ForeignKeyField("models.Visitor", related_name="visits")
    desc = fields.TextField(null=True)
    visited_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "visits"

    def __str__(self) -> str:
        return f"Visit({self.visitor_id})"


class VisitDestiny(models.Model):
    id = fields.IntField(pk=True)
    visit = fields.ForeignKeyField("models.Visit", related_name="destinies")
    resident = fields.ForeignKeyField("models.Resident", related_name="visit_destinies")

    class Meta:
        table = "visit_destinies"


class Resident(models.Model):
    id = fields.IntField(pk=True)
    bi = fields.CharField(max_length=14, unique=True)
    person = fields.OneToOneField("models.Person", related_name="resident")

    class Meta:
        table = "residents"

    def __str__(self) -> str:
        return str(self.person)


class ResidentHome(models.Model):
    id = fields.IntField(pk=True)
    resident = fields.ForeignKeyField("models.Resident", related_name="resident_homes")
    home = fields.ForeignKeyField("models.Home", related_name="resident_homes")

    class Meta:
        table = "resident_homes"


class Worker(models.Model):
    id = fields.IntField(pk=True)
    bi = fields.CharField(max_length=14, unique=True)
    person = fields.OneToOneField("models.Person", related_name="worker")
    fields = fields.CharField(max_length=30)

    class Meta:
        table = "workers"

    @property
    def list_fields(self) -> list[str]:
        return self.fields.split(",") if self.fields else []

    def __str__(self) -> str:
        return str(self.person)


class WorkerHome(models.Model):
    id = fields.IntField(pk=True)
    worker = fields.ForeignKeyField("models.Worker", related_name="worker_homes")
    home = fields.ForeignKeyField("models.Home", related_name="worker_homes")

    class Meta:
        table = "worker_homes"
