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
const key_w = 87;
const key_c = 67;
const key_v = 86;
const key_z = 90;
const key_r = 82;
const key_i = 73;
const key_d = 68;
const key_k = 75;
const key_plus = 187;
const key_minus = 189;
const key_up = 38;
const key_down = 40;


var global_ctrl_down = false;
var global_shift_down = false;

function keydownhandler(event)
{
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
        trackwin_object.go_to_start();
    }
    else if (event.keyCode == key_end)
    {
        event.preventDefault();
        trackwin_object.go_to_end();
    }
    else if (event.keyCode == key_space)
    {
        event.preventDefault();
        trackwin_object.play_at_playhead();
    }
    else if (
             (event.keyCode == key_p) ||
             (event.keyCode == key_x) ||
             (event.keyCode == key_w) ||
             (event.keyCode == key_c) ||
             (event.keyCode == key_v) ||
             (event.keyCode == key_z) ||
             (event.keyCode == key_r) ||
             (event.keyCode == key_i) ||
             (event.keyCode == key_d) ||
             (event.keyCode == key_k) ||
             (event.keyCode == key_plus) ||
             (event.keyCode == key_minus) ||
             (event.keyCode == key_up) ||
             (event.keyCode == key_down)
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


function save_midi_file()
{ 
    var cmd;
    var msg;
    var json_message;

    cmd = { "command" : "save", "what" : "file" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
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

function record_midi_file(start)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "record", "start" : start };
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
      select_choice(msg['output_ports'], msg['current_port'], 'select_output_port', output_port_selected);
}

function output_port_selected()
{
      var selector = document.getElementById("select_output_port");
      var value = selector.value;
      output(value);
      selector.remove();
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
      select_choice(msg['input_ports'], msg['current_port'], 'select_input_port', input_port_selected);
}

function input_port_selected()
{
      var selector = document.getElementById("select_input_port");
      var value = selector.value;
      output(value);
      selector.remove();
      open_input_port(value);
}

function select_choice(choice_list, selected, id, onchange)
{
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
      var menu = document.getElementById("topmenu");
      menu.appendChild(selector);
}


function handle_editor(msg)
{
    if (msg['command'] == 'file_loaded')
    {
        handle_editor_file_loaded(msg);
    }
    else if (msg['command'] == 'download')
    {
        handle_editor_download(msg);
    }
    else
    {
        output("Unknown editor command '" + msg['command'] + "'");
    }
}

var trackwin_object;

function handle_editor_file_loaded(msg)
{
    output("File name: " + msg['filename']);
    output("File length (seconds): " + msg['file']['length_seconds']);
    output("File length (ticks): " + msg['file']['length_ticks']);
    output("Tracks: " + msg['file']['tracks'].length);

    var song = new funk_song(msg['filename'], msg['file']['length_seconds'], msg['file']['length_ticks'], msg['file']['ticks_per_beat'], msg['file']['tracks']);

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


function cut_area(area, remove_space)
{
    var cmd;
    var msg;    

    cmd = { "command" : "cut_area", "area" : area, "remove_space" : remove_space };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function clear_area(area, remove_space)
{
    var cmd;
    var msg;    

    cmd = { "command" : "clear_area", "area" : area, "remove_space" : remove_space };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function paste_area(from, to, overwrite_destination, insert_space)
{
    var cmd;
    var msg;    

    cmd = { 
        "command" : "paste_area",
        "from" : from, 
        "to" : to, 
        "overwrite_destination" : overwrite_destination,
        "insert_space" : insert_space
    };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function undo_last_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "undo_last_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function redo_last_edit()
{
    var cmd;
    var msg;    

    cmd = { "command" : "redo_last_edit" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

