import zmq

subpoller = zmq.Poller()

    
def connect_subscriber(path):
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect (path)
    return socket

def connect_publisher(path):
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.connect (path)
    return socket

def subscribe(socket, topic):
    socket.setsockopt(zmq.SUBSCRIBE, topic)

def send_ctrl_msg(socket, topic, ctrl_msg):
    print('Sending ctrl message [' + repr(topic) + '] ' + repr(ctrl_msg))
    socket.send_string(topic, flags=zmq.SNDMORE)
    socket.send_pyobj(ctrl_msg)

def register_poller(sockets):
    for socket in sockets:
        subpoller.register(socket, zmq.POLLIN)

def poll_message(socket):
    try:
        clientsock = dict(subpoller.poll(0.001))
        
        if clientsock:
            if socket in clientsock and clientsock[socket] == zmq.POLLIN:
                topic = socket.recv()
                msg = socket.recv_pyobj()
                print('got [' + repr(topic) + ']:  ' + repr(msg))
                return {'topic' : topic, 'obj' : msg}
            else:
                return None
        else:
            return None
    except:
        print('exception')
        return None
