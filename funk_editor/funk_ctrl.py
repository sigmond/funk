import funk_root
import funk_zmq
import funk_midi
import funk_dialog

pub_socket = None
ctrl_socket = None
midi_socket = None

muted_channels = []
muted_tracks = []


def midi_start_play_file():
    global muted_channels
    global muted_tracks

    muted_channels = []
    muted_tracks = []

    msg = {'command' : 'load',
           'what' : 'file',
           'midi_obj' : funk_midi.midi_file
           }
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

    
    msg = {'command' : 'play'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_start_play_record_file():
    global muted_channels
    global muted_tracks

    muted_channels = []
    muted_tracks = []

    msg = {'command' : 'load',
           'what' : 'file',
           'midi_obj' : funk_midi.midi_file
           }
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

    
    msg = {'command' : 'record'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)
    

def midi_stop_play():
    global muted_channels
    global muted_tracks

    muted_channels = []
    muted_tracks = []
    
    msg = {'command' : 'stop'
           }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)


def midi_mute_unmute_channel():
    global muted_channels

##    d = funk_dialog.get_value_dialog(funk_root.root, "Mute", "Mute channel", muted_channels)
##    funk_root.root.wait_window(d.top)
    
    if not muted_channels:
        muted_channels = [9]
        msg = {'command' : 'channel',
               'muted' : muted_channels
               }
    else:
        muted_channels = []
        msg = {'command' : 'channel',
               'muted' : muted_channels
               }
    
    funk_zmq.send_ctrl_msg(pub_socket, 'controller', msg)

def midi_mute_unmute_track():
    global muted_tracks
    
    if not muted_tracks:
        muted_tracks = [2]
        msg = {'command' : 'track',
               'muted' : muted_tracks
               }
    else:
        muted_tracks = []
        msg = {'command' : 'track',
               'muted' : muted_tracks
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

   
def get_messages():
##    print('get_messages')
##    print('polling midi')
    while True:
        midi_msg = funk_zmq.poll_message(midi_socket)
        if midi_msg:
            handle_midi_message(midi_msg)
        else:
            break
##    print('polling ctrl')
    while True:
        ctrl_msg = funk_zmq.poll_message(ctrl_socket)
        if ctrl_msg:
            handle_ctrl_message(ctrl_msg)
        else:
            break


def handle_midi_message(msg):
    print('got midi ' + repr(msg))
    if msg['topic'] == 'time':
        funk_root.player_time = msg['obj']
    if msg['topic'] == 'recorded':
        funk_root.recorded = msg['obj']

def handle_ctrl_message(msg):
    print('got ctrl ' + repr(msg))
