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

        this.get_voices_dict();
        this.get_drumsets_dict();

//         output('voice 3: ' + this._voices[3]);
//         output('drumname 30: ' + this._drumnames[30]);        
    }

    get type()
    {
        return this._type;
    }

    get voices()
    {
        return this._voices;
    }

    get drumsets()
    {
        return this._drumsets;
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
        return this._voices.length;
    }

    get num_drumsets()
    {
        return this._drumsets.length;
    }

    get num_drumnames()
    {
        return object.keys(this._drumnames).length;
    }

    get num_controllers()
    {
        return object.keys(this._controllers).length;
    }

    patch_index(patch)
    {
        if ((patch.bank >= 0) && (patch.program >= 0))
        {
            return (patch.bank * 256) + patch.program;
        }

        return -1;
    }

    get_voices_dict()
    {
        this._voices_dict = {};
        
        for (const voice of this._voices)
        {
            this._voices_dict[voice.index] = voice.name;
        }
    }

    get_drumsets_dict()
    {
        this._drumsets_dict = {};
        
        for (const drumset of this._drumsets)
        {
            this._drumsets_dict[drumset.index] = drumset.name;
        }
    }

    patchname(patch)
    {
        if (this.patch_index(patch) >= 0)
        {
            return this._voices_dict[(patch.bank * 256) + patch.program];
        }

        return "";
    }

    drumsetname(patch)
    {
        if (this.patch_index(patch) >= 0)
        {
            return this._drumsets_dict[(patch.bank * 256) + patch.program];
        }
        
        return "";
    }
}


