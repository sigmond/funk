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

var ws_ctrl;
var ws_midi;

const key_ctrl = 17;
const key_shift = 16;
const key_home = 36;
const key_end = 35;
const key_space = 32;
const key_p = 80;
const key_x = 88;
const key_c = 67;
const key_v = 86;
const key_m = 77;
const key_z = 90;
const key_y = 89;
const key_plus = 187;
const key_minus = 189;
const key_up = 38;
const key_down = 40;
const key_right = 39;
const key_left = 37;


var global_file_name = 'noname.mid';

var global_disable_keydownhandler = false;

var global_ctrl_down = false;
var global_shift_down = false;
var global_song_channel_playing = -1;
var global_song_notes_playing = [];

function keydownhandler(event)
{
    if (global_disable_keydownhandler)
    {
        return true;
    }
    
    output("keycode down: " + event.keyCode);
    if (event.keyCode == key_ctrl)
    {
        event.preventDefault();
        global_ctrl_down = true;
    }
    else if (event.keyCode == key_shift)
    {
        event.preventDefault();
        global_shift_down = true;
    }
    else if (event.keyCode == key_home)
    {
        event.preventDefault();
        if (global_shift_down)
        {
            trackwin_object.tracks_handle_key_down(event.keyCode);
            pianowin_object.tracks_handle_key_down(event.keyCode);
        }
        else
        {
            trackwin_object.go_to_start();
        }
    }
    else if (event.keyCode == key_end)
    {
        event.preventDefault();
        if (global_shift_down)
        {
            trackwin_object.tracks_handle_key_down(event.keyCode);
            pianowin_object.tracks_handle_key_down(event.keyCode);
        }
        else
        {
            trackwin_object.go_to_end();
        }
    }
    else if (event.keyCode == key_space)
    {
        event.preventDefault();
        trackwin_object.play_at_playhead();
    }
    else if (
             (event.keyCode == key_p) || // position playhead
             (event.keyCode == key_x) || // ctrl-x = cut leave space, ctrl-shift-x = cut remove space
             (event.keyCode == key_c) || // ctrl-c = copy
             (event.keyCode == key_v) || // ctrl-v = paste overwrite, ctrl-shift-v = paste insert
             (event.keyCode == key_m) || // ctrl-m = paste merge
             (event.keyCode == key_z) || // ctrl-z = undo
             (event.keyCode == key_y) || // ctrl-y = redo
             (event.keyCode == key_plus) || // ctrl-plus = zoom in
             (event.keyCode == key_minus) || // ctrl-minus = zoom out
             (event.keyCode == key_up) || // ctrl-up = next track up (pianowin), shift-up = expand selection
             (event.keyCode == key_down) || // ctrl-down = next track down (pianowin), shift-down = expand selection
             (event.keyCode == key_left) || // shift-left = expand selection
             (event.keyCode == key_right) // shift-right = expand selection
            )
    {
        event.preventDefault();
        trackwin_object.tracks_handle_key_down(event.keyCode);
        pianowin_object.tracks_handle_key_down(event.keyCode);
    }

    return false;
}

function keyuphandler(event)
{
//     output("keycode up: " + event.keyCode);
    if (event.keyCode == 17)
    {
        global_ctrl_down = false;
    }
    else if (event.keyCode == 16)
    {
        global_shift_down = false;
    }
}
    
document.addEventListener("keydown", keydownhandler);
document.addEventListener("keyup", keyuphandler);

var global_edit_elements = [];
var global_edit_track_index = -1;
var global_edit_track_patches = [];
    

function edit_tempo(bpm)
{
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    
    global_disable_keydownhandler = true;
    var label = document.createTextNode("Tempo (beats per minute):");
    var input = document.createElement("input");
    input.setAttribute('type', 'text');
    input.id = 'beats_per_minute';
    input.size = 10;
    input.setAttribute("value", bpm);
    var save = document.createElement("button");
    save.innerText = "Save";
    save.onclick = save_tempo_edit;
    var cancel = document.createElement("button");
    cancel.innerText = "Cancel";
    cancel.onclick = cancel_edit;

    global_edit_elements.push(label);
    global_edit_elements.push(input);
    global_edit_elements.push(save);
    global_edit_elements.push(cancel);

    var menu = document.getElementById("topmenu");
    menu.appendChild(label);
    menu.appendChild(input);
    menu.appendChild(save);
    menu.appendChild(cancel);
}

