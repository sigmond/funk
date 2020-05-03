from Tkinter import *
from funk_root import root
import funk_ctrl


def task():
    funk_ctrl.get_messages()
    root.after(100, task)  # reschedule event in 0.5 seconds
    
