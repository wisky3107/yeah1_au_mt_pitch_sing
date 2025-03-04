#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Converts MIDI files to JSON format
"""

import os
import json
import mido
import argparse
from pathlib import Path

def midi_to_dict(midi_file):
    """Convert a MIDI file to a Python dictionary"""
    midi_data = mido.MidiFile(midi_file)
    
    result = {
        "ticks_per_beat": midi_data.ticks_per_beat,
        "tracks": []
    }
    
    for i, track in enumerate(midi_data.tracks):
        track_dict = {
            "name": track.name if hasattr(track, 'name') else f"Track {i}",
            "messages": []
        }
        
        for msg in track:
            # Convert message to dictionary and handle time
            msg_dict = {}
            if msg.type == 'meta':
                msg_dict["type"] = "meta"
                msg_dict["meta_type"] = msg.type
            else:
                msg_dict["type"] = msg.type
            
            # Add all message attributes except type
            for key, value in msg.dict().items():
                if key != 'type':
                    msg_dict[key] = value
                    
            track_dict["messages"].append(msg_dict)
            
        result["tracks"].append(track_dict)
    
    return result

def convert_midi_to_json(midi_file, output_file=None):
    """Convert a MIDI file to JSON and save it"""
    midi_dict = midi_to_dict(midi_file)
    
    # If no output file is specified, use the same name with .json extension
    if output_file is None:
        midi_path = Path(midi_file)
        output_file = midi_path.with_suffix('.json')
    
    # Save the JSON data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(midi_dict, f, indent=2)
    
    return output_file

def main():
    parser = argparse.ArgumentParser(description='Convert MIDI files to JSON')
    parser.add_argument('midi_file', help='Path to the MIDI file')
    parser.add_argument('-o', '--output', help='Output JSON file (default: same name with .json extension)')
    args = parser.parse_args()
    
    try:
        output_file = convert_midi_to_json(args.midi_file, args.output)
        print(f"Successfully converted {args.midi_file} to {output_file}")
    except Exception as e:
        print(f"Error converting MIDI file: {e}")

if __name__ == '__main__':
    main() 