function save_tempo_edit()
{
    var beats_per_minute = parseInt(document.getElementById('beats_per_minute').value);
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
    save_tempo(0, beats_per_minute);
}


function save_tempo(tick, bpm)
{ 
    var cmd;
    var msg;
    var json_message;
    
    cmd = { "command" : "set_tempo", "tick" : tick, "bpm" : bpm };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}



function edit_track_info(track_index, name, channel, patch_index, new_track)
{
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    
    global_disable_keydownhandler = true;
    global_edit_track_index = track_index;
    var label = document.createTextNode("Track name:");
    var input = document.createElement("input");
    input.setAttribute('type', 'text');
    input.id = 'new_track_name';
    input.size = 10;
    input.setAttribute("value",name);

    var channel_selector = document.createElement("SELECT");
    var channels = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
    var selected_channel_index = 0;
    var index;
    for (index in channels)
    {
        var option = document.createElement("option");
        option.text = channels[index].toString();
        channel_selector.add(option);
        if (index == channel)
        {
            selected_channel_index = index;
        }
    }
    channel_selector.selectedIndex = selected_channel_index;
    channel_selector.id = 'edit_track_channel_select';
    channel_selector.onchange = channel_selector_onchange;

    var patch_selector = document.createElement("SELECT");
    if (channel != 9)
    {
        global_edit_track_patches = synth_object.voices;
    }
    else
    {
        global_edit_track_patches = synth_object.drumsets;
    }
    var selected_patch_index = 0;

    var option = document.createElement("option");
    option.text = 'Select patch';
    patch_selector.add(option);
    for (var i = 0; i < global_edit_track_patches.length; i++)
    {
        var option = document.createElement("option");
        var patch = global_edit_track_patches[i];
        option.text = patch.name;
        patch_selector.add(option);
        if (patch.index == patch_index)
        {
            selected_patch_index = i + 1;
        }
    }
    patch_selector.selectedIndex = selected_patch_index;
    patch_selector.id = 'edit_track_patch_select';
    patch_selector.onchange = patch_selector_onchange;

    var save = document.createElement("button");
    save.innerText = "Save";
    if (!new_track)
    {
        save.onclick = save_track_info;
    }
    else
    {
        save.onclick = save_new_track_info;
    }
    var cancel = document.createElement("button");
    cancel.innerText = "Cancel";
    cancel.onclick = cancel_edit;
    var remove = document.createElement("button");
    remove.innerText = "Remove";
    remove.onclick = remove_track_info;
    global_edit_elements.push(label);
    global_edit_elements.push(input);
    global_edit_elements.push(channel_selector);
    global_edit_elements.push(patch_selector);
    global_edit_elements.push(save);
    global_edit_elements.push(cancel);
    global_edit_elements.push(remove);
    var menu = document.getElementById("topmenu");
    menu.appendChild(label);
    menu.appendChild(input);
    menu.appendChild(channel_selector);
    menu.appendChild(patch_selector);
    menu.appendChild(save);
    menu.appendChild(cancel);
    menu.appendChild(remove);
}



function channel_selector_onchange()
{
    var channel = parseInt(document.getElementById('edit_track_channel_select').value) - 1;
    var patch_selector = document.getElementById('edit_track_patch_select');

    for(var i = patch_selector.options.length - 1; i >= 0; i--)
    {
        patch_selector.remove(i);
    }

    if (channel != 9)
    {
        global_edit_track_patches = synth_object.voices;
    }
    else
    {
        global_edit_track_patches = synth_object.drumsets;
    }

    var option = document.createElement("option");
    option.text = 'Select patch';
    patch_selector.add(option);
    for (var i = 0; i < global_edit_track_patches.length; i++)
    {
        var option = document.createElement("option");
        var patch = global_edit_track_patches[i];
        option.text = patch.name;
        patch_selector.add(option);
    }
    patch_selector.selectedIndex = 0;
}

