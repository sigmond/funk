var ws_ctrl;
var ws_midi;

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

    cmd = { "command" : "play", "start" : start, "unit" : "seconds" };
    msg = { "topic" : "controller", "msg" : cmd };
    
    json_message = JSON.stringify(msg);

    ws_ctrl.send(json_message);
}

function record_midi_file(start)
{ 
    var cmd;
    var msg;

    cmd = { "command" : "record", "start" : start, "unit" : "seconds" };
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

    var song = new funk_song(msg['file']['length_seconds'], msg['file']['length_ticks'], msg['file']['ticks_per_beat'], msg['file']['tracks']);

    var trackwin_tracks_frame = document.getElementById("trackwin_tracks_container");
    var trackwin_info_frame = document.getElementById("trackwin_info_container");
    var trackwin_menu_frame = document.getElementById("trackwin_rulers_menu_container");
    var trackwin_rulers_frame = document.getElementById("trackwin_rulers_rulers_container");
    trackwin_object = new trackwin(trackwin_menu_frame, trackwin_rulers_frame, trackwin_info_frame, trackwin_tracks_frame, song);

    var pianowin_tracks_frame = document.getElementById("pianowin_tracks_container");
    var pianowin_info_frame = document.getElementById("pianowin_info_container");
    var pianowin_menu_frame = document.getElementById("pianowin_rulers_menu_container");
    var pianowin_rulers_frame = document.getElementById("pianowin_rulers_rulers_container");
    pianowin_object = new pianowin(pianowin_menu_frame, pianowin_rulers_frame, pianowin_info_frame, pianowin_tracks_frame, song);
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
    trackwin_object.handle_time(msg['time'], msg['unit']);
    pianowin_object.handle_time(msg['time'], msg['unit']);
}
