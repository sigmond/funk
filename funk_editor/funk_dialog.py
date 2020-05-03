from Tkinter import *

class get_value_dialog:

    def __init__(self, parent, title, text, value):

        top = self.top = Toplevel(parent)

        top.title(title)
        Label(top, text=text).pack()

        self.e = Entry(top)
        self.e.pack(padx=5)

        b = Button(top, text="OK", command=self.ok)
        b.pack(pady=5)

    def ok(self):

        value.append(self.e.get())

        self.top.destroy()