function get_patch_from_selector(id)
{
    var patch_index = document.getElementById(id).selectedIndex;
    if (patch_index == 0)
    {
        patch_index = 1;
    }

    return parseInt(global_edit_track_patches[patch_index - 1].index);
}

function patch_selector_onchange()
{
    var new_channel = parseInt(document.getElementById('edit_track_channel_select').value) - 1;
    var new_patch = get_patch_from_selector('edit_track_patch_select');
    play_patch_change(new_channel, new_patch);
}


function save_track_info()
{
    var new_name = document.getElementById('new_track_name').value;
    var new_channel = parseInt(document.getElementById('edit_track_channel_select').value) - 1;
    var new_patch = get_patch_from_selector('edit_track_patch_select');
    output('save_track_info ' + new_name + ' channel ' + new_channel + ' patch ' + new_patch);
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
    change_track_info(parseInt(global_edit_track_index), new_name, new_channel, new_patch);
    play_patch_change(new_channel, new_patch);
    global_edit_track_index = -1;
    global_edit_track_patches = [];
}

function save_new_track_info()
{
    var new_name = document.getElementById('new_track_name').value;
    var new_channel = parseInt(document.getElementById('edit_track_channel_select').value) - 1;
    var new_patch = get_patch_from_selector('edit_track_patch_select');
    output('save_new_track_info ' + new_name + ' channel ' + new_channel + ' patch ' + new_patch);
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
    create_new_track(parseInt(global_edit_track_index), new_name, parseInt(new_channel), new_patch);
    play_patch_change(new_channel, new_patch);
    global_edit_track_index = -1;
}

function cancel_edit()
{
    output('cancel edit');
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
}


function remove_track_info()
{
    output('remove_track_info ' + global_edit_track_index);
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
    remove_track(parseInt(global_edit_track_index));
    global_edit_track_index = -1;
}

function ctrl_onopen()
{
    output("ctrl_onopen");
};

function ctrl_onmessage(e)
{
      // e.data contains received string.
      output("ctrl_onmessage:");
      
      var data = JSON.parse(e.data);
      output("topic: " + data['topic']);
      if (data['topic'] == 'outputter')
      {
          handle_outputter(data['msg']);
      }
      else if (data['topic'] == 'capturer')
      {
          handle_capturer(data['msg']);
      }
      else if (data['topic'] == 'editor')
      {
          handle_editor(data['msg']);
      }
      else if (data['topic'] == 'error')
      {
          output(data['msg']['msg']);
      }
      else if (data['topic'] == 'log')
      {
          output(data['msg']['msg']);
      }
};

function ctrl_onclose()
{
    output("ctrl_onclose");
};

function ctrl_onerror(e)
{
        output("ctrl_onerror");
        console.log(e);        
};


function midi_onopen()
{
    output("midi_onopen");
};

function midi_onmessage(e)
{
    // e.data contains received string.
//     output("midi_onmessage: " + e.data);

    var data = JSON.parse(e.data);
    if (data['topic'] == 'time')
    {
        handle_time(data['msg']);
    }
};

function midi_onclose()
{
    output("midi_onclose");
};

function midi_onerror(e)
{
        output("midi_onerror");
        console.log(e);        
};

function init()
{
    // Connect ctrl websocket
    ws_ctrl = new WebSocket("ws://localhost:9001/");
    // Set event handlers.
    ws_ctrl.onopen = ctrl_onopen;
    ws_ctrl.onmessage = ctrl_onmessage;
    ws_ctrl.onclose = ctrl_onclose;
    ws_ctrl.onerror = ctrl_onerror;

    // Connect midi websocket
    ws_midi = new WebSocket("ws://localhost:9001/");
    // Set event handlers.
    ws_midi.onopen = midi_onopen;
    ws_midi.onmessage = midi_onmessage;
    ws_midi.onclose = midi_onclose;
    ws_midi.onerror = midi_onerror;
}
    
function onCloseClick() {
    ws_midi.close();
    ws_ctrl.close();
}
    
