# MIDI to JSON Converter

This folder contains scripts to convert MIDI files to JSON format.

## Setup

1. Install the required dependencies:

```
pip install -r requirements.txt
```

## Usage

### Converting a single MIDI file

```
python midi_to_json.py your_midi_file.mid
```

Options:
- `-o, --output`: Specify output JSON file (default: same name with .json extension)

Example:
```
python midi_to_json.py Perfect_EdSheeran_demo.mid
```

### Converting all MIDI files in the directory

```
python convert_all_midis.py
```

This will scan the current directory for all .mid files and convert each one to a JSON file with the same name.

## Output Format

The JSON output includes:
- `ticks_per_beat`: The MIDI file's ticks per beat value
- `tracks`: An array of track objects, each containing:
  - `name`: The track name (or "Track X" if unnamed)
  - `messages`: An array of MIDI messages with their properties 