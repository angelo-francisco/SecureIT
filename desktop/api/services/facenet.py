import base64
from io import BytesIO

import facenet_pytorch as facenet
import numpy as np
import torch
from core.config import settings
from core.exceptions import ValidationError_
from PIL import Image, ImageOps

device = "cuda" if torch.cuda.is_available() else "cpu"


def load_weights(mdl, name):
    state_dict = torch.load(settings.VGGFACE2_PATH, map_location=device)
    mdl.load_state_dict(state_dict)


facenet.models.inception_resnet_v1.load_weights = load_weights  # type: ignore


_mtcnn = None
_resnet = None


def get_mtcnn():
    global _mtcnn, device
    if _mtcnn is None:
        _mtcnn = facenet.MTCNN(
            image_size=320,
            margin=0,
            select_largest=True,
            post_process=True,
            device=device,
        )
    return _mtcnn


def get_resnet():
    global _resnet
    if _resnet is None:
        _resnet = facenet.InceptionResnetV1(pretrained="vggface2").eval().to(device)
    return _resnet


def _get_models():
    return get_mtcnn(), get_resnet()


def base64_to_bytes(photo_b64: str) -> bytes:
    if "," in photo_b64:
        photo_b64 = photo_b64.split(",")[1]
    return base64.b64decode(photo_b64)


def generate_face_embedding(
    base64_str: str | None = None,
    image: Image.Image | None = None,
    detect_face: bool = True,
) -> bytes:
    if base64_str:
        image_data = base64_to_bytes(base64_str)
        image = Image.open(BytesIO(image_data))
        image = ImageOps.exif_transpose(image).convert("RGB")
    elif image:
        image = ImageOps.exif_transpose(image).convert("RGB")
    else:
        raise ValueError("É necessário fornecer base64 ou uma imagem PIL")

    mtcnn, resnet = _get_models()
    if detect_face:
        face = mtcnn(image)
        if face is None:
            raise ValidationError_(
                "Nenhum rosto detectado. Tente novamente com melhor iluminação e o rosto visível."
            )
    else:
        img_size = mtcnn.image_size if hasattr(mtcnn, "image_size") else 160
        face_img = image.resize((img_size, img_size), Image.BILINEAR)
        face = torch.tensor(np.array(face_img), dtype=torch.float32).permute(2, 0, 1)
        face = (face - 127.5) / 128.0
        face = face.to(mtcnn.device)

    with torch.no_grad():
        embedding = resnet(face.unsqueeze(0))

    return embedding.cpu().numpy().astype(np.float32).flatten().tobytes()


def treat_photo(base64_photo: str) -> tuple[bytes, Image.Image]:
    image_data = base64_to_bytes(base64_photo)
    if not image_data:
        raise ValidationError_("Capture o rosto do indivíduo, por favor.")
    image = Image.open(BytesIO(image_data))
    image = ImageOps.exif_transpose(image)

    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    photo_bytes = buffer.getvalue()

    return photo_bytes, image


def detect_faces_in_frame(
    pil_img: Image.Image, confidence_threshold: float = 0.9
) -> list[dict]:
    """Detect faces and generate embeddings for all faces in an image (camera stream use)."""
    mtcnn, _ = _get_models()
    boxes, probs = mtcnn.detect(pil_img)
    if boxes is None:
        return []
    results = []
    for box, prob in zip(boxes, probs):
        if prob < confidence_threshold:
            continue
        x1, y1, x2, y2 = map(int, box)
        face_patch = pil_img.crop((x1, y1, x2, y2))
        try:
            emb = generate_face_embedding(image=face_patch, detect_face=False)
        except Exception:
            continue
        results.append(
            {
                "bbox": [x1, y1, x2, y2],
                "probability": float(prob),
                "embedding": emb,
            }
        )
    return results
