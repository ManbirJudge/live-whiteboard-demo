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

    @staticmethod
    def on_join_room(sid, room_id):
        sio.enter_room(sid, room_id)
        sio.emit('connected_to_room', {'room_id': room_id}, to=sid)

    @staticmethod
    def on_send_msg(sid, data: str):
        data: dict = json.loads(data)

        sio.emit('msg', {
            'text': data['text'],
            'sid': sid
        }, room=data['room_id'], skip_sid=sid)

    @staticmethod
    def on_add_drawn_element(sid, data):
        sio.emit('drawn_element_added', {
            'element': data['element']
        }, room=data['room_id'], skip_sid=sid)

    @staticmethod
    def on_update_drawn_element(sid, data):
        sio.emit('drawn_element_updated', {
            'element': data['element']
        }, room=data['room_id'], skip_sid=sid)

    @staticmethod
    def on_delete_drawn_elements(sid, data):
        sio.emit('drawn_elements_deleted', {
            'element_ids': data['element_ids']
        }, room=data['room_id'], skip_sid=sid)

    @staticmethod
    def on_disconnect(self, sid):
        pass


sio.register_namespace(MainNamespace('/'))

# socket.io WSGI application
application = socketio.WSGIApp(sio)
