##    The FUNK Midi Sequencer
##
##    Copyright (C) 2020  Per Sigmond
##
##    This program is free software: you can redistribute it and/or modify
##    it under the terms of the GNU General Public License as published by
##    the Free Software Foundation, either version 3 of the License, or
##    (at your option) any later version.
##
##    This program is distributed in the hope that it will be useful,
##    but WITHOUT ANY WARRANTY; without even the implied warranty of
##    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
##    GNU General Public License for more details.

from websocket_server import WebsocketServer
import binascii
import ast
import json
import mido
import io


class funk_websocket_server():
    server = None
    ctrl_client = None
    time_client = None
    ctrl_object = None

    def __init__(self, ctrl_object, port=9001, host='127.0.0.1'):
        self.server = WebsocketServer(port, host)
        self.server.set_fn_new_client(self.new_client)
        self.server.set_fn_client_left(self.client_left)
        self.server.set_fn_message_received(self.message_received)
        self.ctrl_client = None
        self.time_client = None
        self.ctrl_object = ctrl_object

    def fileno(self):
        return self.server.fileno()

    def _handle_request_noblock(self):
        return self.server._handle_request_noblock()

    # Called for every client connecting (after handshake)
    def new_client(self, client, server):
        if self.ctrl_client == None:
            print("Assigning client %d as ctrl client" % client['id'])
            self.ctrl_client = client
        else:
            print("Assigning client %d as time client" % client['id'])
            self.time_client = client
        
    # Called for every client disconnecting
    def client_left(self, client, server):
        if client['id'] == self.ctrl_client['id']:
            print("Ctlr Client (%d) disconnected" % client['id'])
            self.ctrl_client = None
        else:
            print("Time Client (%d) disconnected" % client['id'])
            self.time_client = None


    # Called when a client sends a message
    def message_received(self, client, server, json_message):
        message = ast.literal_eval(json_message)
        print("Message from ctrl client")
        self.handle_client_ctrl_message(message)

    def handle_client_ctrl_message(self, message):
        topic = message['topic']
        msg = message['msg']
        if msg.has_key('encoding'):
            if msg['encoding'] == 'base64':
                decoded = binascii.a2b_base64(msg['content'])
                if msg['what'] == 'file':
                    midi_file = mido.MidiFile(file=io.BytesIO(decoded))
                    msg['obj'] = midi_file
                else:
                    print('Usupported "what" ' + repr(msg['what']))
                    return
            else:
                print('Usupported encoding ' + repr(msg['encoding']))
                return
        self.ctrl_object.handle_ctrl_message(topic, msg)
    
    def send_ctrl_message(self, topic, ctrl_msg):
        if self.ctrl_client == None:
            print ('websocket ctrl_client not connected, discarding')
            return
        if ctrl_msg['command'] == 'download':
            memoryfile = io.BytesIO()
            midi_obj = ctrl_msg['obj']
            print('download file ' + repr(midi_obj))
            midi_obj.save(file=memoryfile)
            print('memoryfile size ' + repr(len(memoryfile.getvalue())))
            encoded = binascii.b2a_base64(memoryfile.getvalue())
            print('encoded size ' + repr(len(encoded)))
            msg = {'command': 'download',
                   'what': 'file',
                   'name' : ctrl_msg['name'],
                   'encoding' : 'base64',
                   'content': encoded
                   }
            message = {'topic' : 'editor', 'msg' : msg}
        else:
            message = {'topic' : topic, 'msg' : ctrl_msg}

        json_message = json.dumps(message)
        print ('sending ctrl message to websocket ctrl_client')
        self.server.send_message(self.ctrl_client, json_message)
        
    def send_midi_message(self, topic, midi_msg):
        if self.ctrl_client == None:
            print ('websocket ctrl_client not connected, discarding')
            return
        message = {'topic' : topic, 'msg' : midi_msg.dict()}
        json_message = json.dumps(message)
        print('json_message ' + repr(json_message))
        print ('sending midi message to websocket ctrl_client')
        self.server.send_message(self.ctrl_client, json_message)
        
    def send_time_message(self, topic, time_msg):
        if self.time_client == None:
            print ('websocket time_client not connected, discarding')
            return
        message = {'topic' : topic, 'msg' : time_msg}
        json_message = json.dumps(message)
        print ('sending time message to websocket time_client')
        self.server.send_message(self.time_client, json_message)
        
    def send_error_message(self, topic, error_msg):
        if self.ctrl_client == None:
            print ('websocket ctrl_client not connected, discarding')
            return
        message = {'topic' : topic, 'msg' : error_msg}
        json_message = json.dumps(message)
        print ('sending error message to websocket ctrl_client')
        self.server.send_message(self.ctrl_client, json_message)
        
    def send_log_message(self, topic, log_msg):
        if self.ctrl_client == None:
            print ('websocket ctrl_client not connected, discarding')
            return
        message = {'topic' : topic, 'msg' : log_msg}
        json_message = json.dumps(message)
        print ('sending log message to websocket ctrl_client')
        self.server.send_message(self.ctrl_client, json_message)
        
            
