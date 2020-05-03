import funk_zmq
import funk_midi

pub_socket = None
ctrl_socket = None
midi_socket = None

muted = []

def midi_start_play_file():
    global muted

    muted = []

    msg = {'command' : 'load',
           'what' : 'file',
           'midi_obj' : funk_midi.midi_file
           }
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

    
    msg = {'command' : 'play'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_start_play_record_file():
    global muted

    muted = []

    msg = {'command' : 'load',
           'what' : 'file',
           'midi_obj' : funk_midi.midi_file
           }
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

    
    msg = {'command' : 'record'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)
    

def midi_stop_play():
    global muted

    muted = []
    
    msg = {'command' : 'stop'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)


def midi_mute_unmute():
    global muted
    
    if not muted:
        muted = [9]
        msg = {'command' : 'channel',
               'muted' : muted
               }
    else:
        muted = []
        msg = {'command' : 'channel',
               'muted' : muted
               }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_panic():
    msg = {'command' : 'panic'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_reset():
    msg = {'command' : 'reset'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)
   
def all_quit():
    msg = {'command' : 'quit'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'all', msg)
   
