import zmq
import funk_websocket

class funk_com():
    subpoller = None
    context = None
    sub_socket = None
    pub_socket = None
    websocket_server = None
    ws_fileno = None

    def __init__(self, ctrl_object, zmq_path_in, zmq_path_out, websocket_port=9001, websocket_host='127.0.0.1'):
        self.context = zmq.Context()
        self.subpoller = zmq.Poller()
        self.sub_socket = self.connect_subscriber(zmq_path_in)
        self.subpoller.register(self.sub_socket, zmq.POLLIN)
        self.websocket_server = funk_websocket.funk_websocket_server(ctrl_object, websocket_port, websocket_host)
        self.ws_fileno = self.websocket_server.fileno()
        self.subpoller.register(self.ws_fileno, zmq.POLLIN)
        self.pub_socket = self.connect_publisher(zmq_path_out)
        
    def connect_subscriber(self, path):
        socket = self.context.socket(zmq.SUB)
        socket.connect (path)
        self.subpoller.register(socket, zmq.POLLIN)
        return socket

    def connect_publisher(self, path):
        socket = self.context.socket(zmq.PUB)
        socket.connect(path)
        return socket
        
    def subscribe(self, topic):
        self.sub_socket.setsockopt(zmq.SUBSCRIBE, topic)

    def send_bus_msg(self, topic, bus_msg):
        print('Sending bus message [' + repr(topic) + ']')
        self.pub_socket.send_string(topic, flags=zmq.SNDMORE)
        self.pub_socket.send_pyobj(bus_msg)

    def send_client_ctrl_msg(self, topic, client_ctrl_msg):
        print ('sending ctrl msg to client')
        self.websocket_server.send_ctrl_message(topic, client_ctrl_msg)

    def send_client_midi_msg(self, topic, client_midi_msg):
        print ('sending midi msg to client')
        self.websocket_server.send_midi_message(topic, client_midi_msg)

    def send_client_time_msg(self, topic, client_time_msg):
        print ('sending time msg to client')
        self.websocket_server.send_time_message(topic, client_time_msg)

    def send_client_error_msg(self, topic, client_error_msg):
        print ('sending error msg to client')
        self.websocket_server.send_error_message(topic, client_error_msg)

    def send_client_log_msg(self, topic, client_log_msg):
        print ('sending log msg to client')
        self.websocket_server.send_log_message(topic, client_log_msg)

    def poll_messages(self, timeout=None):
        messages = []
        try:
            clientsock = dict(self.subpoller.poll(timeout))

            if clientsock:
                if self.sub_socket in clientsock and clientsock[self.sub_socket] == zmq.POLLIN:
                    topic = self.sub_socket.recv()
                    msg = self.sub_socket.recv_pyobj()
                    print('got [' + repr(topic) + ']')
                    messages.append({'topic' : topic, 'msg' : msg})
                elif self.ws_fileno in clientsock and clientsock[self.ws_fileno] == zmq.POLLIN:
                    self.websocket_server._handle_request_noblock()
                else:
                    pass
        except:
            print('poll_messages: exception')
            exit(0)
        return messages
