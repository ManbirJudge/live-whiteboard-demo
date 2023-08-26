# imports
import json
import os

import socketio
from django.core.wsgi import get_wsgi_application

# ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'live_whiteboard_demo_server.settings')

# django WSGI application
django_app = get_wsgi_application()

# socket io server
sio = socketio.Server(cors_allowed_origins="*")


# events
class MainNamespace(socketio.Namespace):
    def on_connect(self, sid, environ):
        pass

    def on_join_room(self, sid, room_id):
        sio.enter_room(sid, room_id)

    def on_send_msg(self, sid, data: str):
        data: dict = json.loads(data)

        sio.emit('msg', json.dumps({
            'text': data['text'],
            'sid': sid
        }), room=data['room_id'], skip_sid=sid)

    def on_new_drawn_element(self, sid, data):
        print(data)
        sio.emit('add_new_drawn_element', data['element'], room=data['room_id'], skip_sid=sid)

    def on_disconnect(self, sid):
        pass


sio.register_namespace(MainNamespace('/'))

# socket.io WSGI application
application = socketio.WSGIApp(sio)