function output(str) {
    var log = document.getElementById("log");
    var escaped = str.replace(/&/, "&amp;").replace(/</, "&lt;").replace(/>/, "&gt;").replace(/\"/, "&quot;");
    log.innerHTML = escaped + "<br>" + log.innerHTML;
}

function open_midi_file(filename, content)
{ 
    var cmd;
    var msg;
    var json_message;
    var base64_file = btoa(
      new Uint8Array(content)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

    cmd = { "command" : "open", "what" : "file", "name" : filename, "encoding" : "base64", "content" : base64_file };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}


function save_midi_file(filename=false)
{ 
    var cmd;
    var msg;
    var json_message;
    
    if (filename)
    {
        cmd = { "command" : "save_as", "what" : "file", "filename" : filename };
    }
    else
    {
        cmd = { "command" : "save", "what" : "file" };
    }
    
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}


function save_midi_file_as()
{ 
    edit_file_name(global_file_name);
}

function edit_file_name(proposal)
{
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    
    global_disable_keydownhandler = true;
    var label = document.createTextNode("File name:");
    var input = document.createElement("input");
    input.setAttribute('type', 'text');
    input.id = 'new_file_name';
    input.size = 20;
    input.setAttribute("value", proposal);
    var save = document.createElement("button");
    save.innerText = "Save";
    save.onclick = save_file_name_edit;
    var cancel = document.createElement("button");
    cancel.innerText = "Cancel";
    cancel.onclick = cancel_edit;

    global_edit_elements.push(label);
    global_edit_elements.push(input);
    global_edit_elements.push(save);
    global_edit_elements.push(cancel);

    var menu = document.getElementById("topmenu");
    menu.appendChild(label);
    menu.appendChild(input);
    menu.appendChild(save);
    menu.appendChild(cancel);
}

function save_file_name_edit()
{
    var new_name = document.getElementById('new_file_name').value;
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }
    global_disable_keydownhandler = false;
    save_midi_file(new_name);
}

function select_midi_file()
{    
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/x-midi';

    input.onchange = e => { 

        // getting a hold of the file reference
        var file = e.target.files[0];

        // setting up the reader
        var reader = new FileReader();
        reader.readAsArrayBuffer(file);
        
        // here we tell the reader what to do when it's done reading...
        reader.onload = readerEvent => {
            var content = readerEvent.target.result; // this is the content!
            open_midi_file(file.name, content);
        }
        
    }

    input.click();
}


function download(filename, content)
{
    contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content], {'type':contentType});
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}




