from channels.generic.websocket import AsyncWebsocketConsumer


class PainelConsumer(AsyncWebsocketConsumer): 
    async def connect(self): ...
    
