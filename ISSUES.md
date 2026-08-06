# ISSUES — desktop/api

Auditoria de compatibilidade Windows/Linux e de comportamento de schemas/models/views.
Os itens marcados como **RESOLVIDO** foram corrigidos; os restantes ficam registados para iterações futuras.

## Críticos (crashes / funcionalidade partida)

- [x] **`apps/cameras/models.py:59`** — `int(self.connection_info.get("id", ""))` lança `ValueError`
  quando uma câmara local não tem `id` no `connection_info`. Como `video_source` é `computed` no
  `PydanticMeta`, derrubava a serialização (`CameraDetail`/`ListCameras` → 500) e os websockets.
- [x] **`apps/people/service.py`** — `np.frombuffer(embedding, ...)` onde `embedding` era uma lista
  (duplicata de `generate_face_embedding` em `apps/people/service.py` retornava `list`, enquanto
  `services/facenet.py` retorna `bytes`). `/search-by-face` lançava `TypeError`. Consolidado em
  `services.facenet`; call sites convertem bytes→lista.
- [x] **`apps/people/service.py:229` (`search_by_embedding` / `search_by_face`)** — sem limiar de
  distância, devolvia sempre o vizinho mais próximo; o reconhecimento "unknown" ficava morto assim
  que existisse um embedding. Adicionado limiar de distância cosseno **0.5**.
- [x] **`services/camera.py:31-50`** — `CAP_DSHOW` forçado no Windows até para ficheiros de vídeo;
  `CAP_V4L2` no Linux sem fallback. Agora o backend forçado é usado só para dispositivos (int) e há
  fallback para o backend default.
- [x] **`core/deps.py:14-34`** — `current_profile_id` era anulado por um `reset()` logo após o
  `set()`, não persistindo durante o request. `websocket/helpers.py authenticate` usava `Profile.get`
  (levantava em vez de devolver `None`).

## Compatibilidade Windows/Linux (médio)

- [ ] **`core/hardware.py:84-96`** — `wmic` foi removido no Windows 11 24H2+; o sinal de CPU
  falha silenciosamente em Windows recentes. O fingerprint continua a funcionar via `MachineGuid`,
  mas o fallback de CPU deve usar PowerShell (`Get-CimInstance Win32_Processor`) ou `ctypes`.
- [ ] **`core/embedded_db.py:142` (`_rotate_pg_log`)** — rotaciona `pgdata/log`, mas no Windows a
  variante de log externo (`ExternalLogPostgresServer`) grava em `<data_root>/pgserver.log`. O caminho
  a rotacionar deve ser o externo também; senão o ficheiro cresce sem limite e a mitigação de
  "sharing violation" é incompleta (os processos são mortos antes, por isso funciona hoje).
- [ ] **`core/bootstrap.py:18`** — `asyncio.run(wait_for_embedded_postgres())` executado no import;
  o `lifespan` volta a chamar `start_embedded_postgres()` (é idempotente, mas a duplicação é
  confusa). `asyncio.run` quebra se o app for criado dentro de um loop ativo (testes/reload).
  Consolidar o arranque da BD apenas no lifespan.

## Schemas / Models (médio/baixo)

- [ ] **`apps/panel/models.py:28`** — `Configuration.__str__` usa `self.user_id`, que não existe
  (o FK é `profile`). `str(config)` lança `AttributeError`. Usar `self.profile_id` ou remover.
- [ ] **`apps/cameras/models.py:45`** — `PydanticMeta.exclude = ["user"]` não corresponde a nenhuma
  relação (o FK é `profile`). Inofensivo, mas engana; remover ou corrigir.
- [ ] **`apps/panel/service.py:20-21`** — hora de monitorização inválida lança `ValueError` cru
  (500). Deve ser `ValidationError_` (422). O schema `ConfigurationUpdate` também devia validar o
  formato `%H:%M:%S`.
- [ ] **`apps/people/schemas.py` / `apps/people/service.py`** — `PersonCreate.banned` é aceite mas
  nunca gravado em `create_person`. `PersonUpdate` exige `photo_base64` (não-opcional), tornando
  impossível atualizar só nome/localização.
- [ ] **`apps/people/service.py:59`** — no caminho `detect_face=False` o rosto é movido para
  `"cpu"` mesmo quando a resnet está em CUDA (mismatch latente). Usar o device da resnet/mtcnn.
- [ ] **Debug logging** — `logger.critical(...)` de debug em `core/database.py:136`
  ("extension created") e `services/camera.py:30,39`. Baixar para `info`.
- [ ] **`apps/people/service.py:229`** — a query `search_by_embedding` interpola o vetor diretamente
  no SQL (seguro hoje porque vem de floats do numpy, mas frágil).

## Segurança (a decidir / fora do âmbito atual)

- [ ] **REST sem auth em vários endpoints** — people (list/create/update/delete/roles/search),
  license (store/verify/current/clear/features) e control (add-profile) não usam
  `Depends(require_profile)` nem verificam o token JWT; apenas confiam nos headers `PID`/`UID` nas
  rotas protegidas. Consistência entre routers.
- [ ] **CORS** — `allow_origins=["*"]` combinado com `allow_credentials=True` em `main.py` é uma
  combinação inválida por norma; restringir à origem do app ou remover credenciais.
