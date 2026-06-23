import base64
from io import BytesIO

import numpy as np
import torch
from facenet_pytorch import MTCNN, InceptionResnetV1
from PIL import Image

from core.exceptions import ValidationError_

mtcnn = MTCNN(
    image_size=320,
    margin=0,
    select_largest=True,
    post_process=True,
    device="cpu",
)

resnet = InceptionResnetV1(pretrained="vggface2").eval().to(mtcnn.device)


def base64_to_bytes(photo_b64: str) -> bytes:
    data = ""
    if "," in photo_b64:
        data = photo_b64.split(",")[1]
    return base64.b64decode(data)


def generate_face_embedding(base64_str: str | None = None, image: Image.Image | None = None) -> bytes:
    if base64_str:
        image_data = base64_to_bytes(base64_str)
        image = Image.open(BytesIO(image_data)).convert("RGB")
    elif image:
        image = image.convert("RGB")
    else:
        raise ValueError("É necessário fornecer base64 ou uma imagem PIL")

    face = mtcnn(image)
    if face is None:
        raise ValidationError_(
            "Nenhum rosto detectado. Tente novamente com melhor iluminação e o rosto visível."
        )

    with torch.no_grad():
        embedding = resnet(face.unsqueeze(0))

    return embedding.cpu().numpy().astype(np.float32).flatten().tobytes()


def treat_photo(base64_photo: str) -> tuple[bytes, Image.Image]:
    image_data = base64_to_bytes(base64_photo)
    if not image_data:
        raise ValidationError_("Capture o rosto do indivíduo, por favor.")
    image = Image.open(BytesIO(image_data))
    return image_data, image
