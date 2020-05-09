import zmq

class funk_zmq():
    subpoller = None
    context = None
    sub_sockets = []
    pub_socket = None
    websocket_server = None

    def __init__(self):
        context = zmq.Context()
        subpoller = zmq.Poller()
        
    def connect_subscriber(self, path):
        socket = self.context.socket(zmq.SUB)
        socket.connect (path)
        sub_sockets.append(socket)
        self.subpoller.register(socket, zmq.POLLIN)
        return socket

    def connect_publisher(self, path):
        socket = self.context.socket(zmq.PUB)
        socket.connect(path)
        self.pub_socket = socket
        
    def subscribe(socket, topic):
        socket.setsockopt(zmq.SUBSCRIBE, topic)

    def send_ctrl_msg(topic, ctrl_msg):
        print('Sending ctrl message [' + repr(topic) + '] ' + repr(ctrl_msg))
        self.pub_socket.send_string(topic, flags=zmq.SNDMORE)
        self.pub_socket.send_pyobj(ctrl_msg)

    def send_midi_msg(topic, midi_msg):
        print('Sending midi message [' + repr(topic) + '] ' + repr(ctrl_msg))
        self.pub_socket.send_string(topic, flags=zmq.SNDMORE)
        self.pub_socket.send_pyobj(midi_msg)

    def register_zmq_socket_for_poll(socket):
        self.subpoller.register(socket, zmq.POLLIN)

    def register_websocket_server(server):
        self.websocket_server = server
        self.subpoller.register(server.fileno(), zmq.POLLIN)

    def poll_messages(timeout=None):
        messages = []
        try:
            clientsock = dict(self.subpoller.poll(timeout))

            if clientsock:
                for socket in self.sub_sockets:
                    if socket in clientsock and clientsock[socket] == zmq.POLLIN:
                        topic = socket.recv()
                        msg = socket.recv_pyobj()
                        print('got [' + repr(topic) + ']:  ' + repr(msg))
                        messages.append({'topic' : topic, 'obj' : msg})
                    else:
                        continue
                if self.websocket_server_fileno in clientsock and clientsock[server_fileno] == zmq.POLLIN:
                    self.websocket_server._handle_request_noblock()
        except:
            print('exception')
        return messages
