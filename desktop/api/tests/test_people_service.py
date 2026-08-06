import numpy as np
import pytest

from apps.people.models import Person, PersonEmbedding
from apps.people.service import embedding_to_list, search_by_embedding


def test_embedding_to_list_decodes_bytes():
    raw = np.zeros(512, dtype=np.float32)
    raw[0] = 1.0
    out = embedding_to_list(raw.tobytes())
    assert isinstance(out, list)
    assert len(out) == 512
    assert abs(out[0] - 1.0) < 1e-6


@pytest.mark.usefixtures("setup_db")
async def test_search_by_embedding_matches_close_vectors():
    vec = [0.1] * 512
    person = await Person.create(first_name="Close", last_name="Match")
    await PersonEmbedding.create(person=person, embedding=vec)
    try:
        found = await search_by_embedding(vec)
        assert found is not None
        assert found.id == person.id
    finally:
        await Person.filter(id=person.id).delete()


@pytest.mark.usefixtures("setup_db")
async def test_search_by_embedding_rejects_far_vectors():
    vec = [0.1] * 512
    person = await Person.create(first_name="Far", last_name="Match")
    await PersonEmbedding.create(person=person, embedding=vec)
    try:
        found = await search_by_embedding([-0.1] * 512)
        assert found is None
    finally:
        await Person.filter(id=person.id).delete()