function play_midi_file(start)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "play", "start" : start };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function record_midi_file(start, record_area)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "record", "start" : start, "record_area" : record_area };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function stop()
{ 
    var cmd;
    var msg;

    cmd = { "command" : "stop" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function panic()
{ 
    var cmd;
    var msg;

    cmd = { "command" : "panic" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function send_mute_state(muted)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "track", "muted" : muted };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function play_note(channel, note, velocity)
{ 
    var cmd;
    var msg;
    var note_on;
    
    note_on = {"type" : "note_on", "channel" : channel, "note" : note, "velocity" : velocity, "time" : 0};    

    cmd = { "command" : "play_event", "midi_event" : note_on };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function control_change(channel, control, value)
{ 
    var cmd;
    var msg;
    var control_change;
    
    control_change = {"type" : "control_change", "channel" : channel, "control" : control, "value" : value, "time" : 0};    

    cmd = { "command" : "play_event", "midi_event" : control_change };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function program_change(channel, program)
{ 
    var cmd;
    var msg;
    var program_change;
    
    program_change = {"type" : "program_change", "channel" : channel, "program" : program, "time" : 0};

    cmd = { "command" : "play_event", "midi_event" : program_change };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function play_patch_change(channel, patch)
{ 
    var bank = parseInt(patch / 256);
    var program = patch % 256;
    
    control_change(channel, 0, bank);
    program_change(channel, program);
}

function list_input_ports()
{ 
    var cmd;
    var msg;

    cmd = { "command" : "list_input_ports" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function list_output_ports()
{ 
    var cmd;
    var msg;

    cmd = { "command" : "list_output_ports" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function open_output_port(port)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "open_output_port", "port" : port };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function open_input_port(port)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "open_input_port", "port" : port };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function handle_outputter(msg)
{
    if (msg['command'] == 'output_ports')
    {
        handle_outputter_output_ports(msg);
    }
    else
    {
        output("Unknown outputter command '" + msg['command'] + "'");
    }
}

function handle_outputter_output_ports(msg)
{
    select_choice("Select output port:", msg['output_ports'], msg['current_port'], 'select_output_port', output_port_selected);
}

function output_port_selected()
{
    var selector = document.getElementById("select_output_port");
    var value = selector.value;
    output(value);
    selector.remove();

    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }

    open_output_port(value);
}

function handle_capturer(msg)
{
    if (msg['command'] == 'input_ports')
    {
        handle_capturer_input_ports(msg);
    }
    else
    {
        output("Unknown capturer command '" + msg['command'] + "'");
    }
}

function handle_capturer_input_ports(msg)
{
    select_choice("Select input port:", msg['input_ports'], msg['current_port'], 'select_input_port', input_port_selected);
}

function input_port_selected()
{
      var selector = document.getElementById("select_input_port");
      var value = selector.value;
      output(value);
      selector.remove();

      while ((elem = global_edit_elements.pop()))
      {
          elem.remove();
      }

      open_input_port(value);
}

function select_choice(label_text, choice_list, selected, id, onchange)
{
    while ((elem = global_edit_elements.pop()))
    {
        elem.remove();
    }

    var label = document.createTextNode(label_text);
    var selector = document.createElement("SELECT");
    var selected_index = 0;
    var index;
    for (index in choice_list)
    {
        var option = document.createElement("option");
        option.text = choice_list[index];
        selector.add(option);
        if (choice_list[index] == selected)
        {
            selected_index = index;
        }
    }
    selector.selectedIndex = selected_index;
    selector.id = id;
    selector.onchange = onchange;
    var cancel = document.createElement("button");
    cancel.innerText = "Cancel";
    cancel.onclick = cancel_edit;
    global_edit_elements.push(label);
    global_edit_elements.push(selector);
    global_edit_elements.push(cancel);
    var menu = document.getElementById("topmenu");
    menu.appendChild(label);
    menu.appendChild(selector);
    menu.appendChild(cancel);
}

function handle_editor(msg)
{
    if (msg['command'] == 'file_loaded')
    {
        handle_editor_file_loaded(msg);
    }
    else if (msg['command'] == 'load_synth')
    {
        handle_editor_load_synth(msg);
    }
    else if (msg['command'] == 'download')
    {
        handle_editor_download(msg);
    }
    else if (msg['command'] == 'tracks_changed')
    {
        handle_editor_tracks_changed(msg);
    }
    else if (msg['command'] == 'events_selected')
    {
        handle_editor_events_selected(msg);
    }
    else
    {
        output("Unknown editor command '" + msg['command'] + "'");
    }
}

var trackwin_object;
var pianowin_object;

function handle_editor_file_loaded(msg)
{
    output("File name: " + msg['filename']);
    output("File length (seconds): " + msg['file']['length_seconds']);
    output("File length (ticks): " + msg['file']['length_ticks']);
    output("Tracks: " + msg['file']['tracks'].length);

    global_file_name = msg['filename'];

    var song = new funk_song(msg['filename'], msg['file']['ticks_per_beat'], msg['file']['tracks']);

    var trackwin_tracks_frame = document.getElementById("trackwin_tracks_container");
    var trackwin_info_frame = document.getElementById("trackwin_info_container");
    var trackwin_menu_frame = document.getElementById("trackwin_rulers_menu_container");
    var trackwin_rulers_frame = document.getElementById("trackwin_rulers_rulers_container");

    trackwin_object = new trackwin("trackwin", trackwin_menu_frame, trackwin_rulers_frame, trackwin_info_frame, trackwin_tracks_frame, song);

    var pianowin_tracks_frame = document.getElementById("pianowin_tracks_container");
    var pianowin_info_frame = document.getElementById("pianowin_info_container");
    var pianowin_menu_frame = document.getElementById("pianowin_rulers_menu_container");
    var pianowin_rulers_frame = document.getElementById("pianowin_rulers_rulers_container");

    pianowin_object = new pianowin("pianowin", pianowin_menu_frame, pianowin_rulers_frame, pianowin_info_frame, pianowin_tracks_frame, song);
}

function handle_editor_load_synth(msg)
{
    output("Load synth: " + msg.type);

    synth_object = new funk_synth(msg.type, msg.synth);
}

function handle_editor_tracks_changed(msg)
{
    output("Tracks changed: " + msg['tracks'].length + " " + msg['total_num_tracks']);

    trackwin_object._song.update_tracks(msg['tracks'], msg['total_num_tracks']);
    var track_indexes = [];
    for (const track of msg['tracks'])
    {
        track_indexes.push(track.index);
    }
    trackwin_object.update_tracks(track_indexes);
    pianowin_object.update_tracks(track_indexes);
}

function handle_editor_events_selected(msg)
{
    output("Events selected: " + msg['events'].length + " track index: " + msg['track_index']);

    pianowin_object.select_events(msg['track_index'], msg['events']);
}

function base64_decode(b64) {
    const byteCharacters = atob(b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    return new Blob([byteArray], {type: 'application/octet-stream'});
}

function handle_editor_download(msg)
{    
    decoded = base64_decode(msg['content']);
    download(msg['name'], decoded);
    global_file_name = msg['name'];
    trackwin_object._song.update_filename(msg['name']);
    trackwin_object.update_file_info();
}


function handle_time(msg)
{
    trackwin_object.handle_time(msg['t']);
    pianowin_object.handle_time(msg['t']);
}

function base_name(str) {
    if (typeof str !== 'string') return;
    var frags = str.split('.')
    return frags.splice(0,frags.length-1).join('.');    
}

function first_letter_uppercase(str)
{
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function cut_tracks_area(area, remove_space)
{
    var cmd;
    var msg;    

    cmd = { "command" : "cut_tracks_area", "area" : area, "remove_space" : (remove_space ? 1 : 0) };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function paste_tracks_area(from, to, insert_space, merge, cut_or_copy)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "paste_tracks_area",
        "from" : from, 
        "to" : to,
        "insert_space" : (insert_space ? 1 : 0),
        "merge" : (merge ? 1 : 0),
        "cut_or_copy" : cut_or_copy
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function undo_last_tracks_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "undo_last_tracks_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function redo_last_tracks_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "redo_last_tracks_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}



function select_notes_area(area, notes, track_index)
{
    var cmd;
    var msg;    

    cmd = { "command" : "select_notes_area", "track_index" : track_index, "area" : area, "notes" : notes };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function cut_notes(notes, track_index)
{
    var cmd;
    var msg;    

    cmd = { "command" : "cut_notes", "track_index" : track_index, "notes" : notes };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function paste_notes(notes, tick, cut_or_copy, track_index)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "paste_notes",
        "track_index" : track_index,
        "notes" : notes,
        "tick" : tick,
        "cut_or_copy" : cut_or_copy
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function paste_notes_at_mouse(notes, tick, note, cut_or_copy, track_index)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "paste_notes",
        "track_index" : track_index,
        "notes" : notes,
        "tick" : tick,
        "note" : note,
        "cut_or_copy" : cut_or_copy
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function set_note_end(track_index, note, tick)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "set_note_end",
        "track_index" : track_index,
        "note" : note,
        "tick" : tick
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function set_note_velocity(track_index, note, value)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "set_note_velocity",
        "track_index" : track_index,
        "note" : note,
        "value" : value
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function undo_last_notes_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "undo_last_notes_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function redo_last_notes_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "redo_last_notes_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function change_track_info(track_index, new_name, new_channel, new_patch)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "change_track_info",
        "track_index" : track_index,
        "name" : new_name,
        "channel" : new_channel,
        "patch" : new_patch
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function create_new_track(track_index, new_name, new_channel, new_patch)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "create_new_track",
        "track_index" : track_index,
        "name" : new_name,
        "channel" : new_channel,
        "patch" : new_patch
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function remove_track(track_index)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "remove_track",
        "track_index" : track_index
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

