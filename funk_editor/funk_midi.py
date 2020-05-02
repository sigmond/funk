import mido
from mido import MidiFile, Message, tempo2bpm, MidiTrack, second2tick
import funk_ctrl

midi_file = None

def open_midi_file(path):
    global midi_file
    
    midi_file = MidiFile(path)

