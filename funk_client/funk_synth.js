/*
    The FUNK Midi Sequencer

    Copyright (C) 2020  Per Sigmond, per@sigmond.no

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
*/

class funk_synth
{
    constructor(type, synth)
    {
        this._type = type;
        this._controllers = synth.controllers;
        this._drumnames = synth.drumnames;
        this._drumsets = synth.drumsets;
        this._voices = synth.voices;

//         output('voice 3: ' + this._voices[3]);
//         output('drumname 30: ' + this._drumnames[30]);        
    }

    get type()
    {
        return this._type;
    }

    drumname(note)
    {
        return this._drumnames[note];
    }

    voice(index)
    {
        return this._voices[index];
    }

    drumset(index)
    {
        return this._drumsets[index];
    }

    controller(index)
    {
        return this._controllers[index];
    }

    get num_voices()
    {
        return object.keys(this._voices).length;
    }

    get num_drumsets()
    {
        return object.keys(this._drumsets).length;
    }

    get num_drumnames()
    {
        return object.keys(this._drumnames).length;
    }

    get num_controllers()
    {
        return object.keys(this._controllers).length;
    }

}


