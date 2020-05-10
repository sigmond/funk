from websocket_server import WebsocketServer
import binascii

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

    # Called for every client connecting (after handshake)
    def new_client(client, server):
        if self.ctrl_client == None:
            print("Assigning client %d as ctrl client" % client['id'])
            self.ctrl_client = client
        else:
            print("Assigning client %d as time client" % client['id'])
            self.time_client = client
        
    # Called for every client disconnecting
    def client_left(client, server):
        if client['id'] == self.ctrl_client['id']:
            print("Ctlr Client (%d) disconnected" % client['id'])
            self.ctrl_client = None
        else:
            print("Time Client (%d) disconnected" % client['id'])
            self.time_client = None


    # Called when a client sends a message
    def message_received(client, server, json_message):
        message = ast.literal_eval(json_message)
        print("Message from ctrl client")
        self.handle_client_ctrl_message(message)

    def handle_client_ctrl_message(message):
        topic = message['topic']
        msg = message['msg']
        if msg['encoding'] == 'base64':
            decoded = binascii.a2b_base64(message['content'])
            if msg['what'] = 'file':
                midi_file = mido.MidiFile(file=io.BytesIO(decoded))
                message['obj'] = midi_file
            else:
                print('Usupported "what" ' + repr(message['what'])
                return
        else:
            print('Usupported encoding ' + repr(message['encoding'])
            return
        self.ctrl_object.handle_ctrl_message(topic, msg)
    
    def send_ctrl_message(self, topic, ctrl_msg):
        if self.ctrl_client == None:
            print ('websocket ctrl_client not connected, discarding')
            return
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
        
            
