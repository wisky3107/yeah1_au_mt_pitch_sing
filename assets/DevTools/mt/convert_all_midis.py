#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Utility script to convert all MIDI files in the current directory to JSON format
"""

import os
import glob
from midi_to_json import convert_midi_to_json

def main():
    # Get the directory this script is in
    directory = os.path.dirname(os.path.abspath(__file__))
    
    # Find all .mid files
    midi_files = glob.glob(os.path.join(directory, "*.mid"))
    
    if not midi_files:
        print("No MIDI files found in the current directory.")
        return
    
    print(f"Found {len(midi_files)} MIDI file(s) to convert:")
    
    for midi_file in midi_files:
        try:
            base_name = os.path.basename(midi_file)
            print(f"Converting {base_name}...")
            
            # Convert to JSON with the same name but .json extension
            output_file = convert_midi_to_json(midi_file)
            
            print(f"✓ Successfully converted to {os.path.basename(output_file)}")
        except Exception as e:
            print(f"× Error converting {os.path.basename(midi_file)}: {e}")
    
    print("All conversions completed.")

if __name__ == "__main__":
    main() 