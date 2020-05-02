from Tkinter import *
from tkFileDialog import askopenfilename
import funk_midi

def NewFile():
    print("New File!")
def OpenFile():
    name = askopenfilename()
    funk_midi.open_midi_file(name)